import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../../shared/ui/forms.module.css";

type Tema = { slug: string; nombre: string; descripcion?: string };

export function TemasCatalogPage() {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .catalogoTemas()
      .then((d) => setTemas(d.temas))
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
      await api.saveTemas({ temas });
      setMsg("Temas guardados.");
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
      <h1>Temas de reivindicación</h1>
      <p className={styles.lead}>Catálogo usado en captura de demandas y fichas de actores.</p>
      <div className={styles.list}>
        {temas.map((t, i) => (
          <div key={i} className={styles.row2}>
            <div className={styles.field}>
              <label>Slug</label>
              <input
                value={t.slug}
                onChange={(e) => {
                  const next = [...temas];
                  next[i] = { ...t, slug: e.target.value };
                  setTemas(next);
                }}
              />
            </div>
            <div className={styles.field}>
              <label>Nombre</label>
              <input
                value={t.nombre}
                onChange={(e) => {
                  const next = [...temas];
                  next[i] = { ...t, nombre: e.target.value };
                  setTemas(next);
                }}
              />
            </div>
            <div className={styles.field}>
              <label>Descripción</label>
              <input
                value={t.descripcion ?? ""}
                onChange={(e) => {
                  const next = [...temas];
                  next[i] = { ...t, descripcion: e.target.value };
                  setTemas(next);
                }}
              />
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => setTemas(temas.filter((_, j) => j !== i))}
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
          onClick={() => setTemas([...temas, { slug: "", nombre: "", descripcion: "" }])}
        >
          + Tema
        </button>
        <button type="button" className={styles.btn} onClick={save}>
          Guardar temas
        </button>
      </div>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}
    </GlassPanel>
  );
}
