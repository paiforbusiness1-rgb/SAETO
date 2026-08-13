"""Router IA — solo despacho."""

from fastapi import APIRouter, Header

from app.modules.ia import clasificar_texto, contexto_decision, panorama_lectura
from app.modules.ia import get_status
from app.modules.ia.schemas import (
    ClasificarTextoRequest,
    ContextoDecisionRequest,
    PanoramaLecturaRequest,
)

router = APIRouter(prefix="/api/ia", tags=["ia"])


@router.get("/status")
def status():
    return get_status()


@router.post("/panorama-lectura")
def panorama_lectura_endpoint(
    payload: PanoramaLecturaRequest,
    x_saeto_rol: str | None = Header(default=None, alias="X-SAETO-Rol"),
):
    return panorama_lectura.generar(payload, rol=x_saeto_rol)


@router.post("/clasificar-texto")
def clasificar_texto_endpoint(
    payload: ClasificarTextoRequest,
    x_saeto_rol: str | None = Header(default=None, alias="X-SAETO-Rol"),
):
    return clasificar_texto.generar(payload, rol=x_saeto_rol)


@router.post("/contexto-decision")
def contexto_decision_endpoint(
    payload: ContextoDecisionRequest,
    x_saeto_rol: str | None = Header(default=None, alias="X-SAETO-Rol"),
):
    return contexto_decision.generar(payload, rol=x_saeto_rol)
