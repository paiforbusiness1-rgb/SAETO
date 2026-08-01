import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import { HBarChart, KpiTile } from "./charts";
import styles from "./reportes.module.css";

type EncuestasRep = {
  disclaimer: string;
  lectura_gerencial: string;
  kpis: {
    respuestas: number;
    colonias: number;
    problemas_distintos: number;
    plantillas?: number;
  };
  por_plantilla?: { clave: string; etiqueta: string; valor: number }[];
  por_colonia: { colonia_nombre: string; zona_nombre: string; count: number }[];
  por_problema: { clave: string; etiqueta: string; valor: number }[];
  por_sexo: { etiqueta: string; valor: number }[];
  por_edad: { etiqueta: string; valor: number }[];
};

export function ReporteEncuestasPage() {
  const [data, setData] = useState<EncuestasRep | null>(null);
  const [plantillas, setPlantillas] = useState<{ slug: string; nombre: string }[]>([]);
  const [filtro, setFiltro] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = (plantilla?: string) => {
    setLoading(true);
    Promise.all([
      api.reporteEncuestas({ plantilla: plantilla || undefined }),
      api.encuestaPlantillas(),
    ])
      .then(([rep, plants]) => {
        setData(rep);
        setPlantillas(plants);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(filtro || undefined);
  }, [filtro]);

  if (loading && !data) {
    return (
      <GlassPanel>
        <StateBlock>Armando reporte de encuestas…</StateBlock>
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
        <h1>Encuestas · percepción territorial</h1>
        <p className={styles.disclaimer}>{data.disclaimer}</p>
        <label className={styles.meta} htmlFor="rep-plantilla">
          Filtrar plantilla
        </label>
        <select
          id="rep-plantilla"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="">Todas</option>
          {plantillas.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.nombre}
            </option>
          ))}
        </select>
        <div className={styles.kpiGrid}>
          <KpiTile label="Respuestas" value={data.kpis.respuestas} />
          <KpiTile label="Colonias" value={data.kpis.colonias} />
          <KpiTile label="Prioridades citadas" value={data.kpis.problemas_distintos} />
        </div>
        <p className={styles.lectura}>{data.lectura_gerencial}</p>
        <p className={styles.meta}>
          <Link to="/captura/encuestas">Capturar más respuestas →</Link>
        </p>
      </GlassPanel>

      {data.por_plantilla?.length ? (
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Por plantilla</h2>
          <HBarChart
            items={data.por_plantilla.map((p) => ({
              label: p.etiqueta,
              value: p.valor,
            }))}
          />
        </GlassPanel>
      ) : null}

      <div className={styles.grid2}>
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Prioridades / problemas</h2>
          <HBarChart
            items={data.por_problema.map((p) => ({
              label: p.etiqueta,
              value: p.valor,
            }))}
          />
        </GlassPanel>
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Por colonia</h2>
          <HBarChart
            items={data.por_colonia.map((c) => ({
              label: c.colonia_nombre,
              hint: c.zona_nombre,
              value: c.count,
            }))}
          />
        </GlassPanel>
      </div>

      <div className={styles.grid2}>
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Por sexo</h2>
          <HBarChart
            items={data.por_sexo.map((s) => ({
              label: s.etiqueta,
              value: s.valor,
            }))}
          />
        </GlassPanel>
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Por edad</h2>
          <HBarChart
            items={data.por_edad.map((s) => ({
              label: s.etiqueta,
              value: s.valor,
            }))}
          />
        </GlassPanel>
      </div>
    </div>
  );
}
