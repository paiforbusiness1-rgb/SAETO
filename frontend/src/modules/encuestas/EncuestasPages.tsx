import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type {
  EncuestaDetail,
  EncuestaPlantilla,
  EncuestaSummary,
} from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./EncuestasPages.module.css";

function labelOpcion(plantilla: EncuestaPlantilla | null, preguntaSlug: string, valor: string): string {
  const preg = plantilla?.preguntas.find((p) => p.slug === preguntaSlug);
  const op = preg?.opciones.find((o) => o.slug === valor);
  return op?.nombre ?? valor.replaceAll("_", " ");
}

export function EncuestasListPage() {
  const [items, setItems] = useState<EncuestaSummary[]>([]);
  const [colonias, setColonias] = useState<
    { slug: string; nombre: string; zona: string }[]
  >([]);
  const [plantillas, setPlantillas] = useState<
    { slug: string; nombre: string }[]
  >([]);
  const [colonia, setColonia] = useState("");
  const [plantilla, setPlantilla] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.encuestas({
        colonia: colonia || undefined,
        plantilla: plantilla || undefined,
      }),
      api.catalogoTerritorio(),
      api.encuestaPlantillas(),
    ])
      .then(([list, terr, plants]) => {
        setItems(list);
        setColonias(terr.colonias_demo);
        setPlantillas(plants);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [colonia, plantilla]);

  return (
    <GlassPanel strong>
      <BotonVolver />
      <h1>Encuestas</h1>
      <p className={styles.lead}>
        Percepción local anonimizada. Plantillas: rápida de mesa, percepción ciudadana y
        diagnóstico de necesidades. Sin nombre ni teléfono.
      </p>
      <div className={styles.actions}>
        <Link to="/captura/encuestas" className={styles.linkBtn}>
          Capturar respuesta
        </Link>
        <Link to="/reportes/encuestas" className={styles.linkBtnGhost}>
          Ver reporte
        </Link>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterField}>
          <label htmlFor="filtro-colonia">Colonia</label>
          <select
            id="filtro-colonia"
            value={colonia}
            onChange={(e) => setColonia(e.target.value)}
          >
            <option value="">Todas</option>
            {colonias.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="filtro-plantilla">Plantilla</label>
          <select
            id="filtro-plantilla"
            value={plantilla}
            onChange={(e) => setPlantilla(e.target.value)}
          >
            <option value="">Todas</option>
            {plantillas.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <StateBlock>Cargando…</StateBlock>
      ) : error ? (
        <StateBlock actionLabel="Reintentar" onAction={load}>
          {error}
        </StateBlock>
      ) : (
        <div className={styles.list}>
          {items.map((e) => (
            <GlassCard key={e.slug} to={`/encuestas/${e.slug}`}>
              <time className={styles.fecha}>{e.fecha}</time>
              <strong>{e.colonia_nombre}</strong>
              <p className={styles.meta}>
                {e.plantilla_nombre || e.plantilla} · {e.zona_nombre}
                {e.problemas_prioridad.length
                  ? ` · Prioridades: ${e.problemas_prioridad.join(", ")}`
                  : ""}
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

export function EncuestaDetailPage() {
  const { slug = "" } = useParams();
  const [item, setItem] = useState<EncuestaDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api
      .encuesta(slug)
      .then(setItem)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <GlassPanel>
        <BotonVolver to="/encuestas" label="Volver a encuestas" />
        <StateBlock>{error}</StateBlock>
      </GlassPanel>
    );
  }

  if (!item) {
    return (
      <GlassPanel>
        <StateBlock>Cargando respuesta…</StateBlock>
      </GlassPanel>
    );
  }

  const plantilla = item.plantilla_meta;
  const preguntas = [...(plantilla?.preguntas ?? [])].sort(
    (a, b) => (a.orden ?? 0) - (b.orden ?? 0),
  );
  const bloqueNombre = new Map(
    (plantilla?.bloques || []).map((b) => [b.slug, b.nombre] as const),
  );

  let lastBloque = "";

  return (
    <GlassPanel strong>
      <BotonVolver to="/encuestas" label="Volver a encuestas" />
      <h1>Respuesta · {item.colonia_nombre}</h1>
      <p className={styles.meta}>
        {item.fecha} · {item.zona_nombre} · {item.plantilla_nombre || item.plantilla}
      </p>
      <p className={styles.disclaimer}>
        {plantilla?.disclaimer || "Captura anonimizada."}
      </p>

      {preguntas.map((p) => {
        const val = item.respuestas[p.slug];
        let display = "—";
        if (Array.isArray(val)) {
          display = val
            .map((v) => labelOpcion(plantilla, p.slug, String(v)))
            .join(" · ");
        } else if (val !== undefined && val !== null && val !== "") {
          if (p.tipo === "texto" || p.tipo === "numero" || p.tipo === "escala") {
            display = String(val);
          } else {
            display = labelOpcion(plantilla, p.slug, String(val));
          }
        }
        const showBloque = p.bloque && p.bloque !== lastBloque;
        if (p.bloque) lastBloque = p.bloque;
        return (
          <div key={p.slug} className={styles.block}>
            {showBloque ? (
              <p className={styles.meta}>{bloqueNombre.get(p.bloque!) || p.bloque}</p>
            ) : null}
            <h2>{p.texto}</h2>
            <p>{display}</p>
          </div>
        );
      })}

      {item.notas_mesa ? (
        <div className={styles.block}>
          <h2>Notas de mesa</h2>
          <p>{item.notas_mesa}</p>
        </div>
      ) : null}

      <Link to={`/captura/encuestas/${item.slug}`} className={styles.backLink}>
        Editar respuesta
      </Link>
    </GlassPanel>
  );
}
