import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import { KpiTile } from "./charts";
import styles from "./reportes.module.css";

type FilaCruce = {
  territorio_nombre: string;
  demanda: string;
  demanda_slug: string;
  peso_opinion: number;
  intensidad: number;
  indicador: string;
  valor_indicador: number | string;
  anio: number;
  respuestas_encuesta?: number;
  lectura: string;
};

type ContextoInegiRep = {
  disclaimer: string;
  lectura_gerencial: string;
  kpis: {
    indicadores: number;
    territorios: number;
    brechas: number;
    tripletes?: number;
    encuestas?: number;
  };
  por_territorio: {
    territorio: string;
    territorio_nombre: string;
    indicadores: {
      clave: string;
      nombre: string;
      valor: number | string;
      anio: number;
      fuente: string;
    }[];
  }[];
  brechas: FilaCruce[];
  cruces_triplete?: FilaCruce[];
};

export function ReporteContextoInegiPage() {
  const [data, setData] = useState<ContextoInegiRep | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .reporteContextoInegi()
      .then(setData)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Armando contexto INEGI…</StateBlock>
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
        <h1>Contexto estadístico INEGI</h1>
        <p className={styles.disclaimer}>{data.disclaimer}</p>
        <div className={styles.kpiGrid}>
          <KpiTile label="Indicadores" value={data.kpis.indicadores} />
          <KpiTile label="Territorios" value={data.kpis.territorios} />
          <KpiTile label="Tripletes" value={data.kpis.tripletes ?? 0} />
          <KpiTile label="Encuestas" value={data.kpis.encuestas ?? 0} />
        </div>
        <p className={styles.lectura}>{data.lectura_gerencial}</p>
        <p className={styles.meta}>
          <Link to="/captura/indicadores">Capturar indicadores →</Link>
          {" · "}
          <Link to="/captura/encuestas">Capturar encuestas →</Link>
          {" · "}
          <Link to="/reportes/encuestas">Reporte encuestas →</Link>
        </p>
      </GlassPanel>

      {data.cruces_triplete?.length ? (
        <GlassPanel>
          <h2 className={styles.sectionTitle}>
            Triplete de mesa: demanda + INEGI + encuesta
          </h2>
          <p className={styles.meta}>
            Misma colonia con los tres insumos. Lectura orientativa — no crea demandas
            solas ni es índice oficial.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Colonia</th>
                  <th>Demanda</th>
                  <th>Peso / int.</th>
                  <th>Indicador INEGI</th>
                  <th>Encuestas</th>
                  <th>Lectura</th>
                </tr>
              </thead>
              <tbody>
                {data.cruces_triplete.map((b) => (
                  <tr key={`t-${b.demanda_slug}-${b.indicador}`}>
                    <td>{b.territorio_nombre}</td>
                    <td>
                      <Link to={`/observatorio/${b.demanda_slug}`}>{b.demanda}</Link>
                    </td>
                    <td>
                      {b.peso_opinion} / {b.intensidad}
                    </td>
                    <td>
                      {b.indicador}: {b.valor_indicador} ({b.anio})
                    </td>
                    <td>{b.respuestas_encuesta ?? 0}</td>
                    <td>{b.lectura}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      ) : null}

      {data.brechas?.length ? (
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Brecha percepción vs contexto</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Territorio</th>
                  <th>Demanda (percepción)</th>
                  <th>Peso / int.</th>
                  <th>Indicador</th>
                  <th>Encuestas</th>
                  <th>Lectura de mesa</th>
                </tr>
              </thead>
              <tbody>
                {data.brechas.map((b) => (
                  <tr key={`${b.demanda_slug}-${b.indicador}`}>
                    <td>{b.territorio_nombre}</td>
                    <td>
                      <Link to={`/observatorio/${b.demanda_slug}`}>{b.demanda}</Link>
                    </td>
                    <td>
                      {b.peso_opinion} / {b.intensidad}
                    </td>
                    <td>
                      {b.indicador}: {b.valor_indicador} ({b.anio})
                    </td>
                    <td>{b.respuestas_encuesta ?? 0}</td>
                    <td>{b.lectura}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      ) : null}

      {data.por_territorio.map((t) => (
        <GlassPanel key={t.territorio}>
          <h2 className={styles.sectionTitle}>{t.territorio_nombre}</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Valor</th>
                  <th>Año</th>
                  <th>Fuente</th>
                </tr>
              </thead>
              <tbody>
                {t.indicadores.map((ind) => (
                  <tr key={ind.clave}>
                    <td>{ind.nombre}</td>
                    <td>{ind.valor}</td>
                    <td>{ind.anio}</td>
                    <td>{ind.fuente}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}
