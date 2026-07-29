from fastapi import APIRouter

from app.modules.catalogos import service
from app.shared.schemas import (
    DiscursoNivelesCatalog,
    TemasCatalog,
    TerritorioCatalog,
    UmbralesCatalog,
)

router = APIRouter(prefix="/api/catalogos", tags=["catalogos"])


@router.get("/territorio")
def get_territorio():
    return service.get_territorio()


@router.put("/territorio")
def put_territorio(payload: TerritorioCatalog):
    return service.save_territorio(payload)


@router.get("/temas")
def get_temas():
    return service.get_temas()


@router.put("/temas")
def put_temas(payload: TemasCatalog):
    return service.save_temas(payload)


@router.get("/umbrales")
def get_umbrales():
    return service.get_umbrales()


@router.put("/umbrales")
def put_umbrales(payload: UmbralesCatalog):
    return service.save_umbrales(payload)


@router.get("/discurso-niveles")
def get_discurso_niveles():
    return service.get_discurso_niveles()


@router.put("/discurso-niveles")
def put_discurso_niveles(payload: DiscursoNivelesCatalog):
    return service.save_discurso_niveles(payload)
