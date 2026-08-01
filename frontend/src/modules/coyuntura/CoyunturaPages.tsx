import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { CatalogosConfig, CoyunturaDetail, CoyunturaSummary } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./CoyunturaPages.module.css";

export function CoyunturaListPage() {
  const [items, setItems] = useState<CoyunturaSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .coyuntura()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = [...items].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  return (
    <GlassPanel strong>
      <BotonVolver />
      <h1>Bitácora de coyuntura</h1>
      <p className={styles.lead}>
        Acción → respuesta gubernamental → reacción → resultado (el CÓMO de la mesa).
      </p>
      <div className={styles.actions}>
        <Link to="/captura/coyuntura" className={styles.linkBtn}>
          Capturar evento
        </Link>
      </div>
      {loading ? (
        <StateBlock>Cargando…</StateBlock>
      ) : error ? (
        <StateBlock actionLabel="Reintentar" onAction={load}>
          {error}
        </StateBlock>
      ) : (
        <div className={styles.list}>
          {sorted.map((e) => (
            <GlassCard key={e.slug} to={`/coyuntura/${e.slug}`}>
              <time className={styles.fecha}>{e.fecha}</time>
              <strong>{e.tipo_accion_nombre || e.tipo_accion}</strong>
              <p className={styles.meta}>
                {e.actor_nombre ? `${e.actor_nombre}` : ""}
                {e.actor_nombre && e.demanda_nombre ? " · " : ""}
                {e.demanda_nombre ?? ""}
              </p>
            </GlassCard>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

export function CoyunturaDetailPage() {
  const { slug = "" } = useParams();
  const [item, setItem] = useState<CoyunturaDetail | null>(null);
  const [catalogos, setCatalogos] = useState<CatalogosConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError(null);
    Promise.all([api.coyunturaEvento(slug), api.catalogosConfig()])
      .then(([ev, cats]) => {
        setItem(ev);
        setCatalogos(cats);
      })
      .catch((e: Error) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, [slug]);

  const labelRespuesta =
    catalogos?.coyuntura.respuestas_gobierno.find(
      (r) => r.slug === item?.respuesta_gobierno,
    )?.nombre ?? item?.respuesta_gobierno;
  const labelReaccion =
    catalogos?.coyuntura.reacciones.find((r) => r.slug === item?.reaccion)?.nombre ??
    item?.reaccion;
  const labelFase =
    catalogos?.ciclo_vital.fases.find((f) => f.slug === item?.impacto_ciclo)?.nombre ??
    item?.impacto_ciclo?.replaceAll("_", " ");

  const onAplicarFase = async () => {
    if (!item?.demanda || !item.impacto_ciclo) return;
    const ok = confirm(
      `¿Confirmar cambio de fase de la demanda a «${labelFase}»?\nEsto actualiza el ciclo vital (con historial).`,
    );
    if (!ok) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await api.aplicarFaseCoyuntura(item.slug);
      setMsg(
        `Fase aplicada: ${res.fase_nombre} en ${res.demanda_nombre}. Revise la ficha de la demanda.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (error && !item) {
    return (
      <GlassPanel>
        <BotonVolver to="/coyuntura" label="Volver a coyuntura" />
        <StateBlock>{error}</StateBlock>
      </GlassPanel>
    );
  }

  if (!item) {
    return (
      <GlassPanel>
        <StateBlock>Cargando evento…</StateBlock>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel strong>
      <BotonVolver to="/coyuntura" label="Volver a coyuntura" />
      <h1>{item.tipo_accion_nombre || item.tipo_accion}</h1>
      <p className={styles.meta}>Fecha: {item.fecha}</p>
      {item.actor_nombre ? (
        <p className={styles.meta}>
          Actor:{" "}
          <Link to={`/actores/${item.actor}`} className={styles.inline}>
            {item.actor_nombre}
          </Link>
        </p>
      ) : null}
      {item.demanda_nombre ? (
        <p className={styles.meta}>
          Demanda:{" "}
          <Link to={`/observatorio/${item.demanda}`} className={styles.inline}>
            {item.demanda_nombre}
          </Link>
        </p>
      ) : null}

      <div className={styles.block}>
        <h2>Acción</h2>
        <p>{item.descripcion_accion || "Sin descripción."}</p>
      </div>
      <div className={styles.block}>
        <h2>Respuesta gubernamental</h2>
        <p>{labelRespuesta}</p>
        {item.detalle_respuesta ? <p>{item.detalle_respuesta}</p> : null}
      </div>
      <div className={styles.block}>
        <h2>Reacción</h2>
        <p>{labelReaccion}</p>
      </div>
      <div className={styles.block}>
        <h2>Resultado / consecuencias</h2>
        <p>{item.resultado || "Sin registro."}</p>
      </div>
      {item.impacto_ciclo ? (
        <div className={styles.block}>
          <h2>Impacto propuesto en ciclo</h2>
          <p>{labelFase}</p>
          {item.demanda ? (
            <button
              type="button"
              className={styles.linkBtn}
              disabled={busy}
              onClick={onAplicarFase}
              style={{ marginTop: "0.75rem", cursor: "pointer" }}
            >
              {busy ? "Aplicando…" : "Confirmar cambio de fase en la demanda"}
            </button>
          ) : (
            <p className={styles.meta}>
              Ligar el evento a una demanda para poder confirmar el cambio de fase.
            </p>
          )}
        </div>
      ) : null}
      {msg ? <p className={styles.okMsg}>{msg}</p> : null}
      {error ? <p className={styles.errMsg}>{error}</p> : null}
      <Link to={`/captura/coyuntura/${item.slug}`} className={styles.backLink}>
        Editar evento
      </Link>
    </GlassPanel>
  );
}
