from fastapi import APIRouter

from app.modules.discurso import service
from app.shared.schemas import DiscursoWrite

router = APIRouter(prefix="/api/discurso", tags=["discurso"])


@router.get("")
def listar():
    return service.list_discursos()


@router.post("")
def crear(payload: DiscursoWrite):
    return service.create_discurso(payload)


@router.get("/{slug}")
def detalle(slug: str):
    return service.get_discurso(slug)


@router.put("/{slug}")
def actualizar(slug: str, payload: DiscursoWrite):
    return service.update_discurso(slug, payload)


@router.delete("/{slug}")
def eliminar(slug: str):
    return service.delete_discurso(slug)
