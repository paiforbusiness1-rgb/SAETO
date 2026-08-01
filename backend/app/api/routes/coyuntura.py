from __future__ import annotations

from fastapi import APIRouter, Header, Query

from app.modules.coyuntura import service
from app.shared.schemas import CoyunturaWrite
from app.shared.seguridad import normalize_rol

router = APIRouter(prefix="/api/coyuntura", tags=["coyuntura"])


def _rol(x_saeto_rol: str | None, rol: str | None) -> str:
    return normalize_rol(rol or x_saeto_rol)


@router.get("")
def listar(
    actor: str | None = Query(default=None),
    demanda: str | None = Query(default=None),
):
    return service.list_eventos(actor=actor, demanda=demanda)


@router.post("")
def crear(
    payload: CoyunturaWrite,
    rol: str | None = Query(default=None),
    x_saeto_rol: str | None = Header(default=None, alias="X-SAETO-Rol"),
):
    return service.create_evento(payload, rol=_rol(x_saeto_rol, rol))


@router.get("/{slug}")
def detalle(slug: str):
    return service.get_evento(slug)


@router.put("/{slug}")
def actualizar(
    slug: str,
    payload: CoyunturaWrite,
    rol: str | None = Query(default=None),
    x_saeto_rol: str | None = Header(default=None, alias="X-SAETO-Rol"),
):
    return service.update_evento(slug, payload, rol=_rol(x_saeto_rol, rol))


@router.post("/{slug}/aplicar-fase")
def aplicar_fase(slug: str):
    return service.aplicar_fase_propuesta(slug)


@router.delete("/{slug}")
def eliminar(slug: str):
    return service.delete_evento(slug)
