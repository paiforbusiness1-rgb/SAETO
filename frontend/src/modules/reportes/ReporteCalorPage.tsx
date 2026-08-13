import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import { HBarChart } from "./charts";
import styles from "./reportes.module.css";

type Data = {
  lectura_gerencial: string;
  capa_nombre: string;
  top: { colonia_nombre: string; score: number; banda_nombre: string }[];
};

export function ReporteCalorPage() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .reporteCalor()
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Calculando reporte de calor…</StateBlock>
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
        <h1>Reporte · Mapa de calor</h1>
        <p className={styles.lead}>{data.lectura_gerencial}</p>
        <p className={styles.meta}>
          Capa: {data.capa_nombre}.{" "}
          <Link to="/inteligencia/calor">Abrir mapa interactivo</Link>
        </p>
      </GlassPanel>
      <GlassPanel>
        <HBarChart
          items={data.top.map((t) => ({
            label: `${t.colonia_nombre} (${t.banda_nombre})`,
            value: t.score,
          }))}
        />
      </GlassPanel>
    </div>
  );
}
