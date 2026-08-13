"""Priorización de cobertura analítica de mesa (no patrullaje)."""

from __future__ import annotations

from app.modules.actores import service as actores_service
from app.modules.inteligencia import calor_service
from app.modules.inteligencia.schemas import SectorCobertura
from app.shared import seed_loader


def _recomendacion_for(prioridad: int) -> tuple[str, str]:
    items = sorted(
        seed_loader.load_cobertura_recomendaciones().get("recomendaciones", []),
        key=lambda x: -int(x.get("prioridad_min", 0)),
    )
    for item in items:
        if prioridad >= int(item.get("prioridad_min", 1)):
            return item["slug"], item["nombre"]
    if items:
        return items[-1]["slug"], items[-1]["nombre"]
    return "monitoreo", "Monitoreo regular"


def _prioridad_from_banda(banda: str, score: float) -> int:
    mapping = {"muy_alta": 5, "alta": 4, "media": 3, "baja": 2}
    base = mapping.get(banda, 1)
    if score >= 90:
        return 5
    return base


def list_cobertura() -> list[SectorCobertura]:
    calor = calor_service.mapa_calor(capa="compuesta")
    actores = actores_service.list_actores()
    out: list[SectorCobertura] = []
    for celda in calor.celdas:
        prioridad = _prioridad_from_banda(celda.banda, celda.score)
        rec_slug, rec_nombre = _recomendacion_for(prioridad)
        actores_sector = [
            a.nombre for a in actores if a.colonia == celda.colonia_slug
        ][:4]
        motivo = (
            f"Calor {celda.banda_nombre.lower()} (score {celda.score}). "
            f"Aporte principal: {max(celda.desglose, key=celda.desglose.get) if celda.desglose else 'n/d'}."
        )
        out.append(
            SectorCobertura(
                sector_slug=celda.colonia_slug or celda.zona_slug,
                sector_nombre=celda.colonia_nombre or celda.zona_nombre,
                zona_slug=celda.zona_slug,
                zona_nombre=celda.zona_nombre,
                prioridad=prioridad,
                banda=celda.banda,
                score=celda.score,
                motivo=motivo,
                recomendacion=rec_slug,
                recomendacion_nombre=rec_nombre,
                actores_a_revisar=actores_sector,
            )
        )
    return sorted(out, key=lambda s: (-s.prioridad, -s.score))
