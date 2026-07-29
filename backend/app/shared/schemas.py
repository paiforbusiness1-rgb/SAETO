from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel


Semaforo = Literal["verde", "amarillo", "rojo"]
EstadoVerificacion = Literal["declarado", "corroborado_demo"]
Fuente = Literal["encuesta_demo", "bd_gobierno_demo", "campo_demo"]


class HealthResponse(BaseModel):
    status: str
    sistema: str
    demo: bool
    disclaimer: str


class SemaforoInfo(BaseModel):
    semaforo: Semaforo
    etiqueta: str
    intensidad: int


class ActorSummary(BaseModel):
    slug: str
    nombre: str
    colonia: str
    zona: str
    colonia_nombre: str
    zona_nombre: str
    rol: str
    organizacion: str
    capacidad_movilizacion: int
    estado_verificacion: EstadoVerificacion
    reivindicaciones_abiertas: list[str]


class ActorDetail(ActorSummary):
    demo: bool = True
    notas_mesa: str
    reivindicaciones_nombres: list[str]


class ReivindicacionSummary(BaseModel):
    slug: str
    tema: str
    tema_nombre: str
    territorio: str
    territorio_nombre: str
    zona: str
    zona_nombre: str
    intensidad: int
    semaforo: Semaforo
    semaforo_etiqueta: str
    deuda_historica: bool
    peso_opinion: int
    fuente: Fuente


class ReivindicacionDetail(ReivindicacionSummary):
    demo: bool = True
    resumen_deuda: str


class DiscursoSummary(BaseModel):
    slug: str
    actor: str
    actor_nombre: str
    topico_principal: str
    subtopicos: list[str]
    audiencia: str


class DiscursoDetail(DiscursoSummary):
    demo: bool = True
    niveles: dict[str, str]
    niveles_meta: list[dict[str, Any]]


class BriefResponse(BaseModel):
    demo: bool
    resumen_ejecutivo: str
    alertas_coyuntura: list[str]
    actores_clave: list[ActorSummary]
    reivindicaciones_top: list[ReivindicacionSummary]
    conteo_semaforo: dict[str, int]


class CatalogosResponse(BaseModel):
    demo: bool = True
    territorio: dict[str, Any]
    reivindicaciones: dict[str, Any]
    umbrales: dict[str, Any]
    discurso_niveles: dict[str, Any]


# --- Escritura / captura ---


class ActorWrite(BaseModel):
    nombre: str
    colonia: str
    zona: str
    rol: str
    organizacion: str
    capacidad_movilizacion: int
    reivindicaciones_abiertas: list[str] = []
    estado_verificacion: EstadoVerificacion = "declarado"
    notas_mesa: str = ""
    slug: str | None = None


class ReivindicacionWrite(BaseModel):
    tema: str
    territorio: str
    zona: str
    intensidad: int
    deuda_historica: bool = False
    resumen_deuda: str = ""
    fuente: Fuente = "campo_demo"
    peso_opinion: int = 50
    slug: str | None = None


class DiscursoWrite(BaseModel):
    actor: str
    topico_principal: str
    subtopicos: list[str] = []
    audiencia: str = ""
    niveles: dict[str, str] = {}
    slug: str | None = None


class BriefWrite(BaseModel):
    resumen_ejecutivo: str
    alertas_coyuntura: list[str] = []
    actores_clave_slugs: list[str] = []
    reivindicaciones_top_slugs: list[str] = []


class TerritorioCatalog(BaseModel):
    zonas: list[dict[str, Any]]
    colonias_demo: list[dict[str, Any]]


class TemasCatalog(BaseModel):
    temas: list[dict[str, Any]]


class UmbralesCatalog(BaseModel):
    intensidad: list[dict[str, Any]]


class DiscursoNivelesCatalog(BaseModel):
    niveles: list[dict[str, Any]]

