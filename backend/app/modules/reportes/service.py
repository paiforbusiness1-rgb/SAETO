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
        key=lambda a: -a.capacidad_movilizacion,
    )
    total = sum(a.capacidad_movilizacion for a in actores) or 1
    ranking = [
        {
            "slug": a.slug,
            "nombre": a.nombre,
            "organizacion": a.organizacion,
            "colonia_nombre": a.colonia_nombre,
            "zona_nombre": a.zona_nombre,
            "capacidad_movilizacion": a.capacidad_movilizacion,
            "share": round(100 * a.capacidad_movilizacion / total, 1),
            "estado_verificacion": a.estado_verificacion,
            "reivindicaciones_abiertas": a.reivindicaciones_abiertas,
        }
        for a in actores
    ]
    return {
        "demo": True,
        "capacidad_total": sum(a.capacidad_movilizacion for a in actores),
        "ranking": ranking,
        "lectura_gerencial": (
            f"{ranking[0]['nombre']} concentra la mayor capacidad de movilización "
            f"({ranking[0]['capacidad_movilizacion']} personas, {ranking[0]['share']}%)."
            if ranking
            else "Sin actores cargados."
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
