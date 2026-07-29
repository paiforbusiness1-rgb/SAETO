import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import { HBarChart } from "./charts";
import styles from "./reportes.module.css";

type Terr = {
  lectura_gerencial: string;
  por_zona: {
    zona_nombre: string;
    score: number;
    count: number;
    rojos: number;
  }[];
  por_colonia: {
    territorio_nombre: string;
    zona_nombre: string;
    score: number;
    max_intensidad: number;
  }[];
};

export function ReporteTerritorioPage() {
  const [data, setData] = useState<Terr | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .reporteTerritorio()
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Calculando calor territorial…</StateBlock>
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
        <h1>Calor territorial</h1>
        <p className={styles.lead}>
          Dónde concentrar recorrido político y atención operativa.
        </p>
        <p className={styles.lectura}>{data.lectura_gerencial}</p>
      </GlassPanel>

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Presión por zona</h2>
        <HBarChart
          items={data.por_zona.map((z) => ({
            label: z.zona_nombre,
            value: z.score,
            hint: `${z.count} demandas · ${z.rojos} rojos`,
            tone: z.rojos > 0 ? "rojo" : "accent",
          }))}
        />
      </GlassPanel>

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Colonias con mayor score</h2>
        <HBarChart
          items={data.por_colonia.map((c) => ({
            label: c.territorio_nombre,
            value: c.score,
            hint: `${c.zona_nombre} · intensidad máx ${c.max_intensidad}`,
            tone:
              c.max_intensidad >= 4
                ? "rojo"
                : c.max_intensidad === 3
                  ? "amarillo"
                  : "verde",
          }))}
        />
      </GlassPanel>
    </div>
  );
}
