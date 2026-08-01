from __future__ import annotations

from app.modules.actores import service as actores_service
from app.modules.observatorio import service as observatorio_service
from app.shared import seed_loader
from app.shared.enrich import enrich_reivindicacion


def reporte_ejecutivo() -> dict:
    reivs = observatorio_service.list_reivindicaciones()
    actores = actores_service.list_actores()

    semaforo = {"verde": 0, "amarillo": 0, "rojo": 0}
    por_tema: dict[str, dict] = {}
    score_total = 0.0

    for r in reivs:
        semaforo[r.semaforo] = semaforo.get(r.semaforo, 0) + 1
        score = r.intensidad * (r.peso_opinion / 100)
        score_total += score
        bucket = por_tema.setdefault(
            r.tema,
            {
                "tema": r.tema,
                "tema_nombre": r.tema_nombre,
                "count": 0,
                "score": 0.0,
                "max_intensidad": 0,
            },
        )
        bucket["count"] += 1
        bucket["score"] += score
        bucket["max_intensidad"] = max(bucket["max_intensidad"], r.intensidad)

    temas_series = sorted(por_tema.values(), key=lambda x: -x["score"])
    top = sorted(reivs, key=lambda r: (-r.intensidad, -r.peso_opinion))[:5]

    return {
        "demo": True,
        "kpis": {
            "reivindicaciones": len(reivs),
            "actores": len(actores),
            "capacidad_movilizacion_total": sum(a.capacidad_movilizacion for a in actores),
            "rojos": semaforo["rojo"],
            "amarillos": semaforo["amarillo"],
            "verdes": semaforo["verde"],
            "deudas_historicas": sum(1 for r in reivs if r.deuda_historica),
            "score_presion": round(score_total, 1),
        },
        "semaforo": [
            {"clave": "rojo", "etiqueta": "Prioridad alta", "valor": semaforo["rojo"]},
            {"clave": "amarillo", "etiqueta": "Atención", "valor": semaforo["amarillo"]},
            {"clave": "verde", "etiqueta": "Contención", "valor": semaforo["verde"]},
        ],
        "por_tema": [{**t, "score": round(t["score"], 1)} for t in temas_series],
        "top_reivindicaciones": [
            {
                "slug": r.slug,
                "tema_nombre": r.tema_nombre,
                "territorio_nombre": r.territorio_nombre,
                "zona_nombre": r.zona_nombre,
                "intensidad": r.intensidad,
                "semaforo": r.semaforo,
                "semaforo_etiqueta": r.semaforo_etiqueta,
                "peso_opinion": r.peso_opinion,
                "deuda_historica": r.deuda_historica,
            }
            for r in top
        ],
        "lectura_gerencial": _lectura_ejecutiva(semaforo, temas_series, actores),
    }


def reporte_territorio() -> dict:
    reivs = observatorio_service.list_reivindicaciones()
    territorio = seed_loader.load_territorio()
    zona_nombres = {z["slug"]: z["nombre"] for z in territorio["zonas"]}
    colonia_nombres = {c["slug"]: c["nombre"] for c in territorio["colonias_demo"]}

    por_zona: dict[str, dict] = {}
    por_colonia: dict[str, dict] = {}

    for r in reivs:
        score = r.intensidad * (r.peso_opinion / 100)
        z = por_zona.setdefault(
            r.zona,
            {
                "zona": r.zona,
                "zona_nombre": zona_nombres.get(r.zona, r.zona_nombre),
                "count": 0,
                "score": 0.0,
                "rojos": 0,
            },
        )
        z["count"] += 1
        z["score"] += score
        if r.semaforo == "rojo":
            z["rojos"] += 1

        c = por_colonia.setdefault(
            r.territorio,
            {
                "territorio": r.territorio,
                "territorio_nombre": colonia_nombres.get(
                    r.territorio, r.territorio_nombre
                ),
                "zona": r.zona,
                "zona_nombre": zona_nombres.get(r.zona, r.zona_nombre),
                "count": 0,
                "score": 0.0,
                "max_intensidad": 0,
            },
        )
        c["count"] += 1
        c["score"] += score
        c["max_intensidad"] = max(c["max_intensidad"], r.intensidad)

    zonas = sorted(
        ({**v, "score": round(v["score"], 1)} for v in por_zona.values()),
        key=lambda x: -x["score"],
    )
    colonias = sorted(
        ({**v, "score": round(v["score"], 1)} for v in por_colonia.values()),
        key=lambda x: -x["score"],
    )

    return {
        "demo": True,
        "por_zona": zonas,
        "por_colonia": colonias[:12],
        "lectura_gerencial": (
            f"Mayor presión en {zonas[0]['zona_nombre']}."
            if zonas
            else "Sin reivindicaciones cargadas."
        ),
    }


def reporte_actores() -> dict:
    actores = sorted(
        actores_service.list_actores(),
        key=lambda a: -a.movilizacion_display,
    )
    total = sum(a.movilizacion_display for a in actores) or 1
    ranking = [
        {
            "slug": a.slug,
            "nombre": a.nombre,
            "organizacion": a.organizacion,
            "colonia_nombre": a.colonia_nombre,
            "zona_nombre": a.zona_nombre,
            "capacidad_movilizacion": a.capacidad_movilizacion,
            "capacidad_estimada": a.capacidad_estimada,
            "capacidad_comprobada": a.capacidad_comprobada,
            "movilizacion_display": a.movilizacion_display,
            "movilizacion_fuente": a.movilizacion_fuente,
            "share": round(100 * a.movilizacion_display / total, 1),
            "estado_verificacion": a.estado_verificacion,
            "reivindicaciones_abiertas": a.reivindicaciones_abiertas,
        }
        for a in actores
    ]
    comprobados = sum(1 for a in actores if a.capacidad_comprobada is not None)
    return {
        "demo": True,
        "capacidad_total": sum(a.movilizacion_display for a in actores),
        "kpis": {
            "actores": len(actores),
            "con_comprobada": comprobados,
            "solo_estimada": len(actores) - comprobados,
        },
        "ranking": ranking,
        "lectura_gerencial": (
            f"{ranking[0]['nombre']} concentra la mayor capacidad "
            f"({ranking[0]['movilizacion_display']} · {ranking[0]['movilizacion_fuente']}, "
            f"{ranking[0]['share']}%)."
            if ranking
            else "Sin actores cargados."
        ),
    }


def reporte_ciclo_vital() -> dict:
    reivs = observatorio_service.list_reivindicaciones()
    fases_meta = {
        f["slug"]: f["nombre"] for f in seed_loader.load_ciclo_vital().get("fases", [])
    }
    por_fase: dict[str, dict] = {}
    por_sentido = {"escalando": 0, "estable": 0, "desescalando": 0}
    for r in reivs:
        bucket = por_fase.setdefault(
            r.fase_ciclo_vital,
            {
                "fase": r.fase_ciclo_vital,
                "fase_nombre": fases_meta.get(r.fase_ciclo_vital, r.fase_ciclo_nombre),
                "count": 0,
                "escalando": 0,
            },
        )
        bucket["count"] += 1
        if r.sentido_ciclo == "escalando":
            bucket["escalando"] += 1
        por_sentido[r.sentido_ciclo] = por_sentido.get(r.sentido_ciclo, 0) + 1

    series = sorted(por_fase.values(), key=lambda x: -x["count"])
    top = sorted(reivs, key=lambda r: (-r.grado_escalamiento, -r.intensidad))[:8]
    return {
        "demo": True,
        "kpis": {
            "total": len(reivs),
            "escalando": por_sentido.get("escalando", 0),
            "desescalando": por_sentido.get("desescalando", 0),
            "estable": por_sentido.get("estable", 0),
        },
        "por_fase": series,
        "por_sentido": [
            {"clave": k, "etiqueta": k.replace("_", " ").title(), "valor": v}
            for k, v in por_sentido.items()
        ],
        "top": [
            {
                "slug": r.slug,
                "tema_nombre": r.tema_nombre,
                "territorio_nombre": r.territorio_nombre,
                "fase_ciclo_nombre": r.fase_ciclo_nombre,
                "sentido_ciclo": r.sentido_ciclo,
                "grado_escalamiento": r.grado_escalamiento,
                "semaforo": r.semaforo,
            }
            for r in top
        ],
        "lectura_gerencial": (
            f"{por_sentido.get('escalando', 0)} focos escalando; "
            f"fase dominante: {series[0]['fase_nombre']}."
            if series
            else "Sin reivindicaciones cargadas."
        ),
    }


def reporte_coyuntura() -> dict:
    from app.modules.coyuntura import service as coyuntura_service

    eventos = coyuntura_service.list_eventos()
    por_tipo: dict[str, dict] = {}
    for e in eventos:
        b = por_tipo.setdefault(
            e.tipo_accion,
            {"tipo": e.tipo_accion, "tipo_nombre": e.tipo_accion_nombre, "count": 0},
        )
        b["count"] += 1
    series = sorted(por_tipo.values(), key=lambda x: -x["count"])
    return {
        "demo": True,
        "kpis": {"eventos": len(eventos)},
        "por_tipo": series,
        "timeline": [
            {
                "slug": e.slug,
                "fecha": e.fecha,
                "tipo_accion_nombre": e.tipo_accion_nombre,
                "actor_nombre": e.actor_nombre,
                "demanda_nombre": e.demanda_nombre,
                "respuesta_gobierno": e.respuesta_gobierno,
                "reaccion": e.reaccion,
            }
            for e in eventos[:20]
        ],
        "lectura_gerencial": (
            f"{len(eventos)} eventos en bitácora; acción más frecuente: {series[0]['tipo_nombre']}."
            if series
            else "Sin eventos de coyuntura. Captura acciones para armar el CÓMO."
        ),
    }


def reporte_discurso_mesa() -> dict:
    from app.modules.discurso import service as discurso_service

    items = discurso_service.list_discursos()
    emociones: dict[str, int] = {}
    for d in items:
        for emo in d.emociones:
            emociones[emo] = emociones.get(emo, 0) + 1
    emo_series = sorted(
        [{"clave": k, "valor": v} for k, v in emociones.items()],
        key=lambda x: -x["valor"],
    )
    return {
        "demo": True,
        "kpis": {"piezas": len(items)},
        "emociones": emo_series,
        "piezas": [
            {
                "slug": d.slug,
                "actor_nombre": d.actor_nombre,
                "topico_principal": d.topico_principal,
                "narrativas": d.narrativas,
                "ideologia": d.ideologia,
                "emociones": d.emociones,
            }
            for d in items
        ],
        "lectura_gerencial": (
            f"Emoción dominante en mesa: {emo_series[0]['clave']}."
            if emo_series
            else "Sin piezas de discurso con rúbricas de mesa."
        ),
    }


def reporte_contexto_inegi() -> dict:
    indicadores = observatorio_service.list_indicadores()
    reivs = observatorio_service.list_reivindicaciones()
    por_territorio: dict[str, dict] = {}
    for ind in indicadores:
        b = por_territorio.setdefault(
            ind.territorio,
            {
                "territorio": ind.territorio,
                "territorio_nombre": ind.territorio_nombre,
                "indicadores": [],
            },
        )
        b["indicadores"].append(
            {
                "clave": ind.clave,
                "nombre": ind.nombre,
                "valor": ind.valor,
                "anio": ind.anio,
                "fuente": ind.fuente,
            }
        )

    # Brecha lectura: percepción local (peso/intensidad) vs indicador referencial
    por_terr_reiv: dict[str, list] = {}
    for r in reivs:
        por_terr_reiv.setdefault(r.territorio, []).append(r)

    brechas = []
    for terr, inds in por_territorio.items():
        local = por_terr_reiv.get(terr, [])
        if not local:
            continue
        top = max(local, key=lambda x: (x.peso_opinion, x.intensidad))
        for ind in inds["indicadores"]:
            try:
                valor_num = float(ind["valor"])
            except (TypeError, ValueError):
                valor_num = None
            lectura = (
                "Alta percepción local vs indicador contextual — priorizar verificación de campo."
                if top.peso_opinion >= 70 and (valor_num is None or valor_num < 80)
                else "Contexto disponible; contrastar con evidencia in situ."
            )
            brechas.append(
                {
                    "territorio": terr,
                    "territorio_nombre": inds["territorio_nombre"],
                    "demanda_slug": top.slug,
                    "demanda": f"{top.tema_nombre} · {top.territorio_nombre}",
                    "peso_opinion": top.peso_opinion,
                    "intensidad": top.intensidad,
                    "semaforo": top.semaforo,
                    "indicador": ind["nombre"],
                    "valor_indicador": ind["valor"],
                    "anio": ind["anio"],
                    "lectura": lectura,
                }
            )

    return {
        "demo": True,
        "disclaimer": (
            "Indicadores referenciales (demo). No son levantamiento SAETO ni sustituyen "
            "la lectura de campo; sirven solo como contexto estadístico. "
            "La 'brecha' es una lectura orientativa de mesa, no un índice estadístico oficial."
        ),
        "kpis": {
            "indicadores": len(indicadores),
            "territorios": len(por_territorio),
            "brechas": len(brechas),
        },
        "por_territorio": list(por_territorio.values()),
        "brechas": brechas,
        "lectura_gerencial": (
            f"{len(brechas)} cruces percepción–contexto en {len(por_territorio)} colonias."
            if brechas
            else (
                f"{len(indicadores)} indicadores referenciales; "
                "cargue demandas e indicadores en el mismo territorio para ver brechas."
                if indicadores
                else "Sin indicadores de contexto cargados."
            )
        ),
    }


def reporte_deudas() -> dict:
    raw_items = seed_loader.load_reivindicaciones_seed()["items"]
    enriched = [(item, enrich_reivindicacion(item)) for item in raw_items]
    con_deuda = [(raw, r) for raw, r in enriched if r.deuda_historica]
    sin_deuda = [(raw, r) for raw, r in enriched if not r.deuda_historica]
    ranking = sorted(con_deuda, key=lambda pair: (-pair[1].intensidad, -pair[1].peso_opinion))
    total = len(enriched)

    return {
        "demo": True,
        "kpis": {
            "con_deuda": len(con_deuda),
            "sin_deuda": len(sin_deuda),
            "pct_deuda": round(100 * len(con_deuda) / total, 1) if total else 0,
        },
        "comparativo": [
            {
                "clave": "deuda_historica",
                "etiqueta": "Cuentas pendientes",
                "valor": len(con_deuda),
            },
            {
                "clave": "sin_deuda",
                "etiqueta": "Sin deuda marcada",
                "valor": len(sin_deuda),
            },
        ],
        "ranking": [
            {
                "slug": r.slug,
                "tema_nombre": r.tema_nombre,
                "territorio_nombre": r.territorio_nombre,
                "zona_nombre": r.zona_nombre,
                "intensidad": r.intensidad,
                "semaforo": r.semaforo,
                "semaforo_etiqueta": r.semaforo_etiqueta,
                "resumen_deuda": raw.get("resumen_deuda", ""),
                "peso_opinion": r.peso_opinion,
            }
            for raw, r in ranking
        ],
        "lectura_gerencial": (
            f"{len(con_deuda)} cuentas pendientes activas; "
            f"priorizar {ranking[0][1].tema_nombre} en {ranking[0][1].territorio_nombre}."
            if ranking
            else "No hay deudas históricas marcadas."
        ),
    }


def _lectura_ejecutiva(semaforo: dict, temas: list, actores: list) -> str:
    if not temas and not actores:
        return "Sin datos cargados. Usa Captura para alimentar el tablero."
    partes = []
    if semaforo.get("rojo", 0):
        partes.append(f"{semaforo['rojo']} focos en rojo requieren atención inmediata.")
    if temas:
        partes.append(f"Mayor presión temática: {temas[0]['tema_nombre']}.")
    if actores:
        top = max(actores, key=lambda a: a.capacidad_movilizacion)
        partes.append(
            f"Actor con mayor movilización: {top.nombre} (~{top.capacidad_movilizacion})."
        )
    return " ".join(partes)
