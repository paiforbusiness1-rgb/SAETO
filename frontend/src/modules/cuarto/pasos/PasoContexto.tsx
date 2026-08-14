import type { CasoSituacion } from "../../../shared/api/types";
import { api } from "../../../shared/api/client";
import { IaPanel } from "../../ia/IaPanel";
import styles from "../CuartoPages.module.css";

export function PasoContexto({ caso }: { caso: CasoSituacion }) {
  return (
    <div>
      <h2>Contexto de analista</h2>
      <p className={styles.lead}>
        Lo que el número no dice. Lectura de mesa lista; la IA es opcional y no
        bloquea el cierre.
      </p>
      {caso.contexto.texto ? (
        <p className={styles.lectura}>{caso.contexto.texto}</p>
      ) : (
        <p className={styles.empty}>Sin plantilla de contexto para este tema.</p>
      )}
      {caso.contexto.factores.length ? (
        <ul className={styles.lista}>
          {caso.contexto.factores.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      ) : null}
      {caso.demanda ? (
        <IaPanel
          title="Contexto IA (opcional)"
          disclaimer="Usa la reivindicación ancla y la coyuntura pública. No inventa acuerdos ni fechas."
          onGenerate={async () => {
            const res = await api.iaContextoDecision(caso.demanda!.slug);
            return `${res.lectura}\n\n— modelo ${res.modelo}\n${res.disclaimer}`;
          }}
        />
      ) : null}
    </div>
  );
}
