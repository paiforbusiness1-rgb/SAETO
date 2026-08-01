import type { SentidoCiclo } from "../api/types";
import styles from "./CicloBadge.module.css";

type Props = {
  faseNombre: string;
  sentido?: SentidoCiclo;
  grado?: number;
  compact?: boolean;
};

export function CicloBadge({ faseNombre, sentido, grado, compact }: Props) {
  const sentidoClass =
    sentido === "escalando"
      ? styles.escalando
      : sentido === "desescalando"
        ? styles.desescalando
        : styles.estable;

  return (
    <span className={`${styles.wrap} ${compact ? styles.compact : ""}`}>
      <span className={styles.fase}>{faseNombre}</span>
      {sentido ? (
        <span className={`${styles.sentido} ${sentidoClass}`}>{sentido}</span>
      ) : null}
      {grado != null && !compact ? (
        <span className={styles.grado}>Grado {grado}/5</span>
      ) : null}
    </span>
  );
}
