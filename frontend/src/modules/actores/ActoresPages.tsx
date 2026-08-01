import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, onSaetoRolChange } from "../../shared/api/client";
import type { ActorDetail, ActorSummary, CoyunturaSummary } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { CoyunturaTimeline } from "../../shared/ui/CoyunturaTimeline";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./ActoresPages.module.css";

function movilizacionTexto(a: ActorSummary | ActorDetail): string {
  const est = a.capacidad_estimada ?? a.capacidad_movilizacion;
  if (a.capacidad_comprobada != null) {
    return `Estimada ~${est} · Comprobada ${a.capacidad_comprobada}`;
  }
  return `Estimada ~${est} (sin comprobación)`;
}

export function ActoresListPage() {
  const [items, setItems] = useState<ActorSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolTick, setRolTick] = useState(0);

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
  }, [rolTick]);

  useEffect(() => onSaetoRolChange(() => setRolTick((n) => n + 1)), []);

  return (
    <GlassPanel strong>
      <BotonVolver />
      <h1>Mapa de actores</h1>
      <p className={styles.lead}>
        Ranking territorial de liderazgos y movilización (estimada / comprobada).{" "}
        <strong>No es un mapa GIS</strong>: ubica por colonia/zona del catálogo, no
        cartografía.
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
                {a.colonia_nombre} · {movilizacionTexto(a)}
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
  const [eventos, setEventos] = useState<CoyunturaSummary[]>([]);
  const [catalogos, setCatalogos] = useState<{ recursos: { slug: string; nombre: string }[] } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [rolTick, setRolTick] = useState(0);

  const load = () => {
    setError(null);
    Promise.all([
      api.actor(slug),
      api.coyuntura({ actor: slug }),
      api.catalogosConfig(),
    ])
      .then(([actor, evs, cats]) => {
        setItem(actor);
        setEventos(evs);
        setCatalogos(cats.poder);
      })
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, [slug, rolTick]);

  useEffect(() => onSaetoRolChange(() => setRolTick((n) => n + 1)), []);

  const nombreRecurso = (slugRec: string) =>
    catalogos?.recursos.find((r) => r.slug === slugRec)?.nombre ??
    slugRec.replaceAll("_", " ");

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
        <p>{movilizacionTexto(item)}</p>
        {item.capacidad_comprobada != null ? (
          <p className={styles.meta}>
            Comprobación: {item.fecha_comprobacion} · método{" "}
            {item.metodo_comprobacion?.replaceAll("_", " ")}
          </p>
        ) : null}
        <p className={styles.meta}>
          Valor para ranking: ~{item.movilizacion_display} ({item.movilizacion_fuente})
        </p>
      </div>

      {item.interes_declarado ? (
        <div className={styles.block}>
          <h2>Interés declarado</h2>
          <p>{item.interes_declarado}</p>
        </div>
      ) : null}

      {item.interes_reservado ? (
        <div className={styles.block}>
          <h2>Interés reservado (acceso sensible)</h2>
          <p>{item.interes_reservado}</p>
        </div>
      ) : null}

      {item.recursos_poder.length > 0 ? (
        <div className={styles.block}>
          <h2>Recursos de poder</h2>
          <ul className={styles.tagList}>
            {item.recursos_poder.map((r) => (
              <li key={r}>{nombreRecurso(r)}</li>
            ))}
          </ul>
          {item.notas_poder ? <p>{item.notas_poder}</p> : null}
        </div>
      ) : null}

      <div className={styles.block}>
        <h2>Reivindicaciones abiertas</h2>
        <p>{item.reivindicaciones_nombres.join(", ") || "Ninguna vinculada"}</p>
      </div>

      <div className={styles.block}>
        <h2>Notas para la mesa</h2>
        <p>{item.notas_mesa}</p>
      </div>

      <div className={styles.block}>
        <h2>Bitácora de coyuntura</h2>
        <CoyunturaTimeline eventos={eventos} />
      </div>

      <div className={styles.actions}>
        <Link to="/discurso">Ver discursos</Link>
        <Link to="/">Volver al brief</Link>
      </div>
    </GlassPanel>
  );
}
