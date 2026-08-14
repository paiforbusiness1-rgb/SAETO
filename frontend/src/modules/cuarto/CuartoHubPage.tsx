import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { CasoIndice } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import { DescargarDiagnostico } from "./DescargarDiagnostico";
import styles from "./CuartoPages.module.css";

export function CuartoHubPage() {
  const [casos, setCasos] = useState<CasoIndice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .cuartoCasos()
      .then(setCasos)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <GlassPanel>
        <BotonVolver to="/" />
        <StateBlock actionLabel="Reintentar" onAction={() => window.location.reload()}>
          {error}
        </StateBlock>
      </GlassPanel>
    );
  }

  if (!casos) {
    return (
      <GlassPanel>
        <StateBlock>Abriendo el cuarto de situación…</StateBlock>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel strong>
      <BotonVolver to="/" />
      <p className={styles.kicker}>Un problema → una decisión</p>
      <h1>Cuarto de situación</h1>
      <p className={styles.lead}>
        Elija un caso y recórralo paso a paso: mapa, gente impactada, lo que se
        decidió y recomendaciones de mesa. Empiece por agua en Oriente.
      </p>
      <div className={styles.hub}>
        {casos.map((c) => (
          <div key={c.slug} className={styles.casoCard}>
            <GlassCard to={`/cuarto/${c.slug}`}>
              <span className={styles.kicker}>{c.tema_nombre}</span>
              <strong>{c.nombre}</strong>
              <p className={styles.meta}>{c.subtitulo || c.resumen}</p>
            </GlassCard>
            <DescargarDiagnostico slug={c.slug} nombre={c.nombre} />
          </div>
        ))}
      </div>
      <p className={styles.meta} style={{ marginTop: "1rem" }}>
        <Link to="/consumibles">Láminas de calor</Link>
        {" · "}
        <Link to="/inteligencia">Inteligencia</Link>
      </p>
    </GlassPanel>
  );
}
