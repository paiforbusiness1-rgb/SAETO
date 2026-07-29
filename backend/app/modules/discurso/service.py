from __future__ import annotations

from fastapi import HTTPException

from app.shared import seed_loader
from app.shared.persistence import slugify
from app.shared.schemas import DiscursoDetail, DiscursoSummary, DiscursoWrite


def _actor_nombre(slug: str) -> str:
    for item in seed_loader.load_actores_seed()["items"]:
        if item["slug"] == slug:
            return item["nombre"]
    return slug


def list_discursos() -> list[DiscursoSummary]:
    return [
        DiscursoSummary(
            slug=item["slug"],
            actor=item["actor"],
            actor_nombre=_actor_nombre(item["actor"]),
            topico_principal=item["topico_principal"],
            subtopicos=item["subtopicos"],
            audiencia=item["audiencia"],
        )
        for item in seed_loader.load_discurso_seed()["items"]
    ]


def get_discurso(slug: str) -> DiscursoDetail:
    for item in seed_loader.load_discurso_seed()["items"]:
        if item["slug"] == slug:
            return DiscursoDetail(
                slug=item["slug"],
                actor=item["actor"],
                actor_nombre=_actor_nombre(item["actor"]),
                topico_principal=item["topico_principal"],
                subtopicos=item["subtopicos"],
                audiencia=item["audiencia"],
                niveles=item["niveles"],
                niveles_meta=seed_loader.load_discurso_niveles()["niveles"],
            )
    raise HTTPException(status_code=404, detail="Pieza de discurso no encontrada")


def _validate_refs(payload: DiscursoWrite) -> None:
    actores = {a["slug"] for a in seed_loader.load_actores_seed()["items"]}
    if payload.actor not in actores:
        raise HTTPException(status_code=400, detail="Actor no existe")


def _to_raw(payload: DiscursoWrite, slug: str) -> dict:
    nivel_slugs = [n["slug"] for n in seed_loader.load_discurso_niveles()["niveles"]]
    niveles = {k: (payload.niveles.get(k) or "").strip() for k in nivel_slugs}
    return {
        "slug": slug,
        "actor": payload.actor,
        "topico_principal": payload.topico_principal.strip(),
        "subtopicos": [s.strip() for s in payload.subtopicos if s.strip()],
        "audiencia": payload.audiencia.strip(),
        "niveles": niveles,
    }


def create_discurso(payload: DiscursoWrite) -> DiscursoDetail:
    _validate_refs(payload)
    data = seed_loader.load_discurso_seed()
    items = list(data["items"])
    slug = slugify(payload.slug or f"discurso-{payload.actor}-{payload.topico_principal[:24]}")
    if any(i["slug"] == slug for i in items):
        raise HTTPException(status_code=409, detail="Ya existe esa pieza de discurso")
    items.append(_to_raw(payload, slug))
    seed_loader.save_discurso_seed({"demo": True, "items": items})
    return get_discurso(slug)


def update_discurso(slug: str, payload: DiscursoWrite) -> DiscursoDetail:
    _validate_refs(payload)
    data = seed_loader.load_discurso_seed()
    items = list(data["items"])
    idx = next((i for i, it in enumerate(items) if it["slug"] == slug), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Pieza de discurso no encontrada")
    new_slug = slugify(payload.slug or slug)
    if new_slug != slug and any(it["slug"] == new_slug for it in items):
        raise HTTPException(status_code=409, detail="Ya existe esa pieza de discurso")
    items[idx] = _to_raw(payload, new_slug)
    seed_loader.save_discurso_seed({"demo": True, "items": items})
    return get_discurso(new_slug)


def delete_discurso(slug: str) -> dict:
    data = seed_loader.load_discurso_seed()
    items = [it for it in data["items"] if it["slug"] != slug]
    if len(items) == len(data["items"]):
        raise HTTPException(status_code=404, detail="Pieza de discurso no encontrada")
    seed_loader.save_discurso_seed({"demo": True, "items": items})
    return {"ok": True, "slug": slug}
