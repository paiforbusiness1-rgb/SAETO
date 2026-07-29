from __future__ import annotations

from fastapi import HTTPException

from app.shared import seed_loader
from app.shared.enrich import enrich_reivindicacion, reivindicacion_detail
from app.shared.persistence import slugify
from app.shared.schemas import ReivindicacionDetail, ReivindicacionSummary, ReivindicacionWrite


def list_reivindicaciones(
    territorio: str | None = None,
    tema: str | None = None,
    zona: str | None = None,
) -> list[ReivindicacionSummary]:
    items = seed_loader.load_reivindicaciones_seed()["items"]
    result: list[ReivindicacionSummary] = []
    for raw in items:
        if territorio and raw["territorio"] != territorio:
            continue
        if tema and raw["tema"] != tema:
            continue
        if zona and raw["zona"] != zona:
            continue
        result.append(enrich_reivindicacion(raw))
    return sorted(result, key=lambda r: (-r.intensidad, -r.peso_opinion))


def get_reivindicacion(slug: str) -> ReivindicacionDetail:
    for item in seed_loader.load_reivindicaciones_seed()["items"]:
        if item["slug"] == slug:
            return reivindicacion_detail(item)
    raise HTTPException(status_code=404, detail="Reivindicación no encontrada")


def _validate_refs(payload: ReivindicacionWrite) -> None:
    if not 1 <= payload.intensidad <= 5:
        raise HTTPException(status_code=400, detail="Intensidad debe ser entre 1 y 5")
    if not 0 <= payload.peso_opinion <= 100:
        raise HTTPException(status_code=400, detail="Peso de opinión debe ser 0–100")
    colonias = {c["slug"] for c in seed_loader.load_territorio()["colonias_demo"]}
    zonas = {z["slug"] for z in seed_loader.load_territorio()["zonas"]}
    temas = {t["slug"] for t in seed_loader.load_catalogo_reivindicaciones()["temas"]}
    if payload.territorio not in colonias:
        raise HTTPException(status_code=400, detail="Colonia no existe en catálogo")
    if payload.zona not in zonas:
        raise HTTPException(status_code=400, detail="Zona no existe en catálogo")
    if payload.tema not in temas:
        raise HTTPException(status_code=400, detail="Tema no existe en catálogo")


def _to_raw(payload: ReivindicacionWrite, slug: str) -> dict:
    return {
        "slug": slug,
        "tema": payload.tema,
        "territorio": payload.territorio,
        "zona": payload.zona,
        "intensidad": payload.intensidad,
        "deuda_historica": payload.deuda_historica,
        "resumen_deuda": payload.resumen_deuda.strip(),
        "fuente": payload.fuente,
        "peso_opinion": payload.peso_opinion,
    }


def create_reivindicacion(payload: ReivindicacionWrite) -> ReivindicacionDetail:
    _validate_refs(payload)
    data = seed_loader.load_reivindicaciones_seed()
    items = list(data["items"])
    base = payload.slug or f"{payload.tema}-{payload.territorio}"
    slug = slugify(base)
    if any(i["slug"] == slug for i in items):
        raise HTTPException(status_code=409, detail="Ya existe esa reivindicación")
    items.append(_to_raw(payload, slug))
    seed_loader.save_reivindicaciones_seed({"demo": True, "items": items})
    return get_reivindicacion(slug)


def update_reivindicacion(slug: str, payload: ReivindicacionWrite) -> ReivindicacionDetail:
    _validate_refs(payload)
    data = seed_loader.load_reivindicaciones_seed()
    items = list(data["items"])
    idx = next((i for i, it in enumerate(items) if it["slug"] == slug), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Reivindicación no encontrada")
    new_slug = slugify(payload.slug or slug)
    if new_slug != slug and any(it["slug"] == new_slug for it in items):
        raise HTTPException(status_code=409, detail="Ya existe esa reivindicación")
    items[idx] = _to_raw(payload, new_slug)
    seed_loader.save_reivindicaciones_seed({"demo": True, "items": items})
    return get_reivindicacion(new_slug)


def delete_reivindicacion(slug: str) -> dict:
    data = seed_loader.load_reivindicaciones_seed()
    items = [it for it in data["items"] if it["slug"] != slug]
    if len(items) == len(data["items"]):
        raise HTTPException(status_code=404, detail="Reivindicación no encontrada")
    seed_loader.save_reivindicaciones_seed({"demo": True, "items": items})
    return {"ok": True, "slug": slug}
