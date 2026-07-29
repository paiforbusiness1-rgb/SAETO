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

type Ejecutivo = {
  lectura_gerencial: string;
  kpis: {
    reivindicaciones: number;
    actores: number;
    capacidad_movilizacion_total: number;
    rojos: number;
    amarillos: number;
    verdes: number;
    deudas_historicas: number;
    score_presion: number;
  };
  semaforo: { clave: string; etiqueta: string; valor: number }[];
  por_tema: {
    tema_nombre: string;
    score: number;
    count: number;
    max_intensidad: number;
  }[];
  top_reivindicaciones: {
    slug: string;
    tema_nombre: string;
    territorio_nombre: string;
    intensidad: number;
    semaforo: "verde" | "amarillo" | "rojo";
    semaforo_etiqueta: string;
    deuda_historica: boolean;
  }[];
};

export function ReporteEjecutivoPage() {
  const [data, setData] = useState<Ejecutivo | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .reporteEjecutivo()
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Preparando tablero ejecutivo…</StateBlock>
      </GlassPanel>
    );
  }

  if (err || !data) {
    return (
      <GlassPanel>
        <BotonVolver to="/reportes" label="Volver a reportes" />
        <StateBlock actionLabel="Reintentar" onAction={load}>
          {err || "Sin datos"}
        </StateBlock>
      </GlassPanel>
    );
  }

  const { kpis } = data;

  return (
    <div className={styles.stack}>
      <GlassPanel strong>
        <BotonVolver to="/reportes" label="Volver a reportes" />
        <h1>Tablero ejecutivo</h1>
        <p className={styles.lead}>
          Panorama de presión territorial para priorizar intervención.
        </p>
        <div className={styles.kpiGrid}>
          <KpiTile label="Focos rojos" value={kpis.rojos} tone="rojo" />
          <KpiTile label="En atención" value={kpis.amarillos} tone="amarillo" />
          <KpiTile label="En contención" value={kpis.verdes} tone="verde" />
          <KpiTile label="Score de presión" value={kpis.score_presion} />
          <KpiTile label="Actores" value={kpis.actores} />
          <KpiTile
            label="Movilización total"
            value={kpis.capacidad_movilizacion_total}
          />
          <KpiTile label="Deudas históricas" value={kpis.deudas_historicas} />
          <KpiTile label="Reivindicaciones" value={kpis.reivindicaciones} />
        </div>
        <p className={styles.lectura}>{data.lectura_gerencial}</p>
      </GlassPanel>

      <div className={styles.grid2}>
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Semáforo global</h2>
          <DonutChart slices={data.semaforo} />
        </GlassPanel>
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Presión por tema</h2>
          <HBarChart
            items={data.por_tema.map((t) => ({
              label: t.tema_nombre,
              value: t.score,
              hint: `${t.count} registro(s) · máx intensidad ${t.max_intensidad}`,
              tone:
                t.max_intensidad >= 4
                  ? "rojo"
                  : t.max_intensidad === 3
                    ? "amarillo"
                    : "verde",
            }))}
          />
        </GlassPanel>
      </div>

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Top focos para la mesa</h2>
        <div className={styles.list}>
          {data.top_reivindicaciones.map((r) => (
            <GlassCard key={r.slug} to={`/observatorio/${r.slug}`}>
              <div className={styles.row}>
                <div>
                  <strong>{r.tema_nombre}</strong>
                  <p className={styles.meta}>
                    {r.territorio_nombre}
                    {r.deuda_historica ? " · Deuda histórica" : ""}
                  </p>
                </div>
                <SemaforoPill value={r.semaforo} label={r.semaforo_etiqueta} />
              </div>
            </GlassCard>
          ))}
        </div>
        <p className={styles.meta} style={{ marginTop: "1rem" }}>
          <Link to="/captura">Actualizar datos en Captura →</Link>
        </p>
      </GlassPanel>
    </div>
  );
}
