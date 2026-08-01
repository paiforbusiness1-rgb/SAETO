from __future__ import annotations

from fastapi import HTTPException

from app.modules.actores import service as actores_service
from app.modules.observatorio import service as observatorio_service
from app.shared import seed_loader
from app.shared.schemas import BriefResponse, BriefWrite


def get_brief() -> BriefResponse:
    seed = seed_loader.load_brief_seed()
    actores_by_slug = {a.slug: a for a in actores_service.list_actores()}
    reivs_by_slug = {r.slug: r for r in observatorio_service.list_reivindicaciones()}

    actores_clave = [
        actores_by_slug[slug]
        for slug in seed["actores_clave_slugs"]
        if slug in actores_by_slug
    ]
    reivs_top = [
        reivs_by_slug[slug]
        for slug in seed["reivindicaciones_top_slugs"]
        if slug in reivs_by_slug
    ]

    conteo = {"verde": 0, "amarillo": 0, "rojo": 0}
    conteo_ciclo: dict[str, int] = {}
    escalando = 0
    for r in observatorio_service.list_reivindicaciones():
        conteo[r.semaforo] = conteo.get(r.semaforo, 0) + 1
        conteo_ciclo[r.fase_ciclo_vital] = conteo_ciclo.get(r.fase_ciclo_vital, 0) + 1
        if r.sentido_ciclo == "escalando":
            escalando += 1

    return BriefResponse(
        demo=True,
        resumen_ejecutivo=seed["resumen_ejecutivo"],
        alertas_coyuntura=seed["alertas_coyuntura"],
        actores_clave=actores_clave,
        reivindicaciones_top=reivs_top,
        conteo_semaforo=conteo,
        conteo_ciclo=conteo_ciclo,
        escalando=escalando,
    )


def get_brief_raw() -> dict:
    return seed_loader.load_brief_seed()


def update_brief(payload: BriefWrite) -> BriefResponse:
    actores = {a.slug for a in actores_service.list_actores()}
    reivs = {r.slug for r in observatorio_service.list_reivindicaciones()}
    for slug in payload.actores_clave_slugs:
        if slug not in actores:
            raise HTTPException(status_code=400, detail=f"Actor no existe: {slug}")
    for slug in payload.reivindicaciones_top_slugs:
        if slug not in reivs:
            raise HTTPException(status_code=400, detail=f"Reivindicación no existe: {slug}")

    seed_loader.save_brief_seed(
        {
            "demo": True,
            "resumen_ejecutivo": payload.resumen_ejecutivo.strip(),
            "alertas_coyuntura": [a.strip() for a in payload.alertas_coyuntura if a.strip()],
            "actores_clave_slugs": payload.actores_clave_slugs,
            "reivindicaciones_top_slugs": payload.reivindicaciones_top_slugs,
        }
    )
    return get_brief()
