import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import { HBarChart, KpiTile } from "./charts";
import styles from "./reportes.module.css";

type ActoresRep = {
  capacidad_total: number;
  lectura_gerencial: string;
  kpis: { actores: number; con_comprobada: number; solo_estimada: number };
  ranking: {
    slug: string;
    nombre: string;
    organizacion: string;
    colonia_nombre: string;
    capacidad_movilizacion: number;
    capacidad_estimada: number;
    capacidad_comprobada: number | null;
    movilizacion_display: number;
    movilizacion_fuente: string;
    share: number;
    estado_verificacion: string;
  }[];
};

export function ReporteActoresPage() {
  const [data, setData] = useState<ActoresRep | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .reporteActores()
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Armando mapa de poder…</StateBlock>
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
        <h1>Mapa de poder</h1>
        <p className={styles.lead}>
          Capacidad de movilización — comprobada cuando existe; si no, estimada.
        </p>
        <div className={styles.kpiGrid}>
          <KpiTile label="Capacidad total (ranking)" value={data.capacidad_total} />
          <KpiTile label="Actores mapeados" value={data.kpis.actores} />
          <KpiTile label="Con comprobada" value={data.kpis.con_comprobada} tone="verde" />
          <KpiTile label="Solo estimada" value={data.kpis.solo_estimada} tone="amarillo" />
        </div>
        <p className={styles.lectura}>{data.lectura_gerencial}</p>
      </GlassPanel>

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Ranking de movilización</h2>
        <HBarChart
          items={data.ranking.map((a) => ({
            label: a.nombre,
            value: a.movilizacion_display,
            hint: `${a.share}% · ${a.movilizacion_fuente}${a.capacidad_comprobada != null ? ` (est. ${a.capacidad_estimada})` : " (no verificada)"}`,
            tone: a.movilizacion_fuente === "comprobada" ? "verde" : "amarillo",
          }))}
        />
      </GlassPanel>

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Fichas rápidas</h2>
        <div className={styles.list}>
          {data.ranking.map((a) => (
            <GlassCard key={a.slug} to={`/actores/${a.slug}`}>
              <div className={styles.row}>
                <div>
                  <strong>{a.nombre}</strong>
                  <p className={styles.meta}>
                    {a.organizacion} · {a.estado_verificacion.replaceAll("_", " ")}
                  </p>
                  <p className={styles.meta}>
                    Estimada ~{a.capacidad_estimada}
                    {a.capacidad_comprobada != null
                      ? ` · Comprobada ${a.capacidad_comprobada}`
                      : " · sin comprobación"}
                  </p>
                </div>
                <span className={styles.meta}>
                  ~{a.movilizacion_display} ({a.movilizacion_fuente})
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
        <p className={styles.meta} style={{ marginTop: "1rem" }}>
          <Link to="/captura/actores">Editar actores →</Link>
        </p>
      </GlassPanel>
    </div>
  );
}
