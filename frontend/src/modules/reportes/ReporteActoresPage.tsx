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
  ranking: {
    slug: string;
    nombre: string;
    organizacion: string;
    colonia_nombre: string;
    capacidad_movilizacion: number;
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
          Capacidad de movilización relativa entre liderazgos.
        </p>
        <div className={styles.kpiGrid}>
          <KpiTile label="Capacidad total" value={data.capacidad_total} />
          <KpiTile label="Actores mapeados" value={data.ranking.length} />
        </div>
        <p className={styles.lectura}>{data.lectura_gerencial}</p>
      </GlassPanel>

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Ranking de movilización</h2>
        <HBarChart
          items={data.ranking.map((a) => ({
            label: a.nombre,
            value: a.capacidad_movilizacion,
            hint: `${a.share}% del total · ${a.colonia_nombre}`,
            tone: "accent",
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
                </div>
                <span className={styles.meta}>~{a.capacidad_movilizacion}</span>
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
