from fastapi import APIRouter

from app.shared import seed_loader
from app.shared.schemas import CatalogosResponse, HealthResponse

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        sistema="SAETO",
        demo=True,
        disclaimer=(
            "SAETO — Sistema de Análisis Estratégico Territorial Oriente. "
            "Herramienta de mesa para lectura territorial."
        ),
    )


@router.get("/config/catalogos", response_model=CatalogosResponse)
def catalogos():
    return CatalogosResponse(
        territorio=seed_loader.load_territorio(),
        reivindicaciones=seed_loader.load_catalogo_reivindicaciones(),
        umbrales=seed_loader.load_umbrales(),
        discurso_niveles=seed_loader.load_discurso_niveles(),
        ciclo_vital=seed_loader.load_ciclo_vital(),
        coyuntura=seed_loader.load_coyuntura_catalogos(),
        poder=seed_loader.load_poder_recursos(),
        discurso_mesa=seed_loader.load_discurso_mesa(),
        encuesta_rapida=seed_loader.load_encuesta_rapida(),
        encuestas_plantillas=seed_loader.list_plantillas_encuesta(),
    )
