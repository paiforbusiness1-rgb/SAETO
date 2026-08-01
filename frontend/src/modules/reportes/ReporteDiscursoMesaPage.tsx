import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import { HBarChart, KpiTile } from "./charts";
import styles from "./reportes.module.css";

type DiscursoMesaRep = {
  lectura_gerencial: string;
  kpis: { piezas: number };
  emociones: { clave: string; valor: number }[];
  piezas: {
    slug: string;
    actor_nombre: string;
    topico_principal: string;
    narrativas: string;
    ideologia: string;
    emociones: string[];
  }[];
};

export function ReporteDiscursoMesaPage() {
  const [data, setData] = useState<DiscursoMesaRep | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .reporteDiscursoMesa()
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Armando reporte de discurso…</StateBlock>
      </GlassPanel>
    );
  }

  if (err || !data) {
    return (
      <GlassPanel>
        <BotonVolver to="/reportes" label="Volver a reportes" />
        <StateBlock>{err || "Sin datos"}</StateBlock>
      </GlassPanel>
    );
  }

  return (
    <div className={styles.stack}>
      <GlassPanel strong>
        <BotonVolver to="/reportes" label="Volver a reportes" />
        <h1>Discurso en rúbricas de mesa</h1>
        <p className={styles.lead}>Narrativas, emociones e ideología agregadas.</p>
        <div className={styles.kpiGrid}>
          <KpiTile label="Piezas analizadas" value={data.kpis.piezas} />
        </div>
        <p className={styles.lectura}>{data.lectura_gerencial}</p>
      </GlassPanel>

      {data.emociones.length > 0 ? (
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Emociones manifestadas</h2>
          <HBarChart
            items={data.emociones.map((e) => ({
              label: e.clave,
              value: e.valor,
              tone: "accent",
            }))}
          />
        </GlassPanel>
      ) : null}

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Piezas registradas</h2>
        <div className={styles.list}>
          {data.piezas.map((p) => (
            <GlassCard key={p.slug} to={`/discurso/${p.slug}`}>
              <strong>{p.topico_principal}</strong>
              <p className={styles.meta}>{p.actor_nombre}</p>
              {p.narrativas ? <p className={styles.meta}>{p.narrativas}</p> : null}
              {p.emociones.length > 0 ? (
                <p className={styles.meta}>Emociones: {p.emociones.join(", ")}</p>
              ) : null}
            </GlassCard>
          ))}
        </div>
        <p className={styles.meta} style={{ marginTop: "1rem" }}>
          <Link to="/captura/discurso">Capturar discurso →</Link>
        </p>
      </GlassPanel>
    </div>
  );
}
