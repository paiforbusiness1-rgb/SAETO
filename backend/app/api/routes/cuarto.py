"""Router cuarto de situación — solo despacho."""

from fastapi import APIRouter
from fastapi.responses import Response

from app.modules.cuarto import caso_service
from app.modules.cuarto import reporte_service

router = APIRouter(prefix="/api/cuarto", tags=["cuarto"])


@router.get("/config")
def get_config():
    return caso_service.config()


@router.get("/casos")
def list_casos():
    return caso_service.list_casos()


@router.get("/casos/{slug}/reporte")
def descargar_reporte(slug: str):
    pdf_bytes, filename = reporte_service.generar_o_404(slug)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@router.get("/casos/{slug}")
def get_caso(slug: str):
    return caso_service.get_caso(slug)
