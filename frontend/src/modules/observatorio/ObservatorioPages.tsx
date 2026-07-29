import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { ReivindicacionDetail, ReivindicacionSummary } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { SemaforoPill } from "../../shared/ui/SemaforoPill";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./ObservatorioPages.module.css";

export function ObservatorioListPage() {
  const [items, setItems] = useState<ReivindicacionSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .reivindicaciones()
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
      <h1>Observatorio de reivindicaciones</h1>
      <p className={styles.lead}>
        Demandas con peso político — no encuesta de satisfacción genérica.
      </p>
      {loading ? (
        <StateBlock>Cargando…</StateBlock>
      ) : error ? (
        <StateBlock actionLabel="Reintentar" onAction={load}>
          {error}
        </StateBlock>
      ) : (
        <div className={styles.list}>
          {items.map((r) => (
            <GlassCard key={r.slug} to={`/observatorio/${r.slug}`}>
              <div className={styles.row}>
                <div>
                  <strong>{r.tema_nombre}</strong>
                  <p className={styles.meta}>
                    {r.territorio_nombre} · {r.zona_nombre}
                    {r.deuda_historica ? " · Deuda histórica" : ""}
                  </p>
                </div>
                <SemaforoPill value={r.semaforo} label={r.semaforo_etiqueta} />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

export function ObservatorioDetailPage() {
  const { slug = "" } = useParams();
  const [item, setItem] = useState<ReivindicacionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api
      .reivindicacion(slug)
      .then(setItem)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <GlassPanel>
        <BotonVolver to="/observatorio" label="Volver a reivindicaciones" />
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
      <BotonVolver to="/observatorio" label="Volver a reivindicaciones" />
      <div className={styles.head}>
        <h1>{item.tema_nombre}</h1>
        <SemaforoPill value={item.semaforo} label={item.semaforo_etiqueta} />
      </div>
      <p className={styles.meta}>
        {item.territorio_nombre} · {item.zona_nombre} · Intensidad {item.intensidad}/5 ·
        Peso de opinión {item.peso_opinion}
      </p>
      <div className={styles.block}>
        <h2>Cuenta pendiente</h2>
        <p>{item.resumen_deuda}</p>
        <p className={styles.meta}>
          Fuente: {item.fuente.replaceAll("_", " ")}
          {item.deuda_historica ? " · Marcada como deuda histórica" : ""}
        </p>
      </div>
      <Link to="/" className={styles.backLink}>
        Volver al brief
      </Link>
    </GlassPanel>
  );
}
