import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type {
  CatalogosConfig,
  CoyunturaSummary,
  IndicadorContexto,
  ReivindicacionDetail,
  ReivindicacionSummary,
} from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { CicloBadge } from "../../shared/ui/CicloBadge";
import { CoyunturaTimeline } from "../../shared/ui/CoyunturaTimeline";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { SemaforoPill } from "../../shared/ui/SemaforoPill";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./ObservatorioPages.module.css";

export function ObservatorioListPage() {
  const [items, setItems] = useState<ReivindicacionSummary[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogosConfig | null>(null);
  const [fase, setFase] = useState("");
  const [sentido, setSentido] = useState("");
  const [fuente, setFuente] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.reivindicaciones({
        fase: fase || undefined,
        sentido: sentido || undefined,
        fuente: fuente || undefined,
      }),
      catalogos ? Promise.resolve(catalogos) : api.catalogosConfig(),
    ])
      .then(([list, cats]) => {
        setItems(list);
        if (!catalogos) setCatalogos(cats);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [fase, sentido, fuente]);

  const fases = catalogos?.ciclo_vital.fases ?? [];
  const sentidos = catalogos?.ciclo_vital.sentidos_ciclo ?? [];
  const fuentes = catalogos?.ciclo_vital.fuentes_evidencia ?? [];

  return (
    <GlassPanel strong>
      <BotonVolver />
      <h1>Observatorio de reivindicaciones</h1>
      <p className={styles.lead}>
        Demandas con peso político — no encuesta de satisfacción genérica.
      </p>

      <div className={styles.filters}>
        <div className={styles.filterField}>
          <label htmlFor="filtro-fase">Fase del ciclo</label>
          <select
            id="filtro-fase"
            value={fase}
            onChange={(e) => setFase(e.target.value)}
          >
            <option value="">Todas las fases</option>
            {fases.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="filtro-sentido">Sentido</label>
          <select
            id="filtro-sentido"
            value={sentido}
            onChange={(e) => setSentido(e.target.value)}
          >
            <option value="">Todos</option>
            {sentidos.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterField}>
          <label htmlFor="filtro-fuente">Fuente de evidencia</label>
          <select
            id="filtro-fuente"
            value={fuente}
            onChange={(e) => setFuente(e.target.value)}
          >
            <option value="">Todas</option>
            {fuentes.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.nombre}
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
          {items.map((r) => (
            <GlassCard key={r.slug} to={`/observatorio/${r.slug}`}>
              <div className={styles.row}>
                <div>
                  <strong>{r.tema_nombre}</strong>
                  <p className={styles.meta}>
                    {r.territorio_nombre} · {r.zona_nombre}
                    {r.deuda_historica ? " · Deuda histórica" : ""}
                  </p>
                  <CicloBadge
                    faseNombre={r.fase_ciclo_nombre}
                    sentido={r.sentido_ciclo}
                    compact
                  />
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
  const [indicadores, setIndicadores] = useState<IndicadorContexto[]>([]);
  const [eventos, setEventos] = useState<CoyunturaSummary[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogosConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    Promise.all([
      api.reivindicacion(slug),
      api.catalogosConfig(),
      api.indicadores(),
      api.coyuntura({ demanda: slug }),
    ])
      .then(([rev, cats, inds, evs]) => {
        setItem(rev);
        setCatalogos(cats);
        setIndicadores(inds.filter((i) => i.territorio === rev.territorio));
        setEventos(evs);
      })
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  const nombreFuente = (slugFuente: string) => {
    const found = catalogos?.ciclo_vital.fuentes_evidencia.find(
      (f) => f.slug === slugFuente,
    );
    return found?.nombre ?? slugFuente.replaceAll("_", " ");
  };

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
      <CicloBadge
        faseNombre={item.fase_ciclo_nombre}
        sentido={item.sentido_ciclo}
        grado={item.grado_escalamiento}
      />
      <p className={styles.meta}>
        {item.territorio_nombre} · {item.zona_nombre} · Intensidad {item.intensidad}/5 ·
        Peso de opinión {item.peso_opinion}
      </p>

      <div className={styles.block}>
        <h2>Ciclo vital</h2>
        <p>
          Tipo:{" "}
          {item.tipo_demanda === "historica_latente"
            ? "Histórica latente"
            : "Actual in situ"}
        </p>
        <p>Grado de escalamiento: {item.grado_escalamiento}/5</p>
        {item.fecha_deteccion ? (
          <p className={styles.meta}>Detección: {item.fecha_deteccion}</p>
        ) : null}
        {item.fecha_ultima_actualizacion_ciclo ? (
          <p className={styles.meta}>
            Última revisión: {item.fecha_ultima_actualizacion_ciclo}
          </p>
        ) : null}
        {item.fuentes_evidencia.length > 0 ? (
          <p className={styles.meta}>
            Evidencia: {item.fuentes_evidencia.map(nombreFuente).join(" · ")}
          </p>
        ) : null}
        {item.notas_ciclo ? <p>{item.notas_ciclo}</p> : null}
      </div>

      <div className={styles.block}>
        <h2>Historial de fases</h2>
        {(item.historial_ciclo ?? []).length === 0 ? (
          <p className={styles.meta}>Sin cambios de fase registrados.</p>
        ) : (
          <ol className={styles.histList}>
            {[...(item.historial_ciclo ?? [])]
              .sort((a, b) => a.fecha.localeCompare(b.fecha))
              .map((h, i) => (
                <li key={`${h.fase}-${h.fecha}-${i}`}>
                  <strong>{h.fase_nombre || h.fase}</strong>
                  <span className={styles.meta}>
                    {" "}
                    · {h.fecha} · {h.origen.replaceAll("_", " ").replace(":", " · ")}
                  </span>
                  {h.nota ? <p>{h.nota}</p> : null}
                </li>
              ))}
          </ol>
        )}
      </div>

      <div className={styles.block}>
        <h2>Cuenta pendiente</h2>
        <p>{item.resumen_deuda}</p>
        <p className={styles.meta}>
          Fuente: {item.fuente.replaceAll("_", " ")}
          {item.deuda_historica ? " · Marcada como deuda histórica" : ""}
        </p>
      </div>

      <div className={styles.block}>
        <h2>Contexto estadístico (referencial)</h2>
        <p className={styles.disclaimer}>
          Indicadores INEGI de contexto — no son levantamiento SAETO ni sustituyen la
          lectura de campo.
        </p>
        {indicadores.length === 0 ? (
          <p className={styles.meta}>Sin indicadores para esta colonia.</p>
        ) : (
          <ul className={styles.indList}>
            {indicadores.map((ind) => (
              <li key={ind.slug}>
                <strong>{ind.nombre}</strong>: {ind.valor} ({ind.anio}) · {ind.fuente}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.block}>
        <h2>Bitácora de coyuntura</h2>
        <CoyunturaTimeline eventos={eventos} />
      </div>

      <Link to="/" className={styles.backLink}>
        Volver al brief
      </Link>
    </GlassPanel>
  );
}
