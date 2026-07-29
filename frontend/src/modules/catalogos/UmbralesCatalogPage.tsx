import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../../shared/ui/forms.module.css";

type Banda = { min: number; max: number; semaforo: string; etiqueta: string };

export function UmbralesCatalogPage() {
  const [bandas, setBandas] = useState<Banda[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .catalogoUmbrales()
      .then((d) => setBandas(d.intensidad))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setErr("");
    setMsg("");
    try {
      await api.saveUmbrales({ intensidad: bandas });
      setMsg("Umbrales guardados. El semáforo se recalcula al leer reivindicaciones.");
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Cargando…</StateBlock>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel strong>
      <BotonVolver to="/catalogos" label="Volver a catálogos" />
      <h1>Umbrales de semáforo</h1>
      <p className={styles.lead}>Define qué intensidad cae en verde, amarillo o rojo.</p>
      <div className={styles.list}>
        {bandas.map((b, i) => (
          <div key={i} className={styles.row2}>
            <div className={styles.field}>
              <label>Mín</label>
              <input
                type="number"
                value={b.min}
                onChange={(e) => {
                  const next = [...bandas];
                  next[i] = { ...b, min: Number(e.target.value) };
                  setBandas(next);
                }}
              />
            </div>
            <div className={styles.field}>
              <label>Máx</label>
              <input
                type="number"
                value={b.max}
                onChange={(e) => {
                  const next = [...bandas];
                  next[i] = { ...b, max: Number(e.target.value) };
                  setBandas(next);
                }}
              />
            </div>
            <div className={styles.field}>
              <label>Semáforo</label>
              <select
                value={b.semaforo}
                onChange={(e) => {
                  const next = [...bandas];
                  next[i] = { ...b, semaforo: e.target.value };
                  setBandas(next);
                }}
              >
                <option value="verde">verde</option>
                <option value="amarillo">amarillo</option>
                <option value="rojo">rojo</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Etiqueta</label>
              <input
                value={b.etiqueta}
                onChange={(e) => {
                  const next = [...bandas];
                  next[i] = { ...b, etiqueta: e.target.value };
                  setBandas(next);
                }}
              />
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => setBandas(bandas.filter((_, j) => j !== i))}
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnGhost}
          onClick={() =>
            setBandas([
              ...bandas,
              { min: 1, max: 1, semaforo: "verde", etiqueta: "Nueva banda" },
            ])
          }
        >
          + Banda
        </button>
        <button type="button" className={styles.btn} onClick={save}>
          Guardar umbrales
        </button>
      </div>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}
    </GlassPanel>
  );
}
