from __future__ import annotations

from fastapi import HTTPException

from app.shared import seed_loader
from app.shared.schemas import (
    ActorDetail,
    ActorSummary,
    ReivindicacionDetail,
    ReivindicacionSummary,
    SemaforoInfo,
)


def resolve_semaforo(intensidad: int) -> SemaforoInfo:
    for band in seed_loader.load_umbrales()["intensidad"]:
        if band["min"] <= intensidad <= band["max"]:
            return SemaforoInfo(
                semaforo=band["semaforo"],
                etiqueta=band["etiqueta"],
                intensidad=intensidad,
            )
    raise HTTPException(status_code=500, detail="Umbral de semáforo no configurado")


def _colonia_nombre(slug: str) -> str:
    for item in seed_loader.load_territorio()["colonias_demo"]:
        if item["slug"] == slug:
            return item["nombre"]
    return slug


def _zona_nombre(slug: str) -> str:
    for item in seed_loader.load_territorio()["zonas"]:
        if item["slug"] == slug:
            return item["nombre"]
    return slug


def _tema_nombre(slug: str) -> str:
    for item in seed_loader.load_catalogo_reivindicaciones()["temas"]:
        if item["slug"] == slug:
            return item["nombre"]
    return slug


def enrich_actor(raw: dict) -> ActorSummary:
    return ActorSummary(
        slug=raw["slug"],
        nombre=raw["nombre"],
        colonia=raw["colonia"],
        zona=raw["zona"],
        colonia_nombre=_colonia_nombre(raw["colonia"]),
        zona_nombre=_zona_nombre(raw["zona"]),
        rol=raw["rol"],
        organizacion=raw["organizacion"],
        capacidad_movilizacion=raw["capacidad_movilizacion"],
        estado_verificacion=raw["estado_verificacion"],
        reivindicaciones_abiertas=raw["reivindicaciones_abiertas"],
    )


def actor_detail(raw: dict) -> ActorDetail:
    base = enrich_actor(raw)
    return ActorDetail(
        **base.model_dump(),
        notas_mesa=raw["notas_mesa"],
        reivindicaciones_nombres=[_tema_nombre(t) for t in raw["reivindicaciones_abiertas"]],
    )


def enrich_reivindicacion(raw: dict) -> ReivindicacionSummary:
    sem = resolve_semaforo(raw["intensidad"])
    return ReivindicacionSummary(
        slug=raw["slug"],
        tema=raw["tema"],
        tema_nombre=_tema_nombre(raw["tema"]),
        territorio=raw["territorio"],
        territorio_nombre=_colonia_nombre(raw["territorio"]),
        zona=raw["zona"],
        zona_nombre=_zona_nombre(raw["zona"]),
        intensidad=raw["intensidad"],
        semaforo=sem.semaforo,
        semaforo_etiqueta=sem.etiqueta,
        deuda_historica=raw["deuda_historica"],
        peso_opinion=raw["peso_opinion"],
        fuente=raw["fuente"],
    )


def reivindicacion_detail(raw: dict) -> ReivindicacionDetail:
    base = enrich_reivindicacion(raw)
    return ReivindicacionDetail(**base.model_dump(), resumen_deuda=raw["resumen_deuda"])
