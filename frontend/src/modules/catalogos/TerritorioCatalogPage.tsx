import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../../shared/ui/forms.module.css";

type Zona = { slug: string; nombre: string };
type Colonia = { slug: string; nombre: string; zona: string };

export function TerritorioCatalogPage() {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [colonias, setColonias] = useState<Colonia[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .catalogoTerritorio()
      .then((d) => {
        setZonas(d.zonas);
        setColonias(d.colonias_demo);
      })
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
      await api.saveTerritorio({ zonas, colonias_demo: colonias });
      setMsg("Territorio guardado.");
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Cargando catálogo…</StateBlock>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel strong>
      <BotonVolver to="/catalogos" label="Volver a catálogos" />
      <h1>Catálogo de territorio</h1>
      <p className={styles.lead}>Edita zonas y colonias. Guarda para alimentar la captura.</p>

      <h2>Zonas</h2>
      <div className={styles.list}>
        {zonas.map((z, i) => (
          <div key={i} className={styles.row2}>
            <div className={styles.field}>
              <label>Slug</label>
              <input
                value={z.slug}
                onChange={(e) => {
                  const next = [...zonas];
                  next[i] = { ...z, slug: e.target.value };
                  setZonas(next);
                }}
              />
            </div>
            <div className={styles.field}>
              <label>Nombre</label>
              <input
                value={z.nombre}
                onChange={(e) => {
                  const next = [...zonas];
                  next[i] = { ...z, nombre: e.target.value };
                  setZonas(next);
                }}
              />
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => setZonas(zonas.filter((_, j) => j !== i))}
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
          onClick={() => setZonas([...zonas, { slug: "", nombre: "" }])}
        >
          + Zona
        </button>
      </div>

      <h2 style={{ marginTop: "1.5rem" }}>Colonias</h2>
      <div className={styles.list}>
        {colonias.map((c, i) => (
          <div key={i} className={styles.row2}>
            <div className={styles.field}>
              <label>Slug</label>
              <input
                value={c.slug}
                onChange={(e) => {
                  const next = [...colonias];
                  next[i] = { ...c, slug: e.target.value };
                  setColonias(next);
                }}
              />
            </div>
            <div className={styles.field}>
              <label>Nombre</label>
              <input
                value={c.nombre}
                onChange={(e) => {
                  const next = [...colonias];
                  next[i] = { ...c, nombre: e.target.value };
                  setColonias(next);
                }}
              />
            </div>
            <div className={styles.field}>
              <label>Zona</label>
              <select
                value={c.zona}
                onChange={(e) => {
                  const next = [...colonias];
                  next[i] = { ...c, zona: e.target.value };
                  setColonias(next);
                }}
              >
                <option value="">Selecciona</option>
                {zonas.map((z) => (
                  <option key={z.slug} value={z.slug}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => setColonias(colonias.filter((_, j) => j !== i))}
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
            setColonias([...colonias, { slug: "", nombre: "", zona: zonas[0]?.slug ?? "" }])
          }
        >
          + Colonia
        </button>
        <button type="button" className={styles.btn} onClick={save}>
          Guardar territorio
        </button>
      </div>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}
    </GlassPanel>
  );
}
