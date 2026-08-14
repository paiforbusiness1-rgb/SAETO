import type { CasoSituacion } from "../../../shared/api/types";
import { fmtNum } from "../toCeldaCalor";
import styles from "../CuartoPages.module.css";

export function PasoImpacto({ caso }: { caso: CasoSituacion }) {
  const imp = caso.impacto;
  return (
    <div>
      <h2>A quién impacta</h2>
      <p className={styles.lead}>
        Cifras agregadas de las colonias del caso. Sin datos personales: población,
        densidad, viviendas y lista nominal.
      </p>
      <div className={styles.kpiRow}>
        <div className={styles.kpi}>
          <span className={styles.meta}>Población</span>
          <strong>{fmtNum(imp.poblacion_total)}</strong>
        </div>
        <div className={styles.kpi}>
          <span className={styles.meta}>Viviendas</span>
          <strong>{fmtNum(imp.viviendas_total)}</strong>
        </div>
        <div className={styles.kpi}>
          <span className={styles.meta}>Lista nominal</span>
          <strong>{fmtNum(imp.lista_nominal_total)}</strong>
        </div>
        <div className={styles.kpi}>
          <span className={styles.meta}>Densidad promedio</span>
          <strong>
            {imp.densidad_promedio != null
              ? `${fmtNum(imp.densidad_promedio)} hab/km²`
              : "—"}
          </strong>
        </div>
      </div>
      {imp.colonias.length ? (
        <div style={{ overflowX: "auto" }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Colonia</th>
                <th>Alcaldía</th>
                <th>Población</th>
                <th>Densidad</th>
                <th>Dato clave</th>
              </tr>
            </thead>
            <tbody>
              {imp.colonias.map((c) => (
                <tr key={c.colonia_nombre}>
                  <td>{c.colonia_nombre}</td>
                  <td>{c.zona_nombre}</td>
                  <td>{fmtNum(c.poblacion)}</td>
                  <td>{c.densidad != null ? fmtNum(c.densidad) : "—"}</td>
                  <td>
                    {c.metrica_valor != null
                      ? `${c.metrica_clave?.replaceAll("_", " ") || "Métrica"}: ${c.metrica_valor}`
                      : c.nota_mesa || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>Sin demografía cargada para estas colonias.</p>
      )}
      {imp.actores.length ? (
        <p className={styles.meta} style={{ marginTop: "1rem" }}>
          Liderazgos en el recorte: {imp.actores.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}
