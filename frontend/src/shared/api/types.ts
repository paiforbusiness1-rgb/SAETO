export type Semaforo = "verde" | "amarillo" | "rojo";

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
  estado_verificacion: "declarado" | "corroborado_demo";
  reivindicaciones_abiertas: string[];
}

export interface ActorDetail extends ActorSummary {
  demo: boolean;
  notas_mesa: string;
  reivindicaciones_nombres: string[];
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
}

export interface ReivindicacionDetail extends ReivindicacionSummary {
  demo: boolean;
  resumen_deuda: string;
}

export interface DiscursoSummary {
  slug: string;
  actor: string;
  actor_nombre: string;
  topico_principal: string;
  subtopicos: string[];
  audiencia: string;
}

export interface DiscursoDetail extends DiscursoSummary {
  demo: boolean;
  niveles: Record<string, string>;
  niveles_meta: { slug: string; nombre: string; subtopicos: string[] }[];
}

export interface Brief {
  demo: boolean;
  resumen_ejecutivo: string;
  alertas_coyuntura: string[];
  actores_clave: ActorSummary[];
  reivindicaciones_top: ReivindicacionSummary[];
  conteo_semaforo: Record<string, number>;
}
