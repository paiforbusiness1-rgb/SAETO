import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { SemaforoPill } from "../../shared/ui/SemaforoPill";
import { StateBlock } from "../../shared/ui/StateBlock";
import { HBarChart, KpiTile } from "./charts";
import styles from "./reportes.module.css";

type CicloVitalRep = {
  lectura_gerencial: string;
  kpis: { total: number; escalando: number; desescalando: number; estable: number };
  por_fase: { fase_nombre: string; count: number; escalando: number }[];
  por_sentido: { clave: string; etiqueta: string; valor: number }[];
  top: {
    slug: string;
    tema_nombre: string;
    territorio_nombre: string;
    fase_ciclo_nombre: string;
    sentido_ciclo: string;
    grado_escalamiento: number;
    semaforo: "verde" | "amarillo" | "rojo";
  }[];
};

export function ReporteCicloVitalPage() {
  const [data, setData] = useState<CicloVitalRep | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .reporteCicloVital()
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Armando reporte de ciclo vital…</StateBlock>
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
        <h1>Ciclo vital de demandas</h1>
        <p className={styles.lead}>Fases, sentido y focos que escalan.</p>
        <div className={styles.kpiGrid}>
          <KpiTile label="Total demandas" value={data.kpis.total} />
          <KpiTile label="Escalando" value={data.kpis.escalando} tone="rojo" />
          <KpiTile label="Estables" value={data.kpis.estable} tone="amarillo" />
          <KpiTile label="Desescalando" value={data.kpis.desescalando} tone="verde" />
        </div>
        <p className={styles.lectura}>{data.lectura_gerencial}</p>
      </GlassPanel>

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Por fase del ciclo</h2>
        <HBarChart
          items={data.por_fase.map((f) => ({
            label: f.fase_nombre,
            value: f.count,
            hint: `${f.escalando} escalando`,
            tone: "accent",
          }))}
        />
      </GlassPanel>

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Focos prioritarios</h2>
        <div className={styles.list}>
          {data.top.map((r) => (
            <GlassCard key={r.slug} to={`/observatorio/${r.slug}`}>
              <div className={styles.row}>
                <div>
                  <strong>{r.tema_nombre}</strong>
                  <p className={styles.meta}>
                    {r.territorio_nombre} · {r.fase_ciclo_nombre} · grado{" "}
                    {r.grado_escalamiento}/5
                  </p>
                </div>
                <SemaforoPill value={r.semaforo} label={r.sentido_ciclo} />
              </div>
            </GlassCard>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
