import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { CorredorRanking } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./InteligenciaPages.module.css";

export function CorredoresPage() {
  const [items, setItems] = useState<CorredorRanking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .inteligenciaCorredores()
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
        <StateBlock>Cargando corredores…</StateBlock>
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
        <h1>Corredores críticos</h1>
        <p className={styles.lead}>
          Ejes territoriales donde se concentran eventos y demandas. Vincule
          corredor al registrar coyuntura.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={load}>
            Recalcular
          </button>
          <Link className={styles.panelLink} to="/captura/coyuntura">
            Registrar evento
          </Link>
        </div>
      </GlassPanel>
      <div className={styles.stack}>
        {items.map((c) => (
          <GlassPanel key={c.slug}>
            <div className={styles.row}>
              <div>
                <h2 style={{ margin: 0 }}>{c.nombre}</h2>
                <p className={styles.meta}>
                  {c.tipo.replaceAll("_", " ")} · alcaldías:{" "}
                  {c.alcaldias.join(", ")}
                </p>
                <ul className={styles.panelList}>
                  {c.tramos.map((t) => (
                    <li key={t.slug}>
                      {t.nombre} ({(t.colonias || []).join(", ")})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className={styles.score}>{c.score_presion}</div>
                <p className={styles.meta}>
                  {c.eventos} eventos · {c.demandas} demandas
                </p>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}
