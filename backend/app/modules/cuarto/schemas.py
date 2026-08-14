"""Schemas del cuarto de situación (composición, no master data)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.modules.consumibles.schemas import CeldaConsumible


class PasoMeta(BaseModel):
    slug: str
    orden: int
    titulo: str
    obligatorio: bool = True
    vista: str


class DemandaAncla(BaseModel):
    slug: str
    titulo: str
    tema: str
    tema_nombre: str
    territorio_nombre: str
    zona_nombre: str
    intensidad: int
    semaforo: str
    semaforo_etiqueta: str
    fase_ciclo_nombre: str
    sentido_ciclo: str
    deuda_historica: bool = False
    resumen_deuda: str = ""
    notas_ciclo: str = ""


class ImpactoColonia(BaseModel):
    colonia_nombre: str
    zona_nombre: str
    poblacion: int | None = None
    densidad: float | None = None
    viviendas: int | None = None
    lista_nominal: int | None = None
    metrica_clave: str | None = None
    metrica_valor: float | None = None
    nota_mesa: str | None = None


class ImpactoAgregado(BaseModel):
    colonias: list[ImpactoColonia] = Field(default_factory=list)
    poblacion_total: int = 0
    densidad_promedio: float | None = None
    viviendas_total: int = 0
    lista_nominal_total: int = 0
    actores: list[str] = Field(default_factory=list)


class InstalacionPunto(BaseModel):
    nombre: str
    tipo_nombre: str
    colonia_nombre: str
    lat: float
    lng: float
    estado_nombre: str
    nota: str = ""


class TimelineEvento(BaseModel):
    fecha: str
    tipo_nombre: str
    actor_nombre: str | None = None
    demanda_nombre: str | None = None
    descripcion: str = ""
    respuesta_nombre: str = ""
    detalle_respuesta: str = ""
    resultado: str = ""
    enlace: str | None = None


class CorteTemporal(BaseModel):
    etiqueta: str
    poblacion: int
    intensidad: int
    nota: str = ""


class ContextoAnalista(BaseModel):
    texto: str = ""
    factores: list[str] = Field(default_factory=list)


class CasoIndice(BaseModel):
    slug: str
    nombre: str
    subtitulo: str = ""
    tema: str
    tema_nombre: str = ""
    resumen: str = ""


class CasoSituacion(BaseModel):
    slug: str
    nombre: str
    subtitulo: str = ""
    tema: str
    tema_nombre: str = ""
    resumen: str = ""
    demanda: DemandaAncla | None = None
    pasos: list[PasoMeta] = Field(default_factory=list)
    celdas: list[CeldaConsumible] = Field(default_factory=list)
    por_zona: list[CeldaConsumible] = Field(default_factory=list)
    barras_zona: list[dict[str, Any]] = Field(default_factory=list)
    impacto: ImpactoAgregado = Field(default_factory=ImpactoAgregado)
    instalaciones: list[InstalacionPunto] = Field(default_factory=list)
    timeline: list[TimelineEvento] = Field(default_factory=list)
    entonces: CorteTemporal | None = None
    ahora: CorteTemporal | None = None
    contexto: ContextoAnalista = Field(default_factory=ContextoAnalista)
    recomendaciones: list[str] = Field(default_factory=list)


class CuartoConfig(BaseModel):
    pasos: list[PasoMeta] = Field(default_factory=list)
    temas_con_recomendacion: list[str] = Field(default_factory=list)
