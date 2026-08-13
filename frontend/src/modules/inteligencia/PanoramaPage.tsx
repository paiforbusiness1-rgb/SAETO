import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { PanoramaTerritorial } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { CicloBadge } from "../../shared/ui/CicloBadge";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { SemaforoPill } from "../../shared/ui/SemaforoPill";
import { StateBlock } from "../../shared/ui/StateBlock";
import { IaPanel } from "../ia/IaPanel";
import styles from "./InteligenciaPages.module.css";

export function PanoramaPage() {
  const [params, setParams] = useSearchParams();
  const zona = params.get("zona") || "";
  const colonia = params.get("colonia") || "";
  const [zonas, setZonas] = useState<{ slug: string; nombre: string }[]>([]);
  const [colonias, setColonias] = useState<
    { slug: string; nombre: string; zona: string }[]
  >([]);
  const [data, setData] = useState<PanoramaTerritorial | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const coloniasFiltradas = useMemo(
    () => (zona ? colonias.filter((c) => c.zona === zona) : colonias),
    [colonias, zona],
  );

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .inteligenciaPanorama({
        zona: zona || undefined,
        colonia: colonia || undefined,
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.catalogoTerritorio().then((t) => {
      setZonas(t.zonas);
      setColonias(t.colonias_demo);
    });
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zona, colonia]);

  if (loading && !data) {
    return (
      <GlassPanel>
        <StateBlock>Cargando panorama…</StateBlock>
      </GlassPanel>
    );
  }

  if (error || !data) {
    return (
      <GlassPanel>
        <StateBlock actionLabel="Reintentar" onAction={load}>
          {error ?? "Sin datos"}
        </StateBlock>
      </GlassPanel>
    );
  }

  const titulo =
    data.colonia_nombre || data.zona_nombre || "Zona Oriente";

  return (
    <div className={styles.layout}>
      <GlassPanel strong>
        <BotonVolver to="/inteligencia" />
        <h1>Panorama · {titulo}</h1>
        <p className={styles.lead}>{data.resumen_ejecutivo}</p>
        <div className={styles.filters}>
          <label>
            Alcaldía
            <select
              value={zona}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                if (e.target.value) next.set("zona", e.target.value);
                else next.delete("zona");
                next.delete("colonia");
                setParams(next);
              }}
            >
              <option value="">Toda Oriente</option>
              {zonas.map((z) => (
                <option key={z.slug} value={z.slug}>
                  {z.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Colonia
            <select
              value={colonia}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                if (e.target.value) next.set("colonia", e.target.value);
                else next.delete("colonia");
                setParams(next);
              }}
            >
              <option value="">Todas</option>
              {coloniasFiltradas.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.actions}>
            <button type="button" onClick={load}>
              Recalcular
            </button>
            <Link className={styles.panelLink} to="/inteligencia/calor">
              Ver mapa
            </Link>
          </div>
        </div>
        {data.intensidad ? (
          <p className={styles.meta}>
            Intensidad: {data.intensidad.banda_nombre} · score{" "}
            {data.intensidad.score} · Escalando: {data.escalando}
          </p>
        ) : null}
      </GlassPanel>

      <div className={styles.mapGrid}>
        <GlassPanel>
          <div className={styles.sectionHead}>
            <h2>Reivindicaciones</h2>
            <Link to="/captura/reivindicaciones">Ir a captura</Link>
          </div>
          {data.top_reivindicaciones.length === 0 ? (
            <p className={styles.empty}>Sin reivindicaciones — capture o amplíe filtro.</p>
          ) : (
            <div className={styles.stack}>
              {data.top_reivindicaciones.map((r) => (
                <GlassCard key={r.slug} to={`/observatorio/${r.slug}`}>
                  <div className={styles.row}>
                    <div>
                      <strong>{r.tema_nombre}</strong>
                      <p className={styles.meta}>{r.territorio_nombre}</p>
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

        <GlassPanel>
          <div className={styles.sectionHead}>
            <h2>Coyuntura reciente</h2>
            <Link to="/captura/coyuntura">Registrar</Link>
          </div>
          {data.eventos_recientes.length === 0 ? (
            <p className={styles.empty}>Sin eventos en este recorte.</p>
          ) : (
            <ul className={styles.panelList}>
              {data.eventos_recientes.map((e) => (
                <li key={e.slug}>
                  <Link to={`/coyuntura/${e.slug}`}>
                    {e.fecha} · {e.tipo_accion_nombre}
                  </Link>
                  <span className={styles.meta}>
                    {" "}
                    {e.actor_nombre || "Sin actor"} · {e.demanda_nombre || "Sin demanda"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>

      <div className={styles.mapGrid}>
        <GlassPanel>
          <h2>Actores clave</h2>
          {data.actores_clave.length === 0 ? (
            <p className={styles.empty}>Sin actores en el radar de este territorio.</p>
          ) : (
            <div className={styles.stack}>
              {data.actores_clave.map((a) => (
                <GlassCard key={a.slug} to={`/actores/${a.slug}`}>
                  <strong>{a.nombre}</strong>
                  <p className={styles.meta}>
                    {a.rol} · movilización {a.movilizacion_fuente}: ~
                    {a.movilizacion_display}
                  </p>
                </GlassCard>
              ))}
            </div>
          )}
        </GlassPanel>
        <GlassPanel>
          <h2>Contexto e encuestas</h2>
          {data.indicadores_contexto.length === 0 ? (
            <p className={styles.empty}>
              Sin indicadores INEGI —{" "}
              <Link to="/captura/indicadores">cargar referencial</Link>
            </p>
          ) : (
            <ul className={styles.panelList}>
              {data.indicadores_contexto.map((i) => (
                <li key={i.slug}>
                  {i.nombre}: <strong>{String(i.valor)}</strong> ({i.anio})
                </li>
              ))}
            </ul>
          )}
          <p className={styles.meta} style={{ marginTop: "0.75rem" }}>
            Encuestas en recorte: {data.pulso_encuestas.total ?? 0}.{" "}
            <Link to="/captura/encuestas">Capturar percepción</Link>
          </p>
        </GlassPanel>
      </div>

      <GlassPanel>
        <IaPanel
          title="Lectura IA del panorama (Groq)"
          disclaimer="Usa hechos DEMO/públicos ya cargados. No envía intereses reservados ni PII de encuestas. Con BD privada usará el mismo botón."
          onGenerate={async () => {
            const res = await api.iaPanoramaLectura({
              zona: zona || undefined,
              colonia: colonia || undefined,
            });
            return `${res.lectura}\n\n— modelo ${res.modelo}\n${res.disclaimer}`;
          }}
        />
      </GlassPanel>
    </div>
  );
}
