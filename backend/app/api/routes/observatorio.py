from fastapi import APIRouter, Query

from app.modules.observatorio import service
from app.shared.schemas import ReivindicacionWrite

router = APIRouter(prefix="/api/observatorio", tags=["observatorio"])


@router.get("/reivindicaciones")
def listar(
    territorio: str | None = Query(default=None),
    tema: str | None = Query(default=None),
    zona: str | None = Query(default=None),
):
    return service.list_reivindicaciones(territorio=territorio, tema=tema, zona=zona)


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
