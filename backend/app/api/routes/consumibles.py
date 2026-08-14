"""Router consumibles — solo despacho."""

from fastapi import APIRouter, Query

from app.modules.consumibles import lamina_service, tematicos_service

router = APIRouter(prefix="/api/consumibles", tags=["consumibles"])


@router.get("")
def indice():
    return {
        "demo": True,
        "disclaimer": tematicos_service.disclaimer(),
        "laminas": [x.model_dump() for x in lamina_service.list_laminas()],
        "temas": [x.model_dump() for x in tematicos_service.list_temas()],
    }


@router.get("/temas")
def temas():
    return tematicos_service.list_temas()


@router.get("/calor-tematico")
def calor_tematico(tema: str = Query("agua")):
    celdas = tematicos_service.celdas_tematicas(tema)
    por_zona = tematicos_service.agregar_por_zona(celdas)
    return {
        "demo": True,
        "tema": tematicos_service.tema_or_default(tema).model_dump(),
        "celdas": [c.model_dump() for c in celdas],
        "por_zona": [c.model_dump() for c in por_zona],
    }


@router.get("/cruce")
def cruce(tema: str = Query("agua")):
    from app.modules.consumibles import cruce_service

    celdas = cruce_service.celdas_cruce(tema)
    return {
        "demo": True,
        "tema": tematicos_service.tema_or_default(tema).model_dump(),
        "celdas": [c.model_dump() for c in celdas],
        "tabla": cruce_service.tabla_cruce(celdas),
    }


@router.get("/laminas/{slug}")
def get_lamina(slug: str, tema: str | None = None):
    return lamina_service.lamina(slug, tema=tema)
