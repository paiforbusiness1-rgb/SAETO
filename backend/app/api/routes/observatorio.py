from __future__ import annotations

from fastapi import APIRouter, Query

from app.modules.observatorio import service
from app.shared.schemas import IndicadorWrite, ReivindicacionWrite

router = APIRouter(prefix="/api/observatorio", tags=["observatorio"])


@router.get("/reivindicaciones")
def listar(
    territorio: str | None = Query(default=None),
    tema: str | None = Query(default=None),
    zona: str | None = Query(default=None),
    fase: str | None = Query(default=None),
    sentido: str | None = Query(default=None),
    fuente: str | None = Query(default=None),
):
    return service.list_reivindicaciones(
        territorio=territorio,
        tema=tema,
        zona=zona,
        fase=fase,
        sentido=sentido,
        fuente=fuente,
    )


@router.post("/reivindicaciones")
def crear(payload: ReivindicacionWrite):
    return service.create_reivindicacion(payload)


@router.get("/reivindicaciones/{slug}")
def detalle(slug: str):
    return service.get_reivindicacion(slug)


@router.put("/reivindicaciones/{slug}")
def actualizar(slug: str, payload: ReivindicacionWrite):
    return service.update_reivindicacion(slug, payload)


@router.delete("/reivindicaciones/{slug}")
def eliminar(slug: str):
    return service.delete_reivindicacion(slug)


@router.get("/indicadores")
def listar_indicadores():
    return service.list_indicadores()


@router.post("/indicadores")
def upsert_indicador(payload: IndicadorWrite):
    return service.upsert_indicador(payload)


@router.delete("/indicadores/{slug}")
def eliminar_indicador(slug: str):
    return service.delete_indicador(slug)
