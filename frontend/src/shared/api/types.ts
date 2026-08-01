export type Semaforo = "verde" | "amarillo" | "rojo";

export type SaetoRol =
  | "lector"
  | "capturista"
  | "analista"
  | "analista_sensible"
  | "admin";

export type EstadoVerificacion =
  | "declarado"
  | "corroborado_demo"
  | "corroborado"
  | "en_revision";

export type TipoDemanda = "actual_in_situ" | "historica_latente";
export type FaseCiclo =
  | "emergencia"
  | "articulacion"
  | "movilizacion"
  | "negociacion"
  | "resolucion_parcial"
  | "latencia"
  | "cierre";
export type SentidoCiclo = "escalando" | "estable" | "desescalando";
export type TipoActor =
  | "liderazgo_vecinal"
  | "organizacion"
  | "movimiento"
  | "actor_institucional"
  | "generador_violencia"
  | "otro";
export type MetodoComprobacion = "campo" | "conteo_evento" | "fuente_oficial" | "otra";

export type TipoAccion =
  | "reunion"
  | "mitin"
  | "manifestacion"
  | "bloqueo"
  | "planton"
  | "comunicado"
  | "violencia"
  | "otra";
export type RespuestaGobierno =
  | "mesa_negociacion"
  | "concesion"
  | "negativa"
  | "silencio"
  | "represion"
  | "otra"
  | "no_aplica";
export type Reaccion =
  | "aceptacion_total"
  | "aceptacion_parcial"
  | "rechazo_total"
  | "rechazo_parcial"
  | "diferimiento"
  | "no_aplica";

export interface CatalogoItem {
  slug: string;
  nombre: string;
  sensible?: boolean;
  orden?: number;
}

export interface CatalogosConfig {
  demo: boolean;
  ciclo_vital: {
    fases: CatalogoItem[];
    tipos_demanda: CatalogoItem[];
    fuentes_evidencia: CatalogoItem[];
    sentidos_ciclo: CatalogoItem[];
  };
  coyuntura: {
    tipos_accion: CatalogoItem[];
    respuestas_gobierno: CatalogoItem[];
    reacciones: CatalogoItem[];
  };
  poder: {
    recursos: CatalogoItem[];
    tipos_actor: CatalogoItem[];
    metodos_comprobacion: CatalogoItem[];
  };
  discurso_mesa: {
    emociones: CatalogoItem[];
    ideologias: CatalogoItem[];
  };
}

export interface Health {
  status: string;
  sistema: string;
  demo: boolean;
  disclaimer: string;
}

export interface ActorSummary {
  slug: string;
  nombre: string;
  colonia: string;
  zona: string;
  colonia_nombre: string;
  zona_nombre: string;
  rol: string;
  organizacion: string;
  capacidad_movilizacion: number;
  capacidad_estimada: number;
  capacidad_comprobada: number | null;
  fecha_comprobacion: string | null;
  metodo_comprobacion: MetodoComprobacion | null;
  tipo_actor: TipoActor;
  estado_verificacion: EstadoVerificacion;
  reivindicaciones_abiertas: string[];
  movilizacion_display: number;
  movilizacion_fuente: string;
}

export interface ActorDetail extends ActorSummary {
  demo: boolean;
  notas_mesa: string;
  reivindicaciones_nombres: string[];
  interes_declarado: string;
  interes_reservado: string | null;
  recursos_poder: string[];
  notas_poder: string;
}

export interface ReivindicacionSummary {
  slug: string;
  tema: string;
  tema_nombre: string;
  territorio: string;
  territorio_nombre: string;
  zona: string;
  zona_nombre: string;
  intensidad: number;
  semaforo: Semaforo;
  semaforo_etiqueta: string;
  deuda_historica: boolean;
  peso_opinion: number;
  fuente: string;
  tipo_demanda: TipoDemanda;
  fuentes_evidencia: string[];
  fase_ciclo_vital: FaseCiclo;
  fase_ciclo_nombre: string;
  grado_escalamiento: number;
  sentido_ciclo: SentidoCiclo;
  fecha_deteccion: string | null;
  fecha_ultima_actualizacion_ciclo: string | null;
}

export interface ReivindicacionDetail extends ReivindicacionSummary {
  demo: boolean;
  resumen_deuda: string;
  notas_ciclo: string;
  historial_ciclo: {
    fase: FaseCiclo;
    fase_nombre: string;
    fecha: string;
    origen: string;
    nota: string;
  }[];
}

export interface DiscursoSummary {
  slug: string;
  actor: string;
  actor_nombre: string;
  topico_principal: string;
  subtopicos: string[];
  audiencia: string;
  narrativas: string;
  ideologia: string;
  emociones: string[];
}

export interface DiscursoDetail extends DiscursoSummary {
  demo: boolean;
  niveles: Record<string, string>;
  niveles_meta: { slug: string; nombre: string; subtopicos: string[] }[];
  argumentos: string;
  endo_grupo: string;
  exo_grupo: string;
  coaliciones_posibles: string;
  hipotesis_mesa: boolean;
}

export interface CoyunturaSummary {
  slug: string;
  fecha: string;
  actor: string | null;
  actor_nombre: string | null;
  demanda: string | null;
  demanda_nombre: string | null;
  tipo_accion: TipoAccion;
  tipo_accion_nombre: string;
  respuesta_gobierno: RespuestaGobierno;
  reaccion: Reaccion;
}

export interface CoyunturaDetail extends CoyunturaSummary {
  demo: boolean;
  descripcion_accion: string;
  detalle_respuesta: string;
  resultado: string;
  impacto_ciclo: FaseCiclo | null;
  fuentes: string[];
}

export interface IndicadorContexto {
  slug: string;
  territorio: string;
  territorio_nombre: string;
  zona: string;
  clave: string;
  nombre: string;
  valor: number | string;
  anio: number;
  fuente: string;
  nota: string;
  demo: boolean;
}

export interface Brief {
  demo: boolean;
  resumen_ejecutivo: string;
  alertas_coyuntura: string[];
  actores_clave: ActorSummary[];
  reivindicaciones_top: ReivindicacionSummary[];
  conteo_semaforo: Record<string, number>;
  conteo_ciclo: Record<string, number>;
  escalando: number;
}
