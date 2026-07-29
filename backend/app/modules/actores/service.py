from __future__ import annotations

from fastapi import HTTPException

from app.shared import seed_loader
from app.shared.enrich import actor_detail, enrich_actor
from app.shared.persistence import slugify
from app.shared.schemas import ActorDetail, ActorSummary, ActorWrite


def list_actores() -> list[ActorSummary]:
    return [enrich_actor(item) for item in seed_loader.load_actores_seed()["items"]]


def get_actor(slug: str) -> ActorDetail:
    for item in seed_loader.load_actores_seed()["items"]:
        if item["slug"] == slug:
            return actor_detail(item)
    raise HTTPException(status_code=404, detail="Actor no encontrado")


def _validate_refs(payload: ActorWrite) -> None:
    colonias = {c["slug"] for c in seed_loader.load_territorio()["colonias_demo"]}
    zonas = {z["slug"] for z in seed_loader.load_territorio()["zonas"]}
    temas = {t["slug"] for t in seed_loader.load_catalogo_reivindicaciones()["temas"]}
    if payload.colonia not in colonias:
        raise HTTPException(status_code=400, detail="Colonia no existe en catálogo")
    if payload.zona not in zonas:
        raise HTTPException(status_code=400, detail="Zona no existe en catálogo")
    for tema in payload.reivindicaciones_abiertas:
        if tema not in temas:
            raise HTTPException(status_code=400, detail=f"Tema no existe: {tema}")


def _to_raw(payload: ActorWrite, slug: str) -> dict:
    return {
        "slug": slug,
        "nombre": payload.nombre.strip(),
        "colonia": payload.colonia,
        "zona": payload.zona,
        "rol": payload.rol.strip(),
        "organizacion": payload.organizacion.strip(),
        "capacidad_movilizacion": payload.capacidad_movilizacion,
        "reivindicaciones_abiertas": payload.reivindicaciones_abiertas,
        "estado_verificacion": payload.estado_verificacion,
        "notas_mesa": payload.notas_mesa.strip(),
    }


def create_actor(payload: ActorWrite) -> ActorDetail:
    _validate_refs(payload)
    data = seed_loader.load_actores_seed()
    items = list(data["items"])
    slug = (payload.slug or slugify(payload.nombre)).strip()
    if any(i["slug"] == slug for i in items):
        raise HTTPException(status_code=409, detail="Ya existe un actor con ese identificador")
    items.append(_to_raw(payload, slug))
    seed_loader.save_actores_seed({"demo": True, "items": items})
    return get_actor(slug)


def update_actor(slug: str, payload: ActorWrite) -> ActorDetail:
    _validate_refs(payload)
    data = seed_loader.load_actores_seed()
    items = list(data["items"])
    idx = next((i for i, it in enumerate(items) if it["slug"] == slug), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Actor no encontrado")
    new_slug = (payload.slug or slug).strip()
    if new_slug != slug and any(it["slug"] == new_slug for it in items):
        raise HTTPException(status_code=409, detail="Ya existe un actor con ese identificador")
    items[idx] = _to_raw(payload, new_slug)
    seed_loader.save_actores_seed({"demo": True, "items": items})
    return get_actor(new_slug)


def delete_actor(slug: str) -> dict:
    data = seed_loader.load_actores_seed()
    items = [it for it in data["items"] if it["slug"] != slug]
    if len(items) == len(data["items"]):
        raise HTTPException(status_code=404, detail="Actor no encontrado")
    seed_loader.save_actores_seed({"demo": True, "items": items})
    return {"ok": True, "slug": slug}
