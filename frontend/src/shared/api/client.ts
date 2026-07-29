import type {
  ActorDetail,
  ActorSummary,
  Brief,
  DiscursoDetail,
  DiscursoSummary,
  Health,
  ReivindicacionDetail,
  ReivindicacionSummary,
} from "./types";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
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

async function apiSend<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
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
  capacidad_movilizacion: number;
  reivindicaciones_abiertas: string[];
  estado_verificacion: "declarado" | "corroborado_demo";
  notas_mesa: string;
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
  slug?: string | null;
};

export type DiscursoWrite = {
  actor: string;
  topico_principal: string;
  subtopicos: string[];
  audiencia: string;
  niveles: Record<string, string>;
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
  brief: () => apiGet<Brief>("/api/dashboard/brief"),
  briefRaw: () => apiGet<BriefRaw>("/api/dashboard/brief/raw"),
  updateBrief: (body: BriefWrite) => apiSend<Brief>("/api/dashboard/brief", "PUT", body),

  actores: () => apiGet<ActorSummary[]>("/api/actores"),
  actor: (slug: string) => apiGet<ActorDetail>(`/api/actores/${slug}`),
  createActor: (body: ActorWrite) => apiSend<ActorDetail>("/api/actores", "POST", body),
  updateActor: (slug: string, body: ActorWrite) =>
    apiSend<ActorDetail>(`/api/actores/${slug}`, "PUT", body),
  deleteActor: (slug: string) => apiSend<{ ok: boolean }>(`/api/actores/${slug}`, "DELETE"),

  reivindicaciones: (params?: { zona?: string; tema?: string }) => {
    const q = new URLSearchParams();
    if (params?.zona) q.set("zona", params.zona);
    if (params?.tema) q.set("tema", params.tema);
    const suffix = q.toString() ? `?${q}` : "";
    return apiGet<ReivindicacionSummary[]>(`/api/observatorio/reivindicaciones${suffix}`);
  },
  reivindicacion: (slug: string) =>
    apiGet<ReivindicacionDetail>(`/api/observatorio/reivindicaciones/${slug}`),
  createReivindicacion: (body: ReivindicacionWrite) =>
    apiSend<ReivindicacionDetail>("/api/observatorio/reivindicaciones", "POST", body),
  updateReivindicacion: (slug: string, body: ReivindicacionWrite) =>
    apiSend<ReivindicacionDetail>(`/api/observatorio/reivindicaciones/${slug}`, "PUT", body),
  deleteReivindicacion: (slug: string) =>
    apiSend<{ ok: boolean }>(`/api/observatorio/reivindicaciones/${slug}`, "DELETE"),

  discursos: () => apiGet<DiscursoSummary[]>("/api/discurso"),
  discurso: (slug: string) => apiGet<DiscursoDetail>(`/api/discurso/${slug}`),
  createDiscurso: (body: DiscursoWrite) =>
    apiSend<DiscursoDetail>("/api/discurso", "POST", body),
  updateDiscurso: (slug: string, body: DiscursoWrite) =>
    apiSend<DiscursoDetail>(`/api/discurso/${slug}`, "PUT", body),
  deleteDiscurso: (slug: string) =>
    apiSend<{ ok: boolean }>(`/api/discurso/${slug}`, "DELETE"),

  catalogoTerritorio: () =>
    apiGet<{ zonas: { slug: string; nombre: string }[]; colonias_demo: { slug: string; nombre: string; zona: string }[] }>(
      "/api/catalogos/territorio",
    ),
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
};
