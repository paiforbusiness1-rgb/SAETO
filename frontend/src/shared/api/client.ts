import type {
  ActorDetail,
  ActorSummary,
  Brief,
  CatalogosConfig,
  CeldaCalor,
  CorredorRanking,
  CoyunturaDetail,
  CoyunturaSummary,
  DiscursoDetail,
  DiscursoSummary,
  EncuestaDetail,
  EncuestaPlantilla,
  EncuestaSummary,
  EvaluacionMesa,
  Health,
  IndicadorContexto,
  MapaCalorResponse,
  PanoramaTerritorial,
  ReivindicacionDetail,
  ReivindicacionSummary,
  SaetoRol,
  SalaOperativa,
  SectorCobertura,
  ClasificarTextoResponse,
  ContextoDecisionResponse,
  ConsumiblesIndice,
  IaStatus,
  LaminaConsumible,
  PanoramaLecturaResponse,
  CasoSituacion,
  CasoIndice,
} from "./types";

const SAETO_ROL_KEY = "saeto_rol";
const ROL_CHANGE_EVENT = "saeto-rol-change";

export function getSaetoRol(): SaetoRol {
  const stored = localStorage.getItem(SAETO_ROL_KEY);
  const roles: SaetoRol[] = [
    "lector",
    "capturista",
    "analista",
    "analista_sensible",
    "admin",
  ];
  if (stored && roles.includes(stored as SaetoRol)) {
    return stored as SaetoRol;
  }
  return "analista";
}

export function setSaetoRol(rol: SaetoRol): void {
  localStorage.setItem(SAETO_ROL_KEY, rol);
  window.dispatchEvent(new CustomEvent(ROL_CHANGE_EVENT));
}

export function onSaetoRolChange(handler: () => void): () => void {
  window.addEventListener(ROL_CHANGE_EVENT, handler);
  return () => window.removeEventListener(ROL_CHANGE_EVENT, handler);
}

export function rolVeSensible(rol: SaetoRol = getSaetoRol()): boolean {
  return rol === "analista_sensible" || rol === "admin";
}

function actorHeaders(): HeadersInit {
  return { "X-SAETO-Rol": getSaetoRol() };
}

async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return res.json() as Promise<T>;
}

async function apiSend<T>(
  path: string,
  method: string,
  body?: unknown,
  extraHeaders?: HeadersInit,
): Promise<T> {
  const headers: Record<string, string> = { ...(extraHeaders as Record<string, string>) };
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = `Error ${res.status}`;
    try {
      const data = await res.json();
      detail = data.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type ActorWrite = {
  nombre: string;
  colonia: string;
  zona: string;
  rol: string;
  organizacion: string;
  capacidad_movilizacion?: number;
  capacidad_estimada?: number;
  capacidad_comprobada?: number | null;
  fecha_comprobacion?: string | null;
  metodo_comprobacion?: string | null;
  tipo_actor?: string;
  reivindicaciones_abiertas: string[];
  estado_verificacion: string;
  notas_mesa: string;
  interes_declarado?: string;
  interes_reservado?: string;
  recursos_poder?: string[];
  notas_poder?: string;
  slug?: string | null;
};

export type ReivindicacionWrite = {
  tema: string;
  territorio: string;
  zona: string;
  intensidad: number;
  deuda_historica: boolean;
  resumen_deuda: string;
  fuente: string;
  peso_opinion: number;
  tipo_demanda?: string;
  fuentes_evidencia?: string[];
  fase_ciclo_vital?: string;
  grado_escalamiento?: number;
  sentido_ciclo?: string;
  fecha_deteccion?: string | null;
  fecha_ultima_actualizacion_ciclo?: string | null;
  notas_ciclo?: string;
  slug?: string | null;
};

export type DiscursoWrite = {
  actor: string;
  topico_principal: string;
  subtopicos: string[];
  audiencia: string;
  niveles: Record<string, string>;
  narrativas?: string;
  argumentos?: string;
  ideologia?: string;
  emociones?: string[];
  endo_grupo?: string;
  exo_grupo?: string;
  coaliciones_posibles?: string;
  hipotesis_mesa?: boolean;
  slug?: string | null;
};

export type CoyunturaWrite = {
  fecha: string;
  actor?: string | null;
  demanda?: string | null;
  tipo_accion: string;
  descripcion_accion?: string;
  respuesta_gobierno?: string;
  detalle_respuesta?: string;
  reaccion?: string;
  resultado?: string;
  impacto_ciclo?: string | null;
  fuentes?: string[];
  corredor_slug?: string | null;
  tramo_slug?: string | null;
  slug?: string | null;
};

export type IndicadorWrite = {
  territorio: string;
  zona?: string;
  clave: string;
  nombre: string;
  valor: number | string;
  anio: number;
  fuente?: string;
  nota?: string;
  slug?: string | null;
};

export type EncuestaWrite = {
  fecha: string;
  colonia: string;
  zona?: string;
  respuestas: Record<string, string | string[] | number>;
  notas_mesa?: string;
  plantilla?: string;
  slug?: string | null;
};

export type BriefWrite = {
  resumen_ejecutivo: string;
  alertas_coyuntura: string[];
  actores_clave_slugs: string[];
  reivindicaciones_top_slugs: string[];
};

export type BriefRaw = BriefWrite & { demo?: boolean };

export const api = {
  health: () => apiGet<Health>("/api/health"),
  catalogosConfig: () => apiGet<CatalogosConfig>("/api/config/catalogos"),

  brief: () => apiGet<Brief>("/api/dashboard/brief"),
  briefRaw: () => apiGet<BriefRaw>("/api/dashboard/brief/raw"),
  updateBrief: (body: BriefWrite) => apiSend<Brief>("/api/dashboard/brief", "PUT", body),

  actores: () =>
    apiGet<ActorSummary[]>("/api/actores", { headers: actorHeaders() }),
  actor: (slug: string) =>
    apiGet<ActorDetail>(`/api/actores/${slug}`, { headers: actorHeaders() }),
  createActor: (body: ActorWrite) =>
    apiSend<ActorDetail>("/api/actores", "POST", body, actorHeaders()),
  updateActor: (slug: string, body: ActorWrite) =>
    apiSend<ActorDetail>(`/api/actores/${slug}`, "PUT", body, actorHeaders()),
  deleteActor: (slug: string) =>
    apiSend<{ ok: boolean }>(`/api/actores/${slug}`, "DELETE", undefined, actorHeaders()),

  reivindicaciones: (params?: {
    zona?: string;
    tema?: string;
    fase?: string;
    sentido?: string;
    fuente?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.zona) q.set("zona", params.zona);
    if (params?.tema) q.set("tema", params.tema);
    if (params?.fase) q.set("fase", params.fase);
    if (params?.sentido) q.set("sentido", params.sentido);
    if (params?.fuente) q.set("fuente", params.fuente);
    const suffix = q.toString() ? `?${q}` : "";
    return apiGet<ReivindicacionSummary[]>(`/api/observatorio/reivindicaciones${suffix}`);
  },
  reivindicacion: (slug: string) =>
    apiGet<ReivindicacionDetail>(`/api/observatorio/reivindicaciones/${slug}`),
  createReivindicacion: (body: ReivindicacionWrite) =>
    apiSend<ReivindicacionDetail>("/api/observatorio/reivindicaciones", "POST", body),
  updateReivindicacion: (slug: string, body: ReivindicacionWrite) =>
    apiSend<ReivindicacionDetail>(
      `/api/observatorio/reivindicaciones/${slug}`,
      "PUT",
      body,
    ),
  deleteReivindicacion: (slug: string) =>
    apiSend<{ ok: boolean }>(`/api/observatorio/reivindicaciones/${slug}`, "DELETE"),

  indicadores: () => apiGet<IndicadorContexto[]>("/api/observatorio/indicadores"),
  upsertIndicador: (body: IndicadorWrite) =>
    apiSend<IndicadorContexto>("/api/observatorio/indicadores", "POST", body),
  deleteIndicador: (slug: string) =>
    apiSend<{ ok: boolean }>(`/api/observatorio/indicadores/${slug}`, "DELETE"),

  discursos: () => apiGet<DiscursoSummary[]>("/api/discurso"),
  discurso: (slug: string) => apiGet<DiscursoDetail>(`/api/discurso/${slug}`),
  createDiscurso: (body: DiscursoWrite) =>
    apiSend<DiscursoDetail>("/api/discurso", "POST", body),
  updateDiscurso: (slug: string, body: DiscursoWrite) =>
    apiSend<DiscursoDetail>(`/api/discurso/${slug}`, "PUT", body),
  deleteDiscurso: (slug: string) =>
    apiSend<{ ok: boolean }>(`/api/discurso/${slug}`, "DELETE"),

  coyuntura: (params?: { actor?: string; demanda?: string }) => {
    const q = new URLSearchParams();
    if (params?.actor) q.set("actor", params.actor);
    if (params?.demanda) q.set("demanda", params.demanda);
    const suffix = q.toString() ? `?${q}` : "";
    return apiGet<CoyunturaSummary[]>(`/api/coyuntura${suffix}`);
  },
  coyunturaEvento: (slug: string) => apiGet<CoyunturaDetail>(`/api/coyuntura/${slug}`),
  createCoyuntura: (body: CoyunturaWrite) =>
    apiSend<CoyunturaDetail>("/api/coyuntura", "POST", body, actorHeaders()),
  updateCoyuntura: (slug: string, body: CoyunturaWrite) =>
    apiSend<CoyunturaDetail>(`/api/coyuntura/${slug}`, "PUT", body, actorHeaders()),
  deleteCoyuntura: (slug: string) =>
    apiSend<{ ok: boolean }>(`/api/coyuntura/${slug}`, "DELETE"),
  aplicarFaseCoyuntura: (slug: string) =>
    apiSend<{
      ok: boolean;
      demanda: string;
      fase_aplicada: string;
      fase_nombre: string;
      demanda_nombre: string;
    }>(`/api/coyuntura/${slug}/aplicar-fase`, "POST"),

  encuestas: (params?: { colonia?: string; plantilla?: string }) => {
    const q = new URLSearchParams();
    if (params?.colonia) q.set("colonia", params.colonia);
    if (params?.plantilla) q.set("plantilla", params.plantilla);
    const suffix = q.toString() ? `?${q}` : "";
    return apiGet<EncuestaSummary[]>(`/api/encuestas${suffix}`);
  },
  encuestaPlantillas: () =>
    apiGet<
      { slug: string; nombre: string; disclaimer?: string; preguntas_count?: number }[]
    >("/api/encuestas/plantillas"),
  encuestaPlantilla: (slug: string) =>
    apiGet<EncuestaPlantilla>(`/api/encuestas/plantillas/${slug}`),
  encuesta: (slug: string) => apiGet<EncuestaDetail>(`/api/encuestas/${slug}`),
  createEncuesta: (body: EncuestaWrite) =>
    apiSend<EncuestaDetail>("/api/encuestas", "POST", body),
  updateEncuesta: (slug: string, body: EncuestaWrite) =>
    apiSend<EncuestaDetail>(`/api/encuestas/${slug}`, "PUT", body),
  deleteEncuesta: (slug: string) =>
    apiSend<{ ok: boolean }>(`/api/encuestas/${slug}`, "DELETE"),

  catalogoTerritorio: () =>
    apiGet<{
      zonas: { slug: string; nombre: string }[];
      colonias_demo: { slug: string; nombre: string; zona: string }[];
    }>("/api/catalogos/territorio"),
  saveTerritorio: (body: unknown) => apiSend("/api/catalogos/territorio", "PUT", body),
  catalogoTemas: () =>
    apiGet<{ temas: { slug: string; nombre: string; descripcion?: string }[] }>(
      "/api/catalogos/temas",
    ),
  saveTemas: (body: unknown) => apiSend("/api/catalogos/temas", "PUT", body),
  catalogoUmbrales: () =>
    apiGet<{
      intensidad: { min: number; max: number; semaforo: string; etiqueta: string }[];
    }>("/api/catalogos/umbrales"),
  saveUmbrales: (body: unknown) => apiSend("/api/catalogos/umbrales", "PUT", body),
  catalogoDiscursoNiveles: () =>
    apiGet<{
      niveles: { slug: string; nombre: string; subtopicos: string[] }[];
    }>("/api/catalogos/discurso-niveles"),
  saveDiscursoNiveles: (body: unknown) =>
    apiSend("/api/catalogos/discurso-niveles", "PUT", body),

  reporteEjecutivo: () => apiGet<any>("/api/reportes/ejecutivo"),
  reporteTerritorio: () => apiGet<any>("/api/reportes/territorio"),
  reporteActores: () => apiGet<any>("/api/reportes/actores"),
  reporteDeudas: () => apiGet<any>("/api/reportes/deudas"),
  reporteCicloVital: () => apiGet<any>("/api/reportes/ciclo-vital"),
  reporteCoyuntura: () => apiGet<any>("/api/reportes/coyuntura"),
  reporteDiscursoMesa: () => apiGet<any>("/api/reportes/discurso-mesa"),
  reporteContextoInegi: () => apiGet<any>("/api/reportes/contexto-inegi"),
  reporteEncuestas: (params?: { plantilla?: string }) => {
    const q = new URLSearchParams();
    if (params?.plantilla) q.set("plantilla", params.plantilla);
    const suffix = q.toString() ? `?${q}` : "";
    return apiGet<any>(`/api/reportes/encuestas${suffix}`);
  },
  reporteCalor: (capa = "compuesta") =>
    apiGet<any>(`/api/reportes/calor?capa=${encodeURIComponent(capa)}`),
  reporteCorredores: () => apiGet<any>("/api/reportes/corredores"),

  inteligenciaCalor: (capa = "compuesta", top = 10) =>
    apiGet<MapaCalorResponse>(
      `/api/inteligencia/calor?capa=${encodeURIComponent(capa)}&top=${top}`,
    ),
  inteligenciaCalorTop: (n = 10, capa = "compuesta") =>
    apiGet<CeldaCalor[]>(
      `/api/inteligencia/calor/top?n=${n}&capa=${encodeURIComponent(capa)}`,
    ),
  inteligenciaPanorama: (params?: { zona?: string; colonia?: string }) => {
    const q = new URLSearchParams();
    if (params?.zona) q.set("zona", params.zona);
    if (params?.colonia) q.set("colonia", params.colonia);
    const suffix = q.toString() ? `?${q}` : "";
    return apiGet<PanoramaTerritorial>(`/api/inteligencia/panorama${suffix}`);
  },
  inteligenciaCorredores: () =>
    apiGet<CorredorRanking[]>("/api/inteligencia/corredores"),
  inteligenciaCobertura: () =>
    apiGet<SectorCobertura[]>("/api/inteligencia/cobertura"),
  inteligenciaSala: () => apiGet<SalaOperativa>("/api/inteligencia/sala"),
  inteligenciaConfigCalor: () =>
    apiGet<{
      umbrales: { bandas: { slug: string; nombre: string; color: string }[] };
      capas: { capas: { slug: string; nombre: string }[] };
    }>("/api/inteligencia/config/calor"),
  createEvaluacionMesa: (body: {
    ventana: string;
    notas?: string;
    focos_revisados?: string[];
    checklist_ok?: string[];
  }) =>
    apiSend<EvaluacionMesa>(
      "/api/inteligencia/evaluaciones-mesa",
      "POST",
      body,
      actorHeaders(),
    ),

  iaStatus: () => apiGet<IaStatus>("/api/ia/status"),
  iaPanoramaLectura: (body: { zona?: string; colonia?: string }) =>
    apiSend<PanoramaLecturaResponse>(
      "/api/ia/panorama-lectura",
      "POST",
      body,
      actorHeaders(),
    ),
  iaClasificarTexto: (texto: string) =>
    apiSend<ClasificarTextoResponse>(
      "/api/ia/clasificar-texto",
      "POST",
      { texto },
      actorHeaders(),
    ),
  iaContextoDecision: (demanda_slug: string) =>
    apiSend<ContextoDecisionResponse>(
      "/api/ia/contexto-decision",
      "POST",
      { demanda_slug },
      actorHeaders(),
    ),

  consumiblesIndice: () => apiGet<ConsumiblesIndice>("/api/consumibles"),
  consumibleLamina: (slug: string, tema?: string) => {
    const q = tema ? `?tema=${encodeURIComponent(tema)}` : "";
    return apiGet<LaminaConsumible>(`/api/consumibles/laminas/${slug}${q}`);
  },

  cuartoCasos: () => apiGet<CasoIndice[]>("/api/cuarto/casos"),
  cuartoCaso: (slug: string) => apiGet<CasoSituacion>(`/api/cuarto/casos/${encodeURIComponent(slug)}`),
  cuartoDescargarReporte: async (slug: string, nombre: string) => {
    const res = await fetch(`/api/cuarto/casos/${encodeURIComponent(slug)}/reporte`, {
      headers: actorHeaders(),
    });
    if (!res.ok) {
      let detail = `Error ${res.status}`;
      try {
        const body = await res.json();
        detail = body.detail ?? detail;
      } catch {
        /* ignore */
      }
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SAETO diagnóstico ${nombre}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
