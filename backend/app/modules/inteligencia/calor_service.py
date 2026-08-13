"""Cálculo de mapa de calor territorial (solo composición; sin master data)."""

from __future__ import annotations

from app.modules.actores import service as actores_service
from app.modules.coyuntura import service as coyuntura_service
from app.modules.encuestas import service as encuestas_service
from app.modules.inteligencia.schemas import CeldaCalor, MapaCalorResponse
from app.modules.observatorio import service as observatorio_service
from app.shared import seed_loader


def _banda_for(score: float) -> dict:
    for band in seed_loader.load_umbrales_calor().get("bandas", []):
        if band["min"] <= score <= band["max"]:
            return band
    bands = seed_loader.load_umbrales_calor().get("bandas", [])
    return bands[-1] if bands else {"slug": "baja", "nombre": "Baja", "color": "#3dba7c"}


def _capa_meta(capa: str) -> dict:
    for item in seed_loader.load_calor_capas().get("capas", []):
        if item["slug"] == capa:
            return item
    return {"slug": capa, "nombre": capa, "peso": 1.0}


def _scores_por_colonia() -> dict[str, dict[str, float]]:
    territorio = seed_loader.load_territorio()
    colonias = {c["slug"]: c for c in territorio.get("colonias_demo", [])}
    scores: dict[str, dict[str, float]] = {
        slug: {"reivindicaciones": 0.0, "coyuntura": 0.0, "movilizacion": 0.0, "percepcion": 0.0}
        for slug in colonias
    }

    for r in observatorio_service.list_reivindicaciones():
        if r.territorio not in scores:
            continue
        scores[r.territorio]["reivindicaciones"] += float(r.grado_escalamiento) * 12.0
        if r.sentido_ciclo == "escalando":
            scores[r.territorio]["reivindicaciones"] += 10.0

    demanda_colonia = {
        r.slug: r.territorio for r in observatorio_service.list_reivindicaciones()
    }
    for ev in coyuntura_service.list_eventos():
        colonia = None
        if ev.demanda and ev.demanda in demanda_colonia:
            colonia = demanda_colonia[ev.demanda]
        elif ev.actor:
            for a in actores_service.list_actores():
                if a.slug == ev.actor:
                    colonia = a.colonia
                    break
        if colonia and colonia in scores:
            peso = 18.0 if ev.tipo_accion in ("bloqueo", "manifestacion", "violencia") else 12.0
            scores[colonia]["coyuntura"] += peso

    for a in actores_service.list_actores():
        if a.colonia in scores:
            scores[a.colonia]["movilizacion"] += min(float(a.movilizacion_display), 100.0) * 0.45

    try:
        for enc in encuestas_service.list_encuestas():
            if enc.colonia not in scores:
                continue
            scores[enc.colonia]["percepcion"] += 8.0
            prioridades = getattr(enc, "problemas_prioridad", None) or []
            scores[enc.colonia]["percepcion"] += min(len(prioridades), 3) * 4.0
    except Exception:
        pass

    return scores


def _celda(
    *,
    colonia_slug: str | None,
    colonia_nombre: str,
    zona_slug: str,
    zona_nombre: str,
    capa: str,
    score: float,
    desglose: dict[str, float],
) -> CeldaCalor:
    band = _banda_for(score)
    return CeldaCalor(
        colonia_slug=colonia_slug,
        colonia_nombre=colonia_nombre,
        zona_slug=zona_slug,
        zona_nombre=zona_nombre,
        territorio_slug=colonia_slug or zona_slug,
        capa=capa,
        score=round(score, 1),
        banda=band["slug"],
        banda_nombre=band.get("nombre", band["slug"]),
        color=band.get("color", ""),
        desglose={k: round(v, 1) for k, v in desglose.items()},
    )


def mapa_calor(capa: str = "compuesta", top_n: int = 10) -> MapaCalorResponse:
    capas_cfg = seed_loader.load_calor_capas()
    capa = (capa or "compuesta").strip()
    meta = _capa_meta(capa)
    pesos = {
        c["slug"]: float(c.get("peso", 1.0))
        for c in capas_cfg.get("capas", [])
        if c["slug"] != "compuesta"
    }
    territorio = seed_loader.load_territorio()
    zona_nombres = {z["slug"]: z["nombre"] for z in territorio.get("zonas", [])}
    colonias = territorio.get("colonias_demo", [])
    raw_scores = _scores_por_colonia()

    celdas: list[CeldaCalor] = []
    for col in colonias:
        slug = col["slug"]
        partes = raw_scores.get(
            slug,
            {"reivindicaciones": 0.0, "coyuntura": 0.0, "movilizacion": 0.0, "percepcion": 0.0},
        )
        if capa == "compuesta":
            score = sum(partes[k] * pesos.get(k, 1.0) for k in partes)
            desglose = {k: partes[k] * pesos.get(k, 1.0) for k in partes}
        else:
            score = float(partes.get(capa, 0.0))
            desglose = {capa: score}
        celdas.append(
            _celda(
                colonia_slug=slug,
                colonia_nombre=col["nombre"],
                zona_slug=col["zona"],
                zona_nombre=zona_nombres.get(col["zona"], col["zona"]),
                capa=capa,
                score=min(score, 120.0),
                desglose=desglose,
            )
        )

    por_zona_acc: dict[str, dict[str, float]] = {}
    for c in celdas:
        bucket = por_zona_acc.setdefault(c.zona_slug, {"score": 0.0, "n": 0.0})
        bucket["score"] += c.score
        bucket["n"] += 1.0
    por_zona: list[CeldaCalor] = []
    for zona_slug, agg in por_zona_acc.items():
        avg = agg["score"] / max(agg["n"], 1.0)
        por_zona.append(
            _celda(
                colonia_slug=None,
                colonia_nombre="",
                zona_slug=zona_slug,
                zona_nombre=zona_nombres.get(zona_slug, zona_slug),
                capa=capa,
                score=avg,
                desglose={"promedio_colonias": avg},
            )
        )

    ordenadas = sorted(celdas, key=lambda x: -x.score)
    return MapaCalorResponse(
        demo=True,
        capa=capa,
        capa_nombre=meta.get("nombre", capa),
        periodo_dias=int(capas_cfg.get("ventana_dias_default", 120)),
        bandas=seed_loader.load_umbrales_calor().get("bandas", []),
        celdas=celdas,
        por_zona=sorted(por_zona, key=lambda x: -x.score),
        top=ordenadas[: max(1, top_n)],
    )


def top_calor(n: int = 10, capa: str = "compuesta") -> list[CeldaCalor]:
    return mapa_calor(capa=capa, top_n=n).top
