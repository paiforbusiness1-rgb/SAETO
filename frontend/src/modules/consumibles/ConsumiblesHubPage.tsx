import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { ConsumiblesIndice } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./ConsumiblesPages.module.css";

export function ConsumiblesHubPage() {
  const [data, setData] = useState<ConsumiblesIndice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .consumiblesIndice()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <StateBlock>{error}</StateBlock>;
  if (!data) return <StateBlock>Cargando consumibles…</StateBlock>;

  return (
    <GlassPanel strong>
      <BotonVolver to="/inteligencia" />
      <h1>Consumibles</h1>
      <p className={styles.lead}>
        Láminas para mesa: mapa, gráfica y lectura. Agua, basura, alumbrado,
        seguridad y cruce electoral territorial.
      </p>
      {data.disclaimer ? <p className={styles.disclaimer}>{data.disclaimer}</p> : null}
      <div className={styles.hub}>
        {data.laminas.map((l) => (
          <GlassCard key={l.slug} to={`/consumibles/${l.slug}`}>
            <strong>{l.nombre}</strong>
            <p className={styles.meta}>{l.subtitulo}</p>
          </GlassCard>
        ))}
      </div>
      <p className={styles.meta} style={{ marginTop: "1rem" }}>
        <Link to="/cuarto">Cuarto de situación</Link>
        {" · "}
        <Link to="/reportes">También en Reportes</Link>
        {" · "}
        <Link to="/inteligencia">Volver a Inteligencia</Link>
      </p>
    </GlassPanel>
  );
}
