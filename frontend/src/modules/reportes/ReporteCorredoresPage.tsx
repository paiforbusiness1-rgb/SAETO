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
  corredores: {
    nombre: string;
    score_presion: number;
    eventos: number;
    demandas: number;
  }[];
};

export function ReporteCorredoresPage() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .reporteCorredores()
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Calculando corredores…</StateBlock>
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
        <h1>Reporte · Corredores críticos</h1>
        <p className={styles.lead}>{data.lectura_gerencial}</p>
        <p className={styles.meta}>
          <Link to="/inteligencia/corredores">Ver detalle operativo</Link>
        </p>
      </GlassPanel>
      <GlassPanel>
        <HBarChart
          items={data.corredores.map((c) => ({
            label: `${c.nombre} (${c.eventos} evt / ${c.demandas} dem)`,
            value: c.score_presion,
          }))}
        />
      </GlassPanel>
    </div>
  );
}
