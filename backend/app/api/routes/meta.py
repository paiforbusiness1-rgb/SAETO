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
            "Prototipo conceptual con datos de demostración. "
            "No representa registros oficiales ni personas reales."
        ),
    )


@router.get("/config/catalogos", response_model=CatalogosResponse)
def catalogos():
    return CatalogosResponse(
        territorio=seed_loader.load_territorio(),
        reivindicaciones=seed_loader.load_catalogo_reivindicaciones(),
        umbrales=seed_loader.load_umbrales(),
        discurso_niveles=seed_loader.load_discurso_niveles(),
    )
