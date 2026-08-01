import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import { HBarChart, KpiTile } from "./charts";
import styles from "./reportes.module.css";

type CoyunturaRep = {
  lectura_gerencial: string;
  kpis: { eventos: number };
  por_tipo: { tipo_nombre: string; count: number }[];
  timeline: {
    slug: string;
    fecha: string;
    tipo_accion_nombre: string;
    actor_nombre: string | null;
    demanda_nombre: string | null;
    respuesta_gobierno: string;
    reaccion: string;
  }[];
};

export function ReporteCoyunturaPage() {
  const [data, setData] = useState<CoyunturaRep | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .reporteCoyuntura()
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Armando reporte de coyuntura…</StateBlock>
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
        <h1>Bitácora CÓMO — coyuntura</h1>
        <p className={styles.lead}>Acciones, respuestas y reacciones en el tiempo.</p>
        <div className={styles.kpiGrid}>
          <KpiTile label="Eventos registrados" value={data.kpis.eventos} />
        </div>
        <p className={styles.lectura}>{data.lectura_gerencial}</p>
      </GlassPanel>

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Por tipo de acción</h2>
        <HBarChart
          items={data.por_tipo.map((t) => ({
            label: t.tipo_nombre,
            value: t.count,
            tone: "accent",
          }))}
        />
      </GlassPanel>

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Línea de tiempo reciente</h2>
        <div className={styles.list}>
          {data.timeline.map((e) => (
            <GlassCard key={e.slug} to={`/coyuntura/${e.slug}`}>
              <time className={styles.meta}>{e.fecha}</time>
              <strong>{e.tipo_accion_nombre}</strong>
              <p className={styles.meta}>
                {e.actor_nombre ?? ""}
                {e.demanda_nombre ? ` · ${e.demanda_nombre}` : ""}
              </p>
            </GlassCard>
          ))}
        </div>
        <p className={styles.meta} style={{ marginTop: "1rem" }}>
          <Link to="/captura/coyuntura">Capturar eventos →</Link>
        </p>
      </GlassPanel>
    </div>
  );
}
