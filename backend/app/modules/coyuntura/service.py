from __future__ import annotations

from fastapi import HTTPException

from app.modules.observatorio import service as observatorio_service
from app.shared import seed_loader
from app.shared.persistence import slugify
from app.shared.schemas import CoyunturaDetail, CoyunturaSummary, CoyunturaWrite
from app.shared.seguridad import accion_es_sensible, require_sensible


def _nombre(catalog_key: str, slug: str) -> str:
    data = seed_loader.load_coyuntura_catalogos()
    for item in data.get(catalog_key, []):
        if item["slug"] == slug:
            return item["nombre"]
    return slug


def _actor_nombre(slug: str | None) -> str | None:
    if not slug:
        return None
    for item in seed_loader.load_actores_seed()["items"]:
        if item["slug"] == slug:
            return item["nombre"]
    return slug


def _demanda_nombre(slug: str | None) -> str | None:
    if not slug:
        return None
    for item in seed_loader.load_reivindicaciones_seed()["items"]:
        if item["slug"] == slug:
            return f"{item['tema']} / {item['territorio']}"
    return slug


def _enrich(raw: dict) -> CoyunturaSummary:
    return CoyunturaSummary(
        slug=raw["slug"],
        fecha=raw["fecha"],
        actor=raw.get("actor"),
        actor_nombre=_actor_nombre(raw.get("actor")),
        demanda=raw.get("demanda"),
        demanda_nombre=_demanda_nombre(raw.get("demanda")),
        tipo_accion=raw["tipo_accion"],
        tipo_accion_nombre=_nombre("tipos_accion", raw["tipo_accion"]),
        respuesta_gobierno=raw.get("respuesta_gobierno", "no_aplica"),
        reaccion=raw.get("reaccion", "no_aplica"),
    )


def _corredor_meta(corredor_slug: str | None, tramo_slug: str | None) -> tuple[str | None, str | None]:
    if not corredor_slug:
        return None, None
    for corredor in seed_loader.load_corredores().get("corredores", []):
        if corredor["slug"] != corredor_slug:
            continue
        tramo_nombre = None
        if tramo_slug:
            for tramo in corredor.get("tramos", []):
                if tramo["slug"] == tramo_slug:
                    tramo_nombre = tramo["nombre"]
                    break
        return corredor["nombre"], tramo_nombre
    return corredor_slug, tramo_slug


def _detail(raw: dict) -> CoyunturaDetail:
    base = _enrich(raw)
    corredor_nombre, tramo_nombre = _corredor_meta(
        raw.get("corredor_slug"), raw.get("tramo_slug")
    )
    return CoyunturaDetail(
        **base.model_dump(),
        descripcion_accion=raw.get("descripcion_accion", ""),
        detalle_respuesta=raw.get("detalle_respuesta", ""),
        resultado=raw.get("resultado", ""),
        impacto_ciclo=raw.get("impacto_ciclo"),
        fuentes=raw.get("fuentes", []),
        corredor_slug=raw.get("corredor_slug"),
        corredor_nombre=corredor_nombre,
        tramo_slug=raw.get("tramo_slug"),
        tramo_nombre=tramo_nombre,
    )


def list_eventos(
    actor: str | None = None,
    demanda: str | None = None,
) -> list[CoyunturaSummary]:
    items = seed_loader.load_coyuntura_seed().get("items", [])
    out = []
    for raw in items:
        if actor and raw.get("actor") != actor:
            continue
        if demanda and raw.get("demanda") != demanda:
            continue
        out.append(_enrich(raw))
    return sorted(out, key=lambda e: e.fecha, reverse=True)


def get_evento(slug: str) -> CoyunturaDetail:
    for raw in seed_loader.load_coyuntura_seed().get("items", []):
        if raw["slug"] == slug:
            return _detail(raw)
    raise HTTPException(status_code=404, detail="Evento no encontrado")


def _validate(payload: CoyunturaWrite, rol: str = "analista") -> None:
    if not payload.actor and not payload.demanda:
        raise HTTPException(status_code=400, detail="Indique actor y/o demanda")
    if accion_es_sensible(payload.tipo_accion):
        require_sensible(rol, "acción de tipología violenta")
    if payload.actor:
        actores = {a["slug"] for a in seed_loader.load_actores_seed()["items"]}
        if payload.actor not in actores:
            raise HTTPException(status_code=400, detail="Actor no existe")
    if payload.demanda:
        demandas = {d["slug"] for d in seed_loader.load_reivindicaciones_seed()["items"]}
        if payload.demanda not in demandas:
            raise HTTPException(status_code=400, detail="Demanda no existe")
    if payload.impacto_ciclo:
        fases = {f["slug"] for f in seed_loader.load_ciclo_vital()["fases"]}
        if payload.impacto_ciclo not in fases:
            raise HTTPException(status_code=400, detail="Impacto de ciclo inválido")
    if payload.corredor_slug:
        corredores = {c["slug"]: c for c in seed_loader.load_corredores().get("corredores", [])}
        if payload.corredor_slug not in corredores:
            raise HTTPException(status_code=400, detail="Corredor no existe en catálogo")
        if payload.tramo_slug:
            tramos = {t["slug"] for t in corredores[payload.corredor_slug].get("tramos", [])}
            if payload.tramo_slug not in tramos:
                raise HTTPException(status_code=400, detail="Tramo no pertenece al corredor")


def _to_raw(payload: CoyunturaWrite, slug: str) -> dict:
    return {
        "slug": slug,
        "fecha": payload.fecha,
        "actor": payload.actor,
        "demanda": payload.demanda,
        "tipo_accion": payload.tipo_accion,
        "descripcion_accion": payload.descripcion_accion.strip(),
        "respuesta_gobierno": payload.respuesta_gobierno,
        "detalle_respuesta": payload.detalle_respuesta.strip(),
        "reaccion": payload.reaccion,
        "resultado": payload.resultado.strip(),
        "impacto_ciclo": payload.impacto_ciclo,
        "fuentes": payload.fuentes,
        "corredor_slug": payload.corredor_slug,
        "tramo_slug": payload.tramo_slug,
    }


def create_evento(payload: CoyunturaWrite, rol: str = "analista") -> CoyunturaDetail:
    _validate(payload, rol=rol)
    data = seed_loader.load_coyuntura_seed()
    items = list(data.get("items", []))
    slug = slugify(payload.slug or f"evt-{payload.tipo_accion}-{payload.fecha}")
    if any(i["slug"] == slug for i in items):
        raise HTTPException(status_code=409, detail="Ya existe ese evento")
    items.append(_to_raw(payload, slug))
    seed_loader.save_coyuntura_seed({"demo": True, "items": items})
    return get_evento(slug)


def update_evento(
    slug: str, payload: CoyunturaWrite, rol: str = "analista"
) -> CoyunturaDetail:
    _validate(payload, rol=rol)
    data = seed_loader.load_coyuntura_seed()
    items = list(data.get("items", []))
    idx = next((i for i, it in enumerate(items) if it["slug"] == slug), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    new_slug = slugify(payload.slug or slug)
    items[idx] = _to_raw(payload, new_slug)
    seed_loader.save_coyuntura_seed({"demo": True, "items": items})
    return get_evento(new_slug)


def delete_evento(slug: str) -> dict:
    data = seed_loader.load_coyuntura_seed()
    items = [it for it in data.get("items", []) if it["slug"] != slug]
    if len(items) == len(data.get("items", [])):
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    seed_loader.save_coyuntura_seed({"demo": True, "items": items})
    return {"ok": True, "slug": slug}


def aplicar_fase_propuesta(slug: str) -> dict:
    """Operador confirma el impacto_ciclo del evento sobre la demanda ligada."""
    evento = get_evento(slug)
    if not evento.demanda:
        raise HTTPException(
            status_code=400,
            detail="Este evento no está ligado a una demanda",
        )
    if not evento.impacto_ciclo:
        raise HTTPException(
            status_code=400,
            detail="No hay fase propuesta en este evento. Edítelo y elija impacto en ciclo.",
        )
    reiv = observatorio_service.aplicar_fase_ciclo(
        evento.demanda,
        evento.impacto_ciclo,
        fecha=evento.fecha,
        origen=f"coyuntura:{slug}",
        nota=f"Confirmado desde evento {evento.tipo_accion_nombre}",
    )
    return {
        "ok": True,
        "evento": slug,
        "demanda": reiv.slug,
        "fase_aplicada": reiv.fase_ciclo_vital,
        "fase_nombre": reiv.fase_ciclo_nombre,
        "demanda_nombre": f"{reiv.tema_nombre} / {reiv.territorio_nombre}",
    }
