import { Link } from "react-router-dom";
import type { CasoSituacion } from "../../../shared/api/types";
import { DescargarDiagnostico } from "../DescargarDiagnostico";
import styles from "../CuartoPages.module.css";

export function PasoDecision({ caso }: { caso: CasoSituacion }) {
  return (
    <div>
      <h2>Decisión de mesa</h2>
      <p className={styles.lead}>
        Cobertura analítica: dónde sentarse, qué verificar, qué no dispersar.
        No es patrullaje.
      </p>
      {caso.recomendaciones.length ? (
        <div className={styles.stack}>
          {caso.recomendaciones.map((r) => (
            <p key={r} className={styles.recomendacion}>
              {r}
            </p>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          Aún no hay recomendaciones cargadas para este tema. El recorrido igual
          cierra: puede volver al cuarto o abrir otro caso.
        </p>
      )}
      <div className={styles.navRow} style={{ marginTop: "1.25rem" }}>
        <DescargarDiagnostico slug={caso.slug} nombre={caso.nombre} />
      </div>
      <p className={styles.meta} style={{ marginTop: "1.25rem" }}>
        <Link to="/cuarto">Elegir otro caso</Link>
        {" · "}
        <Link to="/inteligencia/cobertura">Cobertura de mesa</Link>
        {" · "}
        <Link to="/">Volver al brief</Link>
      </p>
    </div>
  );
}
