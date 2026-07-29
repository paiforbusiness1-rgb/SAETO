import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { ActorDetail, ActorSummary } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./ActoresPages.module.css";

export function ActoresListPage() {
  const [items, setItems] = useState<ActorSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .actores()
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
      <h1>Mapa de actores</h1>
      <p className={styles.lead}>
        Liderazgos, organizaciones y capacidad de movilización (datos demo).
      </p>
      {loading ? (
        <StateBlock>Cargando…</StateBlock>
      ) : error ? (
        <StateBlock actionLabel="Reintentar" onAction={load}>
          {error}
        </StateBlock>
      ) : (
        <div className={styles.grid}>
          {items.map((a) => (
            <GlassCard key={a.slug} to={`/actores/${a.slug}`}>
              <strong>{a.nombre}</strong>
              <p className={styles.meta}>
                {a.rol} · {a.organizacion}
              </p>
              <p className={styles.meta}>
                {a.colonia_nombre} · moviliza ~{a.capacidad_movilizacion}
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

export function ActorDetailPage() {
  const { slug = "" } = useParams();
  const [item, setItem] = useState<ActorDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api
      .actor(slug)
      .then(setItem)
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  if (error) {
    return (
      <GlassPanel>
        <BotonVolver to="/actores" label="Volver a actores" />
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
      <BotonVolver to="/actores" label="Volver a actores" />
      <h1>{item.nombre}</h1>
      <p className={styles.meta}>
        {item.rol} · {item.organizacion}
      </p>
      <p className={styles.meta}>
        {item.colonia_nombre}, {item.zona_nombre} · Verificación:{" "}
        {item.estado_verificacion.replaceAll("_", " ")}
      </p>
      <div className={styles.block}>
        <h2>Capacidad de movilización</h2>
        <p>~{item.capacidad_movilizacion} personas (estimación demo)</p>
      </div>
      <div className={styles.block}>
        <h2>Reivindicaciones abiertas</h2>
        <p>{item.reivindicaciones_nombres.join(", ")}</p>
      </div>
      <div className={styles.block}>
        <h2>Notas para la mesa</h2>
        <p>{item.notas_mesa}</p>
      </div>
      <div className={styles.actions}>
        <Link to={`/discurso`}>Ver discursos</Link>
        <Link to="/">Volver al brief</Link>
      </div>
    </GlassPanel>
  );
}
