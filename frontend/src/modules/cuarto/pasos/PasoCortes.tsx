import type { CasoSituacion } from "../../../shared/api/types";
import { fmtNum } from "../toCeldaCalor";
import styles from "../CuartoPages.module.css";

export function PasoCortes({ caso }: { caso: CasoSituacion }) {
  const { entonces, ahora } = caso;
  if (!entonces || !ahora) {
    return (
      <div>
        <h2>Entonces y ahora</h2>
        <p className={styles.empty}>
          Este caso aún no tiene dos cortes temporales. Puede seguir al contexto
          de analista.
        </p>
      </div>
    );
  }

  const deltaPob = ahora.poblacion - entonces.poblacion;
  const deltaInt = ahora.intensidad - entonces.intensidad;

  return (
    <div>
      <h2>Entonces y ahora</h2>
      <p className={styles.lead}>
        El mismo territorio, dos momentos. La mesa decide sobre lo que cambió,
        no sobre una foto suelta.
      </p>
      <div className={styles.cortePair}>
        <div className={styles.corte}>
          <p className={styles.kicker}>{entonces.etiqueta}</p>
          <span className={styles.meta}>Población</span>
          <strong>{fmtNum(entonces.poblacion)}</strong>
          <span className={styles.meta}>Intensidad del problema</span>
          <strong>{entonces.intensidad}</strong>
          {entonces.nota ? <p className={styles.meta}>{entonces.nota}</p> : null}
        </div>
        <div className={styles.versus}>→</div>
        <div className={styles.corte}>
          <p className={styles.kicker}>{ahora.etiqueta}</p>
          <span className={styles.meta}>Población</span>
          <strong>{fmtNum(ahora.poblacion)}</strong>
          <p className={styles.delta}>
            {deltaPob >= 0 ? "+" : ""}
            {fmtNum(deltaPob)}
          </p>
          <span className={styles.meta}>Intensidad del problema</span>
          <strong>{ahora.intensidad}</strong>
          <p className={styles.delta}>
            {deltaInt >= 0 ? "+" : ""}
            {deltaInt} puntos
          </p>
          {ahora.nota ? <p className={styles.meta}>{ahora.nota}</p> : null}
        </div>
      </div>
    </div>
  );
}
