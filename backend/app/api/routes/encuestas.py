from __future__ import annotations

from fastapi import APIRouter, Query

from app.modules.encuestas import service
from app.shared.schemas import EncuestaWrite

router = APIRouter(prefix="/api/encuestas", tags=["encuestas"])


@router.get("/plantillas")
def plantillas():
    return service.list_plantillas()


@router.get("/plantillas/{slug}")
def plantilla_detalle(slug: str):
    return service.get_plantilla(slug)


@router.get("")
def listar(
    colonia: str | None = Query(default=None),
    plantilla: str | None = Query(default=None),
):
    return service.list_encuestas(colonia=colonia, plantilla=plantilla)


@router.post("")
def crear(payload: EncuestaWrite):
    return service.create_encuesta(payload)


@router.get("/{slug}")
def detalle(slug: str):
    return service.get_encuesta(slug)


@router.put("/{slug}")
def actualizar(slug: str, payload: EncuestaWrite):
    return service.update_encuesta(slug, payload)


@router.delete("/{slug}")
def eliminar(slug: str):
    return service.delete_encuesta(slug)
