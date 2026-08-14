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
  encuesta_rapida?: EncuestaPlantilla;
  encuestas_plantillas?: EncuestaPlantillaMeta[];
}

export interface EncuestaPlantillaMeta {
  slug: string;
  nombre: string;
  disclaimer?: string;
  orden?: number;
  preguntas_count?: number;
}

export interface EncuestaPregunta {
  slug: string;
  texto: string;
  tipo: "opcion_unica" | "opcion_multiple" | "numero" | "escala" | "texto";
  bloque?: string;
  obligatoria?: boolean;
  orden?: number;
  max_selecciones?: number;
  min?: number;
  max?: number;
  max_chars?: number;
  etiqueta_min?: string;
  etiqueta_max?: string;
  opciones: CatalogoItem[];
}

export interface EncuestaPlantilla {
  slug: string;
  nombre: string;
  disclaimer: string;
  max_problemas_prioridad?: number;
  clave_prioridades?: string;
  bloques?: { slug: string; nombre: string }[];
  preguntas: EncuestaPregunta[];
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
  alias?: string[];
  zona_operacion?: string[];
  red_afiliacion?: string | null;
  nivel_riesgo?: string | null;
  nivel_riesgo_nombre?: string;
  cuenta_pendiente_seguridad?: string | null;
  fuente_inteligencia?: string | null;
  fuente_inteligencia_nombre?: string;
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
  corredor_slug?: string | null;
  corredor_nombre?: string | null;
  tramo_slug?: string | null;
  tramo_nombre?: string | null;
}

export interface CeldaCalor {
  territorio_slug?: string | null;
  colonia_slug?: string | null;
  colonia_nombre: string;
  zona_slug: string;
  zona_nombre: string;
  capa: string;
  score: number;
  banda: string;
  banda_nombre: string;
  color: string;
  desglose: Record<string, number>;
}

export interface MapaCalorResponse {
  demo: boolean;
  capa: string;
  capa_nombre: string;
  periodo_dias: number;
  bandas: { slug: string; nombre: string; min: number; max: number; color: string }[];
  celdas: CeldaCalor[];
  por_zona: CeldaCalor[];
  top: CeldaCalor[];
}

export interface PanoramaTerritorial {
  demo: boolean;
  zona_slug?: string | null;
  zona_nombre: string;
  colonia_slug?: string | null;
  colonia_nombre: string;
  resumen_ejecutivo: string;
  intensidad: CeldaCalor | null;
  conteo_semaforo: Record<string, number>;
  conteo_ciclo: Record<string, number>;
  escalando: number;
  top_reivindicaciones: {
    slug: string;
    tema_nombre: string;
    territorio_nombre: string;
    semaforo: Semaforo;
    semaforo_etiqueta: string;
    fase_ciclo_nombre: string;
    sentido_ciclo: SentidoCiclo;
  }[];
  eventos_recientes: {
    slug: string;
    fecha: string;
    tipo_accion_nombre: string;
    actor_nombre: string | null;
    demanda_nombre: string | null;
  }[];
  actores_clave: {
    slug: string;
    nombre: string;
    rol: string;
    colonia_nombre: string;
    movilizacion_display: number;
    movilizacion_fuente: string;
  }[];
  indicadores_contexto: {
    slug: string;
    nombre: string;
    valor: number | string;
    anio: number;
    territorio_nombre: string;
  }[];
  pulso_encuestas: {
    total?: number;
    colonias_cubiertas?: number;
    enlace_captura?: string;
  };
}

export interface CorredorRanking {
  slug: string;
  nombre: string;
  tipo: string;
  alcaldias: string[];
  eventos: number;
  demandas: number;
  score_presion: number;
  tramos: { slug: string; nombre: string; colonias?: string[] }[];
}

export interface SectorCobertura {
  sector_slug: string;
  sector_nombre: string;
  zona_slug: string;
  zona_nombre: string;
  prioridad: number;
  banda: string;
  score: number;
  motivo: string;
  recomendacion: string;
  recomendacion_nombre: string;
  actores_a_revisar: string[];
}

export interface EvaluacionMesa {
  slug: string;
  fecha: string;
  rol: string;
  ventana: string;
  notas: string;
  focos_revisados: string[];
  checklist_ok: string[];
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

export interface EncuestaSummary {
  slug: string;
  fecha: string;
  plantilla: string;
  plantilla_nombre?: string;
  colonia: string;
  colonia_nombre: string;
  zona: string;
  zona_nombre: string;
  edad: string | null;
  sexo: string | null;
  problemas_prioridad: string[];
  demo?: boolean;
}

export interface EncuestaDetail extends EncuestaSummary {
  demo: boolean;
  respuestas: Record<string, string | string[] | number>;
  notas_mesa: string;
  plantilla_meta: EncuestaPlantilla;
}

export interface SalaOperativa {
  demo: boolean;
  resumen: string;
  registro: {
    titulo: string;
    descripcion: string;
    accesos?: { label: string; to: string }[];
  };
  analisis: {
    titulo: string;
    descripcion: string;
    top_calor?: CeldaCalor[];
    corredores?: CorredorRanking[];
    accesos?: { label: string; to: string }[];
  };
  reporteador: {
    titulo: string;
    descripcion: string;
    accesos?: { label: string; to: string }[];
  };
  priorizacion: {
    titulo: string;
    descripcion: string;
    sectores?: SectorCobertura[];
    accesos?: { label: string; to: string }[];
  };
  ritmo: {
    ventanas?: { slug: string; nombre: string }[];
    checklist?: { slug: string; nombre: string }[];
  };
  evaluaciones_recientes: EvaluacionMesa[];
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

export interface IaStatus {
  demo: boolean;
  habilitado: boolean;
  proveedor: string;
  modelo: string;
  api_key_configurada: boolean;
  roles_permitidos: string[];
  disclaimer: string;
}

export interface PanoramaLecturaResponse {
  demo: boolean;
  disclaimer: string;
  zona?: string | null;
  colonia?: string | null;
  lectura: string;
  modelo: string;
}

export interface ClasificarTextoResponse {
  demo: boolean;
  disclaimer: string;
  tema_sugerido: string;
  fase_ciclo_sugerida: string;
  sentido_sugerido: string;
  confianza: number;
  resumen_corto: string;
  notas_mesa: string;
  modelo: string;
}

export interface ContextoDecisionResponse {
  demo: boolean;
  disclaimer: string;
  demanda_slug: string;
  lectura: string;
  modelo: string;
}

export interface ConsumibleMeta {
  slug: string;
  nombre: string;
  subtitulo?: string;
  tipo: string;
  orden: number;
  tema_default?: string | null;
  permite_selector?: boolean;
}

export interface TemaConsumible {
  slug: string;
  nombre: string;
  descripcion?: string;
  color?: string;
}

export interface CeldaConsumible {
  colonia_slug: string;
  colonia_nombre: string;
  zona_slug: string;
  zona_nombre: string;
  score: number;
  banda_slug: string;
  banda_nombre: string;
  color: string;
  intensidad_tema?: number | null;
  indice_electoral?: number | null;
  densidad?: number | null;
  metrica_clave?: string | null;
  metrica_valor?: number | null;
  nota_mesa?: string | null;
}

export interface LaminaConsumible {
  demo: boolean;
  disclaimer: string;
  lamina: ConsumibleMeta;
  tema?: TemaConsumible | null;
  temas_disponibles: TemaConsumible[];
  lectura_gerencial: string;
  kpis: { label: string; value: string; hint?: string }[];
  celdas: CeldaConsumible[];
  por_zona: CeldaConsumible[];
  barras_zona: { label: string; value: number; tone?: string; hint?: string }[];
  serie_global: { mes: string; valor: number }[];
  tabla: Record<string, unknown>[];
  constructo: Record<string, unknown>;
  top: CeldaConsumible[];
}

export interface ConsumiblesIndice {
  demo: boolean;
  disclaimer: string;
  laminas: ConsumibleMeta[];
  temas: TemaConsumible[];
}

export interface PasoCuarto {
  slug: string;
  orden: number;
  titulo: string;
  obligatorio: boolean;
  vista: string;
}

export interface DemandaAncla {
  slug: string;
  titulo: string;
  tema: string;
  tema_nombre: string;
  territorio_nombre: string;
  zona_nombre: string;
  intensidad: number;
  semaforo: Semaforo;
  semaforo_etiqueta: string;
  fase_ciclo_nombre: string;
  sentido_ciclo: SentidoCiclo;
  deuda_historica: boolean;
  resumen_deuda: string;
  notas_ciclo: string;
}

export interface ImpactoColonia {
  colonia_nombre: string;
  zona_nombre: string;
  poblacion?: number | null;
  densidad?: number | null;
  viviendas?: number | null;
  lista_nominal?: number | null;
  metrica_clave?: string | null;
  metrica_valor?: number | null;
  nota_mesa?: string | null;
}

export interface ImpactoAgregado {
  colonias: ImpactoColonia[];
  poblacion_total: number;
  densidad_promedio?: number | null;
  viviendas_total: number;
  lista_nominal_total: number;
  actores: string[];
}

export interface InstalacionPunto {
  nombre: string;
  tipo_nombre: string;
  colonia_nombre: string;
  lat: number;
  lng: number;
  estado_nombre: string;
  nota: string;
}

export interface TimelineEventoCuarto {
  fecha: string;
  tipo_nombre: string;
  actor_nombre?: string | null;
  demanda_nombre?: string | null;
  descripcion: string;
  respuesta_nombre: string;
  detalle_respuesta: string;
  resultado: string;
  enlace?: string | null;
}

export interface CorteTemporal {
  etiqueta: string;
  poblacion: number;
  intensidad: number;
  nota: string;
}

export interface ContextoAnalista {
  texto: string;
  factores: string[];
}

export interface CasoIndice {
  slug: string;
  nombre: string;
  subtitulo: string;
  tema: string;
  tema_nombre: string;
  resumen: string;
}

export interface CasoSituacion {
  slug: string;
  nombre: string;
  subtitulo: string;
  tema: string;
  tema_nombre: string;
  resumen: string;
  demanda: DemandaAncla | null;
  pasos: PasoCuarto[];
  celdas: CeldaConsumible[];
  por_zona: CeldaConsumible[];
  barras_zona: { label: string; value: number; tone?: string; hint?: string }[];
  impacto: ImpactoAgregado;
  instalaciones: InstalacionPunto[];
  timeline: TimelineEventoCuarto[];
  entonces: CorteTemporal | null;
  ahora: CorteTemporal | null;
  contexto: ContextoAnalista;
  recomendaciones: string[];
}
