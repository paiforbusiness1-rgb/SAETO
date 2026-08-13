"""Fachada delgada del módulo inteligencia (anti-God-Object)."""

from app.modules.inteligencia import (
    calor_service,
    cobertura_service,
    corredores_service,
    evaluaciones_service,
    panorama_service,
    sala_service,
)

__all__ = [
    "calor_service",
    "panorama_service",
    "corredores_service",
    "cobertura_service",
    "evaluaciones_service",
    "sala_service",
]
