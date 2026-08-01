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


@router.get("/ciclo-vital")
def ciclo_vital():
    return service.reporte_ciclo_vital()


@router.get("/coyuntura")
def coyuntura():
    return service.reporte_coyuntura()


@router.get("/discurso-mesa")
def discurso_mesa():
    return service.reporte_discurso_mesa()


@router.get("/contexto-inegi")
def contexto_inegi():
    return service.reporte_contexto_inegi()


@router.get("/encuestas")
def encuestas(plantilla: str | None = None):
    return service.reporte_encuestas(plantilla_filtro=plantilla)
