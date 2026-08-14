import { Link } from "react-router-dom";
import type { CasoSituacion } from "../../../shared/api/types";
import styles from "../CuartoPages.module.css";

export function PasoTimeline({ caso }: { caso: CasoSituacion }) {
  if (!caso.timeline.length) {
    return (
      <div>
        <h2>Qué se decidió</h2>
        <p className={styles.empty}>
          Aún no hay eventos de coyuntura ligados a este caso. Puede seguir y
          cerrar con recomendaciones, o abrir Coyuntura para registrar uno.
        </p>
        <p className={styles.meta}>
          <Link to="/coyuntura">Abrir coyuntura</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Qué se decidió</h2>
      <p className={styles.lead}>
        Acción vecinal, respuesta de gobierno y resultado. Fechas que importan
        para la mesa, no el expediente completo.
      </p>
      <ol className={styles.timeline}>
        {caso.timeline.map((e) => (
          <li key={`${e.fecha}-${e.tipo_nombre}-${e.descripcion}`} className={styles.timelineItem}>
            <time className={styles.fecha}>{e.fecha}</time>
            <div>
              <strong>{e.tipo_nombre}</strong>
              {e.actor_nombre ? (
                <span className={styles.meta}> · {e.actor_nombre}</span>
              ) : null}
              {e.descripcion ? <p>{e.descripcion}</p> : null}
              {e.respuesta_nombre ? (
                <p className={styles.meta}>
                  Respuesta: {e.respuesta_nombre}
                  {e.detalle_respuesta ? ` — ${e.detalle_respuesta}` : ""}
                </p>
              ) : null}
              {e.resultado ? <p>{e.resultado}</p> : null}
              {e.enlace ? (
                <p className={styles.meta}>
                  <Link to={e.enlace}>Ver detalle en coyuntura</Link>
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
