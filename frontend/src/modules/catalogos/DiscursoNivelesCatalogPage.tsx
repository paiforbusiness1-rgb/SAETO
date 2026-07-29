import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../../shared/ui/forms.module.css";

type Nivel = { slug: string; nombre: string; subtopicos: string[] };

export function DiscursoNivelesCatalogPage() {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .catalogoDiscursoNiveles()
      .then((d) => setNiveles(d.niveles))
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
      await api.saveDiscursoNiveles({ niveles });
      setMsg("Niveles de discurso guardados.");
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
      <h1>Niveles de discurso</h1>
      <p className={styles.lead}>
        Estructura analítica (PDF de tópicos). Los subtítulos van separados por coma.
      </p>
      <div className={styles.list}>
        {niveles.map((n, i) => (
          <div key={i} className={styles.form}>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label>Slug</label>
                <input
                  value={n.slug}
                  onChange={(e) => {
                    const next = [...niveles];
                    next[i] = { ...n, slug: e.target.value };
                    setNiveles(next);
                  }}
                />
              </div>
              <div className={styles.field}>
                <label>Nombre</label>
                <input
                  value={n.nombre}
                  onChange={(e) => {
                    const next = [...niveles];
                    next[i] = { ...n, nombre: e.target.value };
                    setNiveles(next);
                  }}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>Subtópicos (separados por coma)</label>
              <input
                value={n.subtopicos.join(", ")}
                onChange={(e) => {
                  const next = [...niveles];
                  next[i] = {
                    ...n,
                    subtopicos: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  };
                  setNiveles(next);
                }}
              />
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => setNiveles(niveles.filter((_, j) => j !== i))}
              >
                Quitar nivel
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
            setNiveles([...niveles, { slug: "", nombre: "", subtopicos: [] }])
          }
        >
          + Nivel
        </button>
        <button type="button" className={styles.btn} onClick={save}>
          Guardar niveles
        </button>
      </div>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}
    </GlassPanel>
  );
}
