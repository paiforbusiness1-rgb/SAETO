"""Router inteligencia — solo despacho."""

from fastapi import APIRouter, Header, Query

from app.modules.inteligencia import (
    calor_service,
    cobertura_service,
    corredores_service,
    evaluaciones_service,
    panorama_service,
    sala_service,
)
from app.modules.inteligencia.schemas import EvaluacionMesaWrite
from app.shared import seed_loader

router = APIRouter(prefix="/api/inteligencia", tags=["inteligencia"])


@router.get("/calor")
def get_calor(
    capa: str = Query("compuesta"),
    top: int = Query(10, ge=1, le=50),
):
    return calor_service.mapa_calor(capa=capa, top_n=top)


@router.get("/calor/top")
def get_calor_top(
    n: int = Query(10, ge=1, le=50),
    capa: str = Query("compuesta"),
):
    return calor_service.top_calor(n=n, capa=capa)


@router.get("/panorama")
def get_panorama(
    zona: str | None = None,
    colonia: str | None = None,
):
    return panorama_service.panorama(zona=zona, colonia=colonia)


@router.get("/corredores")
def get_corredores():
    return corredores_service.ranking_corredores()


@router.get("/corredores/catalogo")
def get_corredores_catalogo():
    return corredores_service.list_corredores_catalogo()


@router.get("/corredores/{slug}")
def get_corredor(slug: str):
    return corredores_service.get_corredor(slug)


@router.get("/cobertura")
def get_cobertura():
    return cobertura_service.list_cobertura()


@router.get("/sala")
def get_sala():
    return sala_service.get_sala()


@router.get("/evaluaciones-mesa")
def get_evaluaciones(limit: int = Query(20, ge=1, le=100)):
    return evaluaciones_service.list_evaluaciones(limit=limit)


@router.post("/evaluaciones-mesa")
def post_evaluacion(
    payload: EvaluacionMesaWrite,
    x_saeto_rol: str | None = Header(default=None, alias="X-SAETO-Rol"),
):
    return evaluaciones_service.create_evaluacion(payload, rol=x_saeto_rol)


@router.get("/config/calor")
def get_config_calor():
    return {
        "umbrales": seed_loader.load_umbrales_calor(),
        "capas": seed_loader.load_calor_capas(),
    }


@router.get("/config/ritmo")
def get_config_ritmo():
    return seed_loader.load_ritmo_mesa()
