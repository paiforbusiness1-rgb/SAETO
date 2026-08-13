"""Sala operativa: agrega paneles Registro / Análisis / Reporte / Priorización."""

from __future__ import annotations

from app.modules.inteligencia import (
    calor_service,
    cobertura_service,
    corredores_service,
    evaluaciones_service,
)
from app.modules.inteligencia.schemas import SalaOperativa
from app.modules.observatorio import service as observatorio_service
from app.shared import seed_loader


def get_sala() -> SalaOperativa:
    calor = calor_service.mapa_calor(capa="compuesta", top_n=5)
    corredores = corredores_service.ranking_corredores()[:3]
    cobertura = cobertura_service.list_cobertura()[:5]
    reivs = observatorio_service.list_reivindicaciones()
    escalando = sum(1 for r in reivs if r.sentido_ciclo == "escalando")

    return SalaOperativa(
        demo=True,
        resumen=(
            f"Sala operativa Oriente: {len(calor.top)} focos calientes en radar, "
            f"{escalando} demandas escalando, {len(corredores)} corredores bajo presión."
        ),
        registro={
            "titulo": "Registro",
            "descripcion": "Captura de hechos para alimentar la inteligencia territorial.",
            "accesos": [
                {"label": "Actores", "to": "/captura/actores"},
                {"label": "Reivindicaciones", "to": "/captura/reivindicaciones"},
                {"label": "Coyuntura", "to": "/captura/coyuntura"},
                {"label": "Encuestas", "to": "/captura/encuestas"},
            ],
        },
        analisis={
            "titulo": "Análisis",
            "descripcion": "Mapa de calor, panorama y corredores.",
            "top_calor": [c.model_dump() for c in calor.top],
            "corredores": [c.model_dump() for c in corredores],
            "accesos": [
                {"label": "Mapa de calor", "to": "/inteligencia/calor"},
                {"label": "Panorama", "to": "/inteligencia/panorama"},
                {"label": "Corredores", "to": "/inteligencia/corredores"},
            ],
        },
        reporteador={
            "titulo": "Reporteador",
            "descripcion": "Lecturas gerenciales para la mesa.",
            "accesos": [
                {"label": "Ejecutivo", "to": "/reportes/ejecutivo"},
                {"label": "Ciclo vital", "to": "/reportes/ciclo-vital"},
                {"label": "Calor (reporte)", "to": "/reportes/calor"},
                {"label": "Corredores (reporte)", "to": "/reportes/corredores"},
            ],
        },
        priorizacion={
            "titulo": "Priorización",
            "descripcion": "Cobertura analítica sugerida (no patrullaje).",
            "sectores": [s.model_dump() for s in cobertura],
            "accesos": [{"label": "Cobertura de mesa", "to": "/inteligencia/cobertura"}],
        },
        ritmo=seed_loader.load_ritmo_mesa(),
        evaluaciones_recientes=evaluaciones_service.list_evaluaciones(limit=5),
    )
