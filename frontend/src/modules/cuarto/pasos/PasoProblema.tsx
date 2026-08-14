import { Link } from "react-router-dom";
import type { CasoSituacion } from "../../../shared/api/types";
import { CicloBadge } from "../../../shared/ui/CicloBadge";
import { SemaforoPill } from "../../../shared/ui/SemaforoPill";
import styles from "../CuartoPages.module.css";

export function PasoProblema({ caso }: { caso: CasoSituacion }) {
  const d = caso.demanda;
  return (
    <div>
      <p className={styles.kicker}>{caso.tema_nombre}</p>
      <h2>El problema</h2>
      <p className={styles.lead}>{caso.resumen}</p>
      {d ? (
        <>
          <div className={styles.kpiRow}>
            <div className={styles.kpi}>
              <span className={styles.meta}>Reivindicación ancla</span>
              <strong>{d.titulo}</strong>
              <small>
                {d.zona_nombre}
              </small>
            </div>
            <div className={styles.kpi}>
              <span className={styles.meta}>Semáforo</span>
              <strong>
                <SemaforoPill value={d.semaforo} label={d.semaforo_etiqueta} />
              </strong>
              <small>Intensidad {d.intensidad} de 5</small>
            </div>
            <div className={styles.kpi}>
              <span className={styles.meta}>Ciclo</span>
              <strong>
                <CicloBadge
                  faseNombre={d.fase_ciclo_nombre}
                  sentido={d.sentido_ciclo}
                  compact
                />
              </strong>
              {d.deuda_historica ? <small>Cuenta pendiente</small> : null}
            </div>
          </div>
          {d.resumen_deuda ? (
            <p className={styles.lectura}>{d.resumen_deuda}</p>
          ) : null}
          <p className={styles.meta} style={{ marginTop: "1rem" }}>
            <Link to={`/observatorio/${d.slug}`}>Ver ficha en reivindicaciones</Link>
          </p>
        </>
      ) : (
        <p className={styles.empty}>
          Este caso aún no tiene reivindicación ancla. Puede seguir el recorrido
          con el mapa y las cifras territoriales.
        </p>
      )}
    </div>
  );
}
