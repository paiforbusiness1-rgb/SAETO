import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { DiscursoDetail, DiscursoSummary } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./DiscursoPages.module.css";

export function DiscursoListPage() {
  const [items, setItems] = useState<DiscursoSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .discursos()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <GlassPanel strong>
      <BotonVolver />
      <h1>Laboratorio de discurso</h1>
      <p className={styles.lead}>
        Tópico, audiencia y lectura por niveles (marco del PDF de análisis político).
      </p>
      {loading ? (
        <StateBlock>Cargando…</StateBlock>
      ) : error ? (
        <StateBlock actionLabel="Reintentar" onAction={load}>
          {error}
        </StateBlock>
      ) : (
        <div className={styles.list}>
          {items.map((d) => (
            <GlassCard key={d.slug} to={`/discurso/${d.slug}`}>
              <strong>{d.topico_principal}</strong>
              <p className={styles.meta}>
                {d.actor_nombre} · {d.audiencia}
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

export function DiscursoDetailPage() {
  const { slug = "" } = useParams();
  const [item, setItem] = useState<DiscursoDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api
      .discurso(slug)
      .then((d) => {
        setItem(d);
        setOpen(d.niveles_meta[0]?.slug ?? null);
      })
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <GlassPanel>
        <BotonVolver to="/discurso" label="Volver a discurso" />
        <StateBlock>{error}</StateBlock>
      </GlassPanel>
    );
  }

  if (!item) {
    return (
      <GlassPanel>
        <StateBlock>Cargando ficha…</StateBlock>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel strong>
      <BotonVolver to="/discurso" label="Volver a discurso" />
      <h1>{item.topico_principal}</h1>
      <p className={styles.meta}>
        Actor:{" "}
        <Link to={`/actores/${item.actor}`} className={styles.inline}>
          {item.actor_nombre}
        </Link>
      </p>
      <p className={styles.meta}>Audiencia: {item.audiencia}</p>
      <p className={styles.meta}>Subtópicos: {item.subtopicos.join(" · ")}</p>

      <div className={styles.accordion}>
        {item.niveles_meta.map((nivel) => {
          const isOpen = open === nivel.slug;
          return (
            <div key={nivel.slug} className={styles.item}>
              <button
                type="button"
                className={styles.trigger}
                onClick={() => setOpen(isOpen ? null : nivel.slug)}
                aria-expanded={isOpen}
              >
                {nivel.nombre}
              </button>
              {isOpen ? (
                <div className={styles.body}>
                  <p>{item.niveles[nivel.slug] ?? "Sin captura en demo."}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <Link to="/" className={styles.backLink}>
        Volver al brief
      </Link>
    </GlassPanel>
  );
}
