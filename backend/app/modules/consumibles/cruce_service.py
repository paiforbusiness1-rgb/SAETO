"""Cruce demográfico-electoral × problemática territorial."""

from __future__ import annotations

from app.modules.consumibles import tematicos_service as tem
from app.modules.consumibles.schemas import CeldaConsumible
from app.shared import seed_loader


def _norm_densidad(densidad: float, max_d: float) -> float:
    if max_d <= 0:
        return 0.0
    return min(100.0, (densidad / max_d) * 100.0)


def _indice_electoral(drow: dict) -> float:
    return float(drow.get("indice_electoral") or drow.get("indice_electoral_demo") or 0)


def celdas_cruce(tema: str) -> list[CeldaConsumible]:
    cfg = seed_loader.load_consumibles_cruce()
    pesos = cfg.get("pesos") or {}
    w_p = float(pesos.get("problema", 0.5))
    w_e = float(pesos.get("electoral", 0.3))
    w_d = float(pesos.get("densidad", 0.2))

    tematicas = {c.colonia_slug: c for c in tem.celdas_tematicas(tema)}
    demo = tem.demografia_map()
    densidades = [float(d.get("densidad_hab_km2") or 0) for d in demo.values()]
    max_d = max(densidades) if densidades else 1.0

    out: list[CeldaConsumible] = []
    for slug, base in tematicas.items():
        drow = demo.get(slug, {})
        intensidad = float(base.intensidad_tema or base.score)
        electoral = _indice_electoral(drow)
        dens_n = _norm_densidad(float(drow.get("densidad_hab_km2") or 0), max_d)
        score = round(w_p * intensidad + w_e * electoral + w_d * dens_n, 1)
        band = tem._banda(score, cfg)
        out.append(
            CeldaConsumible(
                colonia_slug=slug,
                colonia_nombre=base.colonia_nombre,
                zona_slug=base.zona_slug,
                zona_nombre=base.zona_nombre,
                score=score,
                banda_slug=band["slug"],
                banda_nombre=band["nombre"],
                color=band["color"],
                intensidad_tema=intensidad,
                indice_electoral=electoral,
                densidad=float(drow.get("densidad_hab_km2") or 0) or None,
                metrica_clave=base.metrica_clave,
                metrica_valor=base.metrica_valor,
                nota_mesa=base.nota_mesa,
            )
        )
    out.sort(key=lambda c: c.score, reverse=True)
    return out


def tabla_cruce(celdas: list[CeldaConsumible]) -> list[dict]:
    return [
        {
            "colonia": c.colonia_nombre,
            "zona": c.zona_nombre,
            "problema": c.intensidad_tema,
            "electoral": c.indice_electoral,
            "densidad": c.densidad,
            "cruce": c.score,
            "banda": c.banda_nombre,
        }
        for c in celdas
    ]
