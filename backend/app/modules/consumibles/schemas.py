"""Schemas de consumibles (láminas de mesa)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ConsumibleMeta(BaseModel):
    slug: str
    nombre: str
    subtitulo: str = ""
    tipo: str
    orden: int = 99
    tema_default: str | None = None
    permite_selector: bool = False


class TemaMeta(BaseModel):
    slug: str
    nombre: str
    descripcion: str = ""
    color: str = "#7eb8a2"


class CeldaConsumible(BaseModel):
    colonia_slug: str
    colonia_nombre: str
    zona_slug: str
    zona_nombre: str
    score: float
    banda_slug: str
    banda_nombre: str
    color: str
    intensidad_tema: float | None = None
    indice_electoral: float | None = None
    densidad: float | None = None
    metrica_clave: str | None = None
    metrica_valor: float | None = None
    nota_mesa: str | None = None


class SeriePunto(BaseModel):
    mes: str
    valor: float


class LaminaResponse(BaseModel):
    demo: bool = True
    disclaimer: str
    lamina: ConsumibleMeta
    tema: TemaMeta | None = None
    temas_disponibles: list[TemaMeta] = Field(default_factory=list)
    lectura_gerencial: str = ""
    kpis: list[dict[str, Any]] = Field(default_factory=list)
    celdas: list[CeldaConsumible] = Field(default_factory=list)
    por_zona: list[CeldaConsumible] = Field(default_factory=list)
    barras_zona: list[dict[str, Any]] = Field(default_factory=list)
    serie_global: list[SeriePunto] = Field(default_factory=list)
    tabla: list[dict[str, Any]] = Field(default_factory=list)
    constructo: dict[str, Any] = Field(default_factory=dict)
    top: list[CeldaConsumible] = Field(default_factory=list)
