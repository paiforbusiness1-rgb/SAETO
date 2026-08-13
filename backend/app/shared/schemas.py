from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


Semaforo = Literal["verde", "amarillo", "rojo"]
EstadoVerificacion = Literal["declarado", "corroborado_demo", "corroborado", "en_revision"]
Fuente = Literal[
    "encuesta_demo",
    "bd_gobierno_demo",
    "campo_demo",
    "percepcion_local",
    "encuesta_opinion",
    "inegi_referencia",
    "bd_gobierno",
    "campo",
]
TipoDemanda = Literal["actual_in_situ", "historica_latente"]
FaseCiclo = Literal[
    "emergencia",
    "articulacion",
    "movilizacion",
    "negociacion",
    "resolucion_parcial",
    "latencia",
    "cierre",
]
SentidoCiclo = Literal["escalando", "estable", "desescalando"]
TipoActor = Literal[
    "liderazgo_vecinal",
    "organizacion",
    "movimiento",
    "actor_institucional",
    "generador_violencia",
    "otro",
]
MetodoComprobacion = Literal["campo", "conteo_evento", "fuente_oficial", "otra"]
TipoAccion = Literal[
    "reunion",
    "mitin",
    "manifestacion",
    "bloqueo",
    "planton",
    "comunicado",
    "violencia",
    "otra",
]
RespuestaGobierno = Literal[
    "mesa_negociacion",
    "concesion",
    "negativa",
    "silencio",
    "represion",
    "otra",
    "no_aplica",
]
Reaccion = Literal[
    "aceptacion_total",
    "aceptacion_parcial",
    "rechazo_total",
    "rechazo_parcial",
    "diferimiento",
    "no_aplica",
]
RolSaeto = Literal["lector", "capturista", "analista", "analista_sensible", "admin"]


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
    capacidad_estimada: int = 0
    capacidad_comprobada: int | None = None
    fecha_comprobacion: str | None = None
    metodo_comprobacion: MetodoComprobacion | None = None
    tipo_actor: TipoActor = "liderazgo_vecinal"
    estado_verificacion: EstadoVerificacion
    reivindicaciones_abiertas: list[str]
    movilizacion_display: int = 0
    movilizacion_fuente: str = "estimada"


class ActorDetail(ActorSummary):
    demo: bool = True
    notas_mesa: str
    reivindicaciones_nombres: list[str]
    interes_declarado: str = ""
    interes_reservado: str | None = None
    recursos_poder: list[str] = Field(default_factory=list)
    notas_poder: str = ""
    alias: list[str] = Field(default_factory=list)
    zona_operacion: list[str] = Field(default_factory=list)
    red_afiliacion: str | None = None
    nivel_riesgo: str | None = None
    nivel_riesgo_nombre: str = ""
    cuenta_pendiente_seguridad: str | None = None
    fuente_inteligencia: str | None = None
    fuente_inteligencia_nombre: str = ""


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
    tipo_demanda: TipoDemanda = "actual_in_situ"
    fuentes_evidencia: list[str] = Field(default_factory=list)
    fase_ciclo_vital: FaseCiclo = "emergencia"
    fase_ciclo_nombre: str = "Emergencia"
    grado_escalamiento: int = 1
    sentido_ciclo: SentidoCiclo = "estable"
    fecha_deteccion: str | None = None
    fecha_ultima_actualizacion_ciclo: str | None = None


class CicloHistorialEntry(BaseModel):
    fase: FaseCiclo
    fase_nombre: str = ""
    fecha: str
    origen: str = "revision"
    nota: str = ""


class ReivindicacionDetail(ReivindicacionSummary):
    demo: bool = True
    resumen_deuda: str
    notas_ciclo: str = ""
    historial_ciclo: list[CicloHistorialEntry] = Field(default_factory=list)


class DiscursoSummary(BaseModel):
    slug: str
    actor: str
    actor_nombre: str
    topico_principal: str
    subtopicos: list[str]
    audiencia: str
    narrativas: str = ""
    ideologia: str = ""
    emociones: list[str] = Field(default_factory=list)


class DiscursoDetail(DiscursoSummary):
    demo: bool = True
    niveles: dict[str, str]
    niveles_meta: list[dict[str, Any]]
    argumentos: str = ""
    endo_grupo: str = ""
    exo_grupo: str = ""
    coaliciones_posibles: str = ""
    hipotesis_mesa: bool = True


class CoyunturaSummary(BaseModel):
    slug: str
    fecha: str
    actor: str | None = None
    actor_nombre: str | None = None
    demanda: str | None = None
    demanda_nombre: str | None = None
    tipo_accion: TipoAccion
    tipo_accion_nombre: str = ""
    respuesta_gobierno: RespuestaGobierno = "no_aplica"
    reaccion: Reaccion = "no_aplica"


class CoyunturaDetail(CoyunturaSummary):
    demo: bool = True
    descripcion_accion: str = ""
    detalle_respuesta: str = ""
    resultado: str = ""
    impacto_ciclo: FaseCiclo | None = None
    fuentes: list[str] = Field(default_factory=list)
    corredor_slug: str | None = None
    corredor_nombre: str | None = None
    tramo_slug: str | None = None
    tramo_nombre: str | None = None


class IndicadorContexto(BaseModel):
    slug: str
    territorio: str
    territorio_nombre: str = ""
    zona: str = ""
    clave: str
    nombre: str
    valor: float | str
    anio: int
    fuente: str = "INEGI"
    nota: str = ""
    demo: bool = True


class BriefResponse(BaseModel):
    demo: bool
    resumen_ejecutivo: str
    alertas_coyuntura: list[str]
    actores_clave: list[ActorSummary]
    reivindicaciones_top: list[ReivindicacionSummary]
    conteo_semaforo: dict[str, int]
    conteo_ciclo: dict[str, int] = Field(default_factory=dict)
    escalando: int = 0


class CatalogosResponse(BaseModel):
    demo: bool = True
    territorio: dict[str, Any]
    reivindicaciones: dict[str, Any]
    umbrales: dict[str, Any]
    discurso_niveles: dict[str, Any]
    ciclo_vital: dict[str, Any] = Field(default_factory=dict)
    coyuntura: dict[str, Any] = Field(default_factory=dict)
    poder: dict[str, Any] = Field(default_factory=dict)
    discurso_mesa: dict[str, Any] = Field(default_factory=dict)
    encuesta_rapida: dict[str, Any] = Field(default_factory=dict)
    encuestas_plantillas: list[dict[str, Any]] = Field(default_factory=list)


class EncuestaSummary(BaseModel):
    slug: str
    fecha: str
    plantilla: str = "rapida_mesa"
    plantilla_nombre: str = ""
    colonia: str
    colonia_nombre: str = ""
    zona: str
    zona_nombre: str = ""
    edad: str | None = None
    sexo: str | None = None
    problemas_prioridad: list[str] = Field(default_factory=list)
    demo: bool = False


class EncuestaDetail(EncuestaSummary):
    respuestas: dict[str, Any] = Field(default_factory=dict)
    notas_mesa: str = ""
    plantilla_meta: dict[str, Any] = Field(default_factory=dict)


class EncuestaWrite(BaseModel):
    fecha: str
    colonia: str
    zona: str = ""
    respuestas: dict[str, Any] = Field(default_factory=dict)
    notas_mesa: str = ""
    plantilla: str = "rapida_mesa"
    slug: str | None = None


class ActorWrite(BaseModel):
    nombre: str
    colonia: str
    zona: str
    rol: str
    organizacion: str
    capacidad_movilizacion: int | None = None
    capacidad_estimada: int | None = None
    capacidad_comprobada: int | None = None
    fecha_comprobacion: str | None = None
    metodo_comprobacion: MetodoComprobacion | None = None
    tipo_actor: TipoActor = "liderazgo_vecinal"
    reivindicaciones_abiertas: list[str] = []
    estado_verificacion: EstadoVerificacion = "declarado"
    notas_mesa: str = ""
    interes_declarado: str = ""
    interes_reservado: str = ""
    recursos_poder: list[str] = []
    notas_poder: str = ""
    alias: list[str] = []
    zona_operacion: list[str] = []
    red_afiliacion: str = ""
    nivel_riesgo: str | None = None
    cuenta_pendiente_seguridad: str = ""
    fuente_inteligencia: str | None = None
    slug: str | None = None


class ReivindicacionWrite(BaseModel):
    tema: str
    territorio: str
    zona: str
    intensidad: int
    deuda_historica: bool = False
    resumen_deuda: str = ""
    fuente: Fuente = "campo"
    peso_opinion: int = 50
    tipo_demanda: TipoDemanda = "actual_in_situ"
    fuentes_evidencia: list[str] = []
    fase_ciclo_vital: FaseCiclo = "emergencia"
    grado_escalamiento: int = 1
    sentido_ciclo: SentidoCiclo = "estable"
    fecha_deteccion: str | None = None
    fecha_ultima_actualizacion_ciclo: str | None = None
    notas_ciclo: str = ""
    corredores: list[str] = []
    slug: str | None = None


class DiscursoWrite(BaseModel):
    actor: str
    topico_principal: str
    subtopicos: list[str] = []
    audiencia: str = ""
    niveles: dict[str, str] = {}
    narrativas: str = ""
    argumentos: str = ""
    ideologia: str = ""
    emociones: list[str] = []
    endo_grupo: str = ""
    exo_grupo: str = ""
    coaliciones_posibles: str = ""
    hipotesis_mesa: bool = True
    slug: str | None = None


class CoyunturaWrite(BaseModel):
    fecha: str
    actor: str | None = None
    demanda: str | None = None
    tipo_accion: TipoAccion
    descripcion_accion: str = ""
    respuesta_gobierno: RespuestaGobierno = "no_aplica"
    detalle_respuesta: str = ""
    reaccion: Reaccion = "no_aplica"
    resultado: str = ""
    impacto_ciclo: FaseCiclo | None = None
    fuentes: list[str] = []
    corredor_slug: str | None = None
    tramo_slug: str | None = None
    slug: str | None = None


class IndicadorWrite(BaseModel):
    territorio: str
    zona: str = ""
    clave: str
    nombre: str
    valor: float | str
    anio: int
    fuente: str = "INEGI"
    nota: str = ""
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


class RolContext(BaseModel):
    rol: RolSaeto = "analista"
