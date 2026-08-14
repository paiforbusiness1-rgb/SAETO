"""Plantillas HRU de contexto y recomendaciones de mesa (sin LLM)."""

from __future__ import annotations

from app.modules.cuarto.schemas import ContextoAnalista
from app.shared import seed_loader


def contexto(tema: str) -> ContextoAnalista:
    bloque = seed_loader.load_cuarto_contexto_plantillas().get("por_tema", {}).get(tema) or {}
    factores = [str(x) for x in (bloque.get("factores") or []) if str(x).strip()]
    return ContextoAnalista(
        texto=str(bloque.get("contexto") or "").strip(),
        factores=factores,
    )


def recomendaciones(tema: str) -> list[str]:
    por_tema = seed_loader.load_cuarto_recomendaciones().get("por_tema", {})
    items = por_tema.get(tema) or []
    return [str(x) for x in items if str(x).strip()]
