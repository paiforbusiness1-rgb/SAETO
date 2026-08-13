"""Esquemas del módulo IA (Groq) — respuestas tipadas para mesa."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class IaStatus(BaseModel):
    demo: bool = True
    habilitado: bool
    proveedor: str
    modelo: str
    api_key_configurada: bool
    roles_permitidos: list[str] = Field(default_factory=list)
    disclaimer: str = ""


class PanoramaLecturaRequest(BaseModel):
    zona: str | None = None
    colonia: str | None = None


class PanoramaLecturaResponse(BaseModel):
    demo: bool = True
    disclaimer: str
    zona: str | None = None
    colonia: str | None = None
    lectura: str
    modelo: str
    hechos_usados: dict[str, Any] = Field(default_factory=dict)


class ClasificarTextoRequest(BaseModel):
    texto: str = Field(min_length=12, max_length=4000)


class ClasificarTextoResponse(BaseModel):
    demo: bool = True
    disclaimer: str
    tema_sugerido: str = "otro"
    fase_ciclo_sugerida: str = "emergencia"
    sentido_sugerido: str = "estable"
    confianza: float = 0.0
    resumen_corto: str = ""
    notas_mesa: str = ""
    crudo: str = ""
    modelo: str = ""


class ContextoDecisionRequest(BaseModel):
    demanda_slug: str


class ContextoDecisionResponse(BaseModel):
    demo: bool = True
    disclaimer: str
    demanda_slug: str
    lectura: str
    modelo: str
    hechos_usados: dict[str, Any] = Field(default_factory=dict)
