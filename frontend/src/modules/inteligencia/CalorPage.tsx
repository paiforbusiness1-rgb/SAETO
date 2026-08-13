import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { MapaCalorResponse } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import { MapaCalorTerritorial } from "./MapaCalorTerritorial";
import styles from "./InteligenciaPages.module.css";

export function CalorPage() {
  const navigate = useNavigate();
  const [capa, setCapa] = useState("compuesta");
  const [capas, setCapas] = useState<{ slug: string; nombre: string }[]>([]);
  const [data, setData] = useState<MapaCalorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = (nextCapa = capa) => {
    setLoading(true);
    setError(null);
    Promise.all([api.inteligenciaCalor(nextCapa), api.inteligenciaConfigCalor()])
      .then(([mapa, cfg]) => {
        setData(mapa);
        setCapas((cfg.capas?.capas || []).map((c) => ({ slug: c.slug, nombre: c.nombre })));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) {
    return (
      <GlassPanel>
        <StateBlock>Cargando mapa de calor…</StateBlock>
      </GlassPanel>
    );
  }

  if (error || !data) {
    return (
      <GlassPanel>
        <StateBlock actionLabel="Reintentar" onAction={() => load()}>
          {error ?? "Sin datos"}
        </StateBlock>
      </GlassPanel>
    );
  }

  return (
    <div className={styles.layout}>
      <GlassPanel strong>
        <BotonVolver to="/inteligencia" />
        <h1>Mapa de calor territorial</h1>
        <p className={styles.lead}>
          Mapa real Oriente (OpenStreetMap) con calor SAETO por alcaldía y
          colonias demo. El score sale de reivindicaciones, coyuntura,
          movilización y percepción. Licenciamiento GIS comercial se decide en
          arranque real; este adaptador es sustituible.
        </p>
        <div className={styles.filters}>
          <label>
            Capa
            <select
              value={capa}
              onChange={(e) => {
                const next = e.target.value;
                setCapa(next);
                load(next);
              }}
            >
              {capas.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.actions}>
            <button type="button" onClick={() => load()}>
              Recalcular
            </button>
          </div>
        </div>
        <div className={styles.leyenda}>
          {data.bandas.map((b) => (
            <span key={b.slug} className={styles.leyendaItem}>
              <span className={styles.swatch} style={{ background: b.color }} />
              {b.nombre}
            </span>
          ))}
        </div>
      </GlassPanel>

      <div className={styles.mapGrid}>
        <GlassPanel>
          <MapaCalorTerritorial
            celdas={data.celdas}
            porZona={data.por_zona}
            onSelectColonia={(slug) =>
              navigate(`/inteligencia/panorama?colonia=${slug}`)
            }
            onSelectZona={(slug) => navigate(`/inteligencia/panorama?zona=${slug}`)}
          />
        </GlassPanel>
        <GlassPanel>
          <div className={styles.sectionHead}>
            <h2>Top calientes · {data.capa_nombre}</h2>
          </div>
          <div className={styles.stack}>
            {data.top.map((c) => (
              <GlassCard
                key={c.colonia_slug || c.zona_slug}
                to={`/inteligencia/panorama?colonia=${c.colonia_slug}`}
              >
                <div className={styles.row}>
                  <div>
                    <strong>{c.colonia_nombre}</strong>
                    <p className={styles.meta}>{c.zona_nombre}</p>
                    <span className={styles.badgeBanda}>{c.banda_nombre}</span>
                  </div>
                  <span className={styles.score}>{c.score}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
