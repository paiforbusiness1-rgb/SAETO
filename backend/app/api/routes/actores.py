from fastapi import APIRouter

from app.modules.actores import service
from app.shared.schemas import ActorWrite

router = APIRouter(prefix="/api/actores", tags=["actores"])


@router.get("")
def listar():
    return service.list_actores()


@router.post("")
def crear(payload: ActorWrite):
    return service.create_actor(payload)


@router.get("/{slug}")
def detalle(slug: str):
    return service.get_actor(slug)


@router.put("/{slug}")
def actualizar(slug: str, payload: ActorWrite):
    return service.update_actor(slug, payload)


@router.delete("/{slug}")
def eliminar(slug: str):
    return service.delete_actor(slug)
