import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { SemaforoPill } from "../../shared/ui/SemaforoPill";
import { StateBlock } from "../../shared/ui/StateBlock";
import { DonutChart, HBarChart, KpiTile } from "./charts";
import styles from "./reportes.module.css";

type DeudasRep = {
  lectura_gerencial: string;
  kpis: { con_deuda: number; sin_deuda: number; pct_deuda: number };
  comparativo: { clave: string; etiqueta: string; valor: number }[];
  ranking: {
    slug: string;
    tema_nombre: string;
    territorio_nombre: string;
    intensidad: number;
    semaforo: "verde" | "amarillo" | "rojo";
    semaforo_etiqueta: string;
    resumen_deuda: string;
    peso_opinion: number;
  }[];
};

export function ReporteDeudasPage() {
  const [data, setData] = useState<DeudasRep | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .reporteDeudas()
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Revisando cuentas pendientes…</StateBlock>
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
        <h1>Cuentas pendientes</h1>
        <p className={styles.lead}>
          Deudas históricas que pesan en la relación con el territorio.
        </p>
        <div className={styles.kpiGrid}>
          <KpiTile label="Con deuda" value={data.kpis.con_deuda} tone="rojo" />
          <KpiTile label="Sin deuda marcada" value={data.kpis.sin_deuda} tone="verde" />
          <KpiTile label="% con deuda" value={`${data.kpis.pct_deuda}%`} />
        </div>
        <p className={styles.lectura}>{data.lectura_gerencial}</p>
      </GlassPanel>

      <div className={styles.grid2}>
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Composición</h2>
          <DonutChart slices={data.comparativo} />
        </GlassPanel>
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Ranking por intensidad</h2>
          <HBarChart
            items={data.ranking.map((r) => ({
              label: r.tema_nombre,
              value: r.intensidad,
              hint: r.territorio_nombre,
              tone: r.semaforo,
            }))}
            max={5}
          />
        </GlassPanel>
      </div>

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Detalle para cierre de cuentas</h2>
        <div className={styles.list}>
          {data.ranking.map((r) => (
            <GlassCard key={r.slug} to={`/observatorio/${r.slug}`}>
              <div className={styles.row}>
                <div>
                  <strong>
                    {r.tema_nombre} · {r.territorio_nombre}
                  </strong>
                  <p className={styles.meta}>{r.resumen_deuda}</p>
                </div>
                <SemaforoPill value={r.semaforo} label={r.semaforo_etiqueta} />
              </div>
            </GlassCard>
          ))}
        </div>
        <p className={styles.meta} style={{ marginTop: "1rem" }}>
          <Link to="/captura/reivindicaciones">Marcar / editar deudas →</Link>
        </p>
      </GlassPanel>
    </div>
  );
}
