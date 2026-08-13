"""Ranking de corredores y tramos críticos."""

from __future__ import annotations

from fastapi import HTTPException

from app.modules.coyuntura import service as coyuntura_service
from app.modules.inteligencia.schemas import CorredorRanking
from app.modules.observatorio import service as observatorio_service
from app.shared import seed_loader


def list_corredores_catalogo() -> dict:
    return seed_loader.load_corredores()


def _colonias_de_corredor(corredor: dict) -> set[str]:
    out: set[str] = set()
    for tramo in corredor.get("tramos", []):
        out.update(tramo.get("colonias", []))
    return out


def ranking_corredores() -> list[CorredorRanking]:
    reivs = observatorio_service.list_reivindicaciones()
    eventos = coyuntura_service.list_eventos()
    raw_eventos = seed_loader.load_coyuntura_seed().get("items", [])
    by_slug = {e["slug"]: e for e in raw_eventos}

    out: list[CorredorRanking] = []
    for corredor in seed_loader.load_corredores().get("corredores", []):
        colonias = _colonias_de_corredor(corredor)
        demandas = [r for r in reivs if r.territorio in colonias]
        n_eventos = 0
        for ev in eventos:
            raw = by_slug.get(ev.slug, {})
            if raw.get("corredor_slug") == corredor["slug"]:
                n_eventos += 1
                continue
            if ev.demanda and any(r.slug == ev.demanda and r.territorio in colonias for r in reivs):
                n_eventos += 1
        score = n_eventos * 15.0 + sum(r.grado_escalamiento for r in demandas) * 8.0
        out.append(
            CorredorRanking(
                slug=corredor["slug"],
                nombre=corredor["nombre"],
                tipo=corredor.get("tipo", "eje_vial"),
                alcaldias=corredor.get("alcaldias", []),
                eventos=n_eventos,
                demandas=len(demandas),
                score_presion=round(score, 1),
                tramos=corredor.get("tramos", []),
            )
        )
    return sorted(out, key=lambda c: -c.score_presion)


def get_corredor(slug: str) -> CorredorRanking:
    for item in ranking_corredores():
        if item.slug == slug:
            return item
    raise HTTPException(status_code=404, detail="Corredor no encontrado")
