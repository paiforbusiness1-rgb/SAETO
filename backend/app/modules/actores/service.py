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
    ve = rol_ve_sensible(rol)
    out: list[ActorSummary] = []
    for item in seed_loader.load_actores_seed()["items"]:
        if tipo_actor_es_sensible(item.get("tipo_actor")) and not ve:
            continue
        out.append(enrich_actor(item, include_sensible=ve))
    return out


def get_actor(slug: str, rol: str = "analista") -> ActorDetail:
    for item in seed_loader.load_actores_seed()["items"]:
        if item["slug"] == slug:
            ve = rol_ve_sensible(rol)
            if tipo_actor_es_sensible(item.get("tipo_actor")) and not ve:
                raise HTTPException(
                    status_code=404,
                    detail="Actor no encontrado o requiere rol Analista sensible / Admin",
                )
            if ve and (
                item.get("interes_reservado")
                or item.get("red_afiliacion")
                or item.get("cuenta_pendiente_seguridad")
            ):
                seed_loader.append_audit(
                    {
                        "accion": "leer_ficha_inteligencia",
                        "recurso": f"actor:{slug}",
                        "rol": rol,
                    }
                )
            return actor_detail(item, include_sensible=ve)
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
    if (payload.red_afiliacion or "").strip() or (payload.cuenta_pendiente_seguridad or "").strip():
        require_sensible(rol, "campos de inteligencia de actor")
    if payload.nivel_riesgo:
        niveles = {n["slug"]: n for n in seed_loader.load_actor_inteligencia().get("niveles_riesgo", [])}
        if payload.nivel_riesgo not in niveles:
            raise HTTPException(status_code=400, detail="Nivel de riesgo no válido")
        if niveles[payload.nivel_riesgo].get("sensible"):
            require_sensible(rol, "nivel de riesgo sensible")
    if payload.fuente_inteligencia:
        fuentes = {f["slug"] for f in seed_loader.load_actor_inteligencia().get("fuentes_inteligencia", [])}
        if payload.fuente_inteligencia not in fuentes:
            raise HTTPException(status_code=400, detail="Fuente de inteligencia no válida")
    for zop in payload.zona_operacion:
        if zop not in colonias:
            raise HTTPException(status_code=400, detail=f"Zona de operación inválida: {zop}")


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
        "alias": [a.strip() for a in payload.alias if a.strip()],
        "zona_operacion": payload.zona_operacion,
        "red_afiliacion": payload.red_afiliacion.strip(),
        "nivel_riesgo": payload.nivel_riesgo,
        "cuenta_pendiente_seguridad": payload.cuenta_pendiente_seguridad.strip(),
        "fuente_inteligencia": payload.fuente_inteligencia,
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
