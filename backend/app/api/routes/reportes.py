from fastapi import APIRouter

from app.modules.reportes import service

router = APIRouter(prefix="/api/reportes", tags=["reportes"])


@router.get("/ejecutivo")
def ejecutivo():
    return service.reporte_ejecutivo()


@router.get("/territorio")
def territorio():
    return service.reporte_territorio()


@router.get("/actores")
def actores():
    return service.reporte_actores()


@router.get("/deudas")
def deudas():
    return service.reporte_deudas()
