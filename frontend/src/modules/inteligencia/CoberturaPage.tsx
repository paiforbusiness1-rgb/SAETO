import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { SectorCobertura } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./InteligenciaPages.module.css";

export function CoberturaPage() {
  const [items, setItems] = useState<SectorCobertura[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .inteligenciaCobertura()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Calculando cobertura de mesa…</StateBlock>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel>
        <StateBlock actionLabel="Reintentar" onAction={load}>
          {error}
        </StateBlock>
      </GlassPanel>
    );
  }

  return (
    <div className={styles.layout}>
      <GlassPanel strong>
        <BotonVolver to="/inteligencia" />
        <h1>Cobertura de mesa</h1>
        <p className={styles.lead}>
          Priorización analítica por calor territorial. No es despacho policial:
          indica dónde poner verificación de campo y seguimiento.
        </p>
        <button type="button" onClick={load}>
          Recalcular
        </button>
      </GlassPanel>
      <div className={styles.stack}>
        {items.map((s) => (
          <GlassCard
            key={s.sector_slug}
            to={`/inteligencia/panorama?colonia=${s.sector_slug}`}
          >
            <div className={styles.row}>
              <div>
                <strong>
                  P{s.prioridad} · {s.sector_nombre}
                </strong>
                <p className={styles.meta}>
                  {s.zona_nombre} · {s.recomendacion_nombre}
                </p>
                <p className={styles.meta}>{s.motivo}</p>
                {s.actores_a_revisar.length > 0 ? (
                  <p className={styles.meta}>
                    Actores: {s.actores_a_revisar.join(", ")}
                  </p>
                ) : null}
              </div>
              <span className={styles.score}>{s.score}</span>
            </div>
          </GlassCard>
        ))}
      </div>
      <p className={styles.meta}>
        <Link to="/inteligencia/calor">Ver mapa de calor</Link>
      </p>
    </div>
  );
}
