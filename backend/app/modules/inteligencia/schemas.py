"""Esquemas del módulo inteligencia (read-models y escrituras locales)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class CeldaCalor(BaseModel):
    territorio_slug: str | None = None
    colonia_slug: str | None = None
    colonia_nombre: str = ""
    zona_slug: str
    zona_nombre: str = ""
    capa: str
    score: float
    banda: str
    banda_nombre: str = ""
    color: str = ""
    desglose: dict[str, float] = Field(default_factory=dict)


class MapaCalorResponse(BaseModel):
    demo: bool = True
    capa: str
    capa_nombre: str = ""
    periodo_dias: int
    bandas: list[dict[str, Any]] = Field(default_factory=list)
    celdas: list[CeldaCalor] = Field(default_factory=list)
    por_zona: list[CeldaCalor] = Field(default_factory=list)
    top: list[CeldaCalor] = Field(default_factory=list)


class PanoramaTerritorial(BaseModel):
    demo: bool = True
    zona_slug: str | None = None
    zona_nombre: str = ""
    colonia_slug: str | None = None
    colonia_nombre: str = ""
    resumen_ejecutivo: str = ""
    intensidad: CeldaCalor | None = None
    conteo_semaforo: dict[str, int] = Field(default_factory=dict)
    conteo_ciclo: dict[str, int] = Field(default_factory=dict)
    escalando: int = 0
    top_reivindicaciones: list[dict[str, Any]] = Field(default_factory=list)
    eventos_recientes: list[dict[str, Any]] = Field(default_factory=list)
    actores_clave: list[dict[str, Any]] = Field(default_factory=list)
    indicadores_contexto: list[dict[str, Any]] = Field(default_factory=list)
    pulso_encuestas: dict[str, Any] = Field(default_factory=dict)


class CorredorRanking(BaseModel):
    slug: str
    nombre: str
    tipo: str
    alcaldias: list[str] = Field(default_factory=list)
    eventos: int = 0
    demandas: int = 0
    score_presion: float = 0
    tramos: list[dict[str, Any]] = Field(default_factory=list)


class SectorCobertura(BaseModel):
    sector_slug: str
    sector_nombre: str
    zona_slug: str
    zona_nombre: str = ""
    prioridad: int
    banda: str = ""
    score: float = 0
    motivo: str = ""
    recomendacion: str
    recomendacion_nombre: str = ""
    actores_a_revisar: list[str] = Field(default_factory=list)


class EvaluacionMesaWrite(BaseModel):
    ventana: str = "diaria"
    notas: str = ""
    focos_revisados: list[str] = Field(default_factory=list)
    checklist_ok: list[str] = Field(default_factory=list)


class EvaluacionMesa(BaseModel):
    slug: str
    fecha: str
    rol: str = "analista"
    ventana: str = "diaria"
    notas: str = ""
    focos_revisados: list[str] = Field(default_factory=list)
    checklist_ok: list[str] = Field(default_factory=list)


class SalaOperativa(BaseModel):
    demo: bool = True
    resumen: str = ""
    registro: dict[str, Any] = Field(default_factory=dict)
    analisis: dict[str, Any] = Field(default_factory=dict)
    reporteador: dict[str, Any] = Field(default_factory=dict)
    priorizacion: dict[str, Any] = Field(default_factory=dict)
    ritmo: dict[str, Any] = Field(default_factory=dict)
    evaluaciones_recientes: list[EvaluacionMesa] = Field(default_factory=list)
