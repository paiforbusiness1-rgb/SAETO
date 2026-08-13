import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../shared/api/client";
import type { ClasificarTextoResponse, IaStatus } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../inteligencia/InteligenciaPages.module.css";
import iaStyles from "./IaPanel.module.css";

export function IaClasificarPage() {
  const [status, setStatus] = useState<IaStatus | null>(null);
  const [texto, setTexto] = useState("");
  const [result, setResult] = useState<ClasificarTextoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.iaStatus().then(setStatus).catch((e: Error) => setError(e.message));
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.iaClasificarTexto(texto);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layout}>
      <GlassPanel strong>
        <BotonVolver to="/inteligencia" />
        <h1>IA · Clasificar texto público</h1>
        <p className={styles.lead}>
          Pega una nota de prensa o síntesis pública. Groq sugiere tema, fase y
          sentido para captura. Con datos privados usará el mismo flujo sobre
          hechos autorizados.
        </p>
        {status ? (
          <p className={styles.meta}>
            Modelo: {status.modelo} · API key:{" "}
            {status.api_key_configurada ? "configurada" : "pendiente (GROQ_API_KEY)"}
          </p>
        ) : null}
        <form className={styles.formGrid} onSubmit={onSubmit}>
          <label>
            Texto
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              required
              minLength={12}
              placeholder="Ej. En Barrio Arriba vecinos bloquearon por tandeo de agua…"
            />
          </label>
          <div className={styles.actions}>
            <button type="submit" disabled={loading}>
              {loading ? "Clasificando…" : "Clasificar con IA"}
            </button>
          </div>
        </form>
        {error ? <p className={iaStyles.error}>{error}</p> : null}
        {result ? (
          <div className={iaStyles.wrap}>
            <p className={iaStyles.disclaimer}>{result.disclaimer}</p>
            <ul className={styles.panelList}>
              <li>Tema: {result.tema_sugerido}</li>
              <li>Fase: {result.fase_ciclo_sugerida}</li>
              <li>Sentido: {result.sentido_sugerido}</li>
              <li>Confianza: {result.confianza}</li>
              <li>Resumen: {result.resumen_corto}</li>
              <li>Notas: {result.notas_mesa}</li>
            </ul>
          </div>
        ) : null}
        {!status && !error ? <StateBlock>Consultando estado IA…</StateBlock> : null}
      </GlassPanel>
    </div>
  );
}
