from __future__ import annotations

from fastapi import APIRouter, Header, Query

from app.modules.actores import service
from app.shared.schemas import ActorWrite
from app.shared.seguridad import normalize_rol

router = APIRouter(prefix="/api/actores", tags=["actores"])


def _rol(x_saeto_rol: str | None, rol: str | None) -> str:
    return normalize_rol(rol or x_saeto_rol)


@router.get("")
def listar(
    rol: str | None = Query(default=None),
    x_saeto_rol: str | None = Header(default=None, alias="X-SAETO-Rol"),
):
    return service.list_actores(rol=_rol(x_saeto_rol, rol))


@router.post("")
def crear(
    payload: ActorWrite,
    rol: str | None = Query(default=None),
    x_saeto_rol: str | None = Header(default=None, alias="X-SAETO-Rol"),
):
    return service.create_actor(payload, rol=_rol(x_saeto_rol, rol))


@router.get("/{slug}")
def detalle(
    slug: str,
    rol: str | None = Query(default=None),
    x_saeto_rol: str | None = Header(default=None, alias="X-SAETO-Rol"),
):
    return service.get_actor(slug, rol=_rol(x_saeto_rol, rol))


@router.put("/{slug}")
def actualizar(
    slug: str,
    payload: ActorWrite,
    rol: str | None = Query(default=None),
    x_saeto_rol: str | None = Header(default=None, alias="X-SAETO-Rol"),
):
    return service.update_actor(slug, payload, rol=_rol(x_saeto_rol, rol))


@router.delete("/{slug}")
def eliminar(slug: str):
    return service.delete_actor(slug)
