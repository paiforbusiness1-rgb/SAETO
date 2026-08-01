from __future__ import annotations

from fastapi import HTTPException

from app.shared import seed_loader
from app.shared.enrich import actor_detail, enrich_actor
from app.shared.persistence import slugify
from app.shared.schemas import ActorDetail, ActorSummary, ActorWrite
from app.shared.seguridad import (
    recursos_sensibles,
    require_sensible,
    rol_ve_sensible,
    tipo_actor_es_sensible,
)


def list_actores(rol: str = "analista") -> list[ActorSummary]:
    return [
        enrich_actor(item, include_sensible=rol_ve_sensible(rol))
        for item in seed_loader.load_actores_seed()["items"]
    ]


def get_actor(slug: str, rol: str = "analista") -> ActorDetail:
    for item in seed_loader.load_actores_seed()["items"]:
        if item["slug"] == slug:
            if rol_ve_sensible(rol) and item.get("interes_reservado"):
                seed_loader.append_audit(
                    {
                        "accion": "leer_interes_reservado",
                        "recurso": f"actor:{slug}",
                        "rol": rol,
                    }
                )
            return actor_detail(item, include_sensible=rol_ve_sensible(rol))
    raise HTTPException(status_code=404, detail="Actor no encontrado")


def _validate_refs(payload: ActorWrite, rol: str = "analista") -> None:
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
    if payload.capacidad_comprobada is not None:
        if not payload.fecha_comprobacion or not payload.metodo_comprobacion:
            raise HTTPException(
                status_code=400,
                detail="Movilización comprobada requiere fecha y método de comprobación",
            )
    if tipo_actor_es_sensible(payload.tipo_actor):
        require_sensible(rol, "tipo de actor generador de violencia")
    sens = recursos_sensibles(payload.recursos_poder)
    if sens:
        require_sensible(rol, f"recursos sensibles: {', '.join(sens)}")
    if (payload.interes_reservado or "").strip():
        require_sensible(rol, "interés reservado")


def _to_raw(payload: ActorWrite, slug: str) -> dict:
    estimada = payload.capacidad_estimada
    if estimada is None:
        estimada = payload.capacidad_movilizacion or 0
    display = (
        payload.capacidad_comprobada
        if payload.capacidad_comprobada is not None
        else estimada
    )
    return {
        "slug": slug,
        "nombre": payload.nombre.strip(),
        "colonia": payload.colonia,
        "zona": payload.zona,
        "rol": payload.rol.strip(),
        "organizacion": payload.organizacion.strip(),
        "capacidad_movilizacion": display,
        "capacidad_estimada": estimada,
        "capacidad_comprobada": payload.capacidad_comprobada,
        "fecha_comprobacion": payload.fecha_comprobacion,
        "metodo_comprobacion": payload.metodo_comprobacion,
        "tipo_actor": payload.tipo_actor,
        "reivindicaciones_abiertas": payload.reivindicaciones_abiertas,
        "estado_verificacion": payload.estado_verificacion,
        "notas_mesa": payload.notas_mesa.strip(),
        "interes_declarado": payload.interes_declarado.strip(),
        "interes_reservado": payload.interes_reservado.strip(),
        "recursos_poder": payload.recursos_poder,
        "notas_poder": payload.notas_poder.strip(),
    }


def create_actor(payload: ActorWrite, rol: str = "analista") -> ActorDetail:
    _validate_refs(payload, rol=rol)
    data = seed_loader.load_actores_seed()
    items = list(data["items"])
    slug = (payload.slug or slugify(payload.nombre)).strip()
    if any(i["slug"] == slug for i in items):
        raise HTTPException(status_code=409, detail="Ya existe un actor con ese identificador")
    items.append(_to_raw(payload, slug))
    seed_loader.save_actores_seed({"demo": True, "items": items})
    return get_actor(slug, rol=rol)


def update_actor(slug: str, payload: ActorWrite, rol: str = "analista") -> ActorDetail:
    _validate_refs(payload, rol=rol)
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
    return get_actor(new_slug, rol=rol)


def delete_actor(slug: str) -> dict:
    data = seed_loader.load_actores_seed()
    items = [it for it in data["items"] if it["slug"] != slug]
    if len(items) == len(data["items"]):
        raise HTTPException(status_code=404, detail="Actor no encontrado")
    seed_loader.save_actores_seed({"demo": True, "items": items})
    return {"ok": True, "slug": slug}
