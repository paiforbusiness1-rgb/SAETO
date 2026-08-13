import { useEffect, useState } from "react";
import { api, getSaetoRol } from "../../shared/api/client";
import type { IaStatus } from "../../shared/api/types";
import styles from "./IaPanel.module.css";

type Props = {
  title: string;
  disclaimer?: string;
  onGenerate: () => Promise<string>;
  disabled?: boolean;
};

export function IaPanel({ title, disclaimer, onGenerate, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [lectura, setLectura] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<IaStatus | null>(null);
  const [rol, setRol] = useState(getSaetoRol);

  useEffect(() => {
    api.iaStatus().then(setStatus).catch(() => setStatus(null));
    const sync = () => setRol(getSaetoRol());
    window.addEventListener("saeto-rol-change", sync);
    return () => window.removeEventListener("saeto-rol-change", sync);
  }, []);

  const rolOk =
    !status?.roles_permitidos?.length ||
    status.roles_permitidos.includes(rol);

  const run = async () => {
    setLoading(true);
    setError(null);
    if (!rolOk) {
      setError(
        `Tu rol demo es "${rol}". Cambia a Capturista/Analista (o superior) en la barra superior y vuelve a intentar.`,
      );
      setLoading(false);
      return;
    }
    if (status && !status.api_key_configurada) {
      setError("Falta GROQ_API_KEY en backend/.env. Reinicia uvicorn tras configurarla.");
      setLoading(false);
      return;
    }
    try {
      const text = await onGenerate();
      setLectura(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar la lectura IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h2>{title}</h2>
        <div className={styles.actions}>
          <button type="button" onClick={run} disabled={disabled || loading}>
            {loading ? "Generando…" : lectura ? "Recalcular IA" : "Generar lectura IA"}
          </button>
          {lectura ? (
            <button type="button" className={styles.ghost} onClick={() => setLectura(null)}>
              Ocultar
            </button>
          ) : null}
        </div>
      </div>
      <p className={styles.meta}>
        Rol actual: <strong>{rol}</strong>
        {status ? ` · Groq: ${status.api_key_configurada ? "listo" : "sin key"}` : ""}
      </p>
      {disclaimer ? <p className={styles.disclaimer}>{disclaimer}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {lectura ? <pre className={styles.lectura}>{lectura}</pre> : null}
    </div>
  );
}
