import { useState } from "react";
import { api } from "../../shared/api/client";
import styles from "./CuartoPages.module.css";

type Props = {
  slug: string;
  nombre: string;
  className?: string;
};

export function DescargarDiagnostico({ slug, nombre, className }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.cuartoDescargarReporte(slug, nombre);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo descargar el diagnóstico.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className={className}>
      <button type="button" className={styles.primary} onClick={run} disabled={busy}>
        {busy ? "Armando PDF…" : "Descargar diagnóstico"}
      </button>
      {error ? <span className={styles.empty}> {error}</span> : null}
    </span>
  );
}
