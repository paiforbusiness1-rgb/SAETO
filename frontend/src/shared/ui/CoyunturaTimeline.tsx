import { Link } from "react-router-dom";
import type { CoyunturaSummary } from "../api/types";
import styles from "./CoyunturaTimeline.module.css";

type Props = {
  eventos: CoyunturaSummary[];
  linkBase?: string;
};

export function CoyunturaTimeline({ eventos, linkBase = "/coyuntura" }: Props) {
  if (eventos.length === 0) {
    return <p className={styles.empty}>Sin eventos de coyuntura vinculados.</p>;
  }

  const sorted = [...eventos].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  );

  return (
    <ol className={styles.timeline}>
      {sorted.map((e) => (
        <li key={e.slug} className={styles.item}>
          <time className={styles.fecha}>{e.fecha}</time>
          <div className={styles.body}>
            <strong>{e.tipo_accion_nombre || e.tipo_accion}</strong>
            {e.actor_nombre ? (
              <span className={styles.meta}> · {e.actor_nombre}</span>
            ) : null}
            {e.demanda_nombre ? (
              <span className={styles.meta}> · {e.demanda_nombre}</span>
            ) : null}
            <Link to={`${linkBase}/${e.slug}`} className={styles.link}>
              Ver detalle
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );
}
