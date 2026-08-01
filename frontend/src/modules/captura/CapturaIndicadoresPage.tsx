import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, type IndicadorWrite } from "../../shared/api/client";
import type { IndicadorContexto } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../../shared/ui/forms.module.css";

const empty: IndicadorWrite = {
  territorio: "",
  zona: "",
  clave: "",
  nombre: "",
  valor: "",
  anio: new Date().getFullYear(),
  fuente: "INEGI",
  nota: "",
};

export function CapturaIndicadoresPage() {
  const [items, setItems] = useState<IndicadorContexto[]>([]);
  const [colonias, setColonias] = useState<
    { slug: string; nombre: string; zona: string }[]
  >([]);
  const [form, setForm] = useState<IndicadorWrite>(empty);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([api.indicadores(), api.catalogoTerritorio()])
      .then(([inds, terr]) => {
        setItems(inds);
        setColonias(terr.colonias_demo);
        setForm((f) => ({
          ...f,
          territorio: f.territorio || terr.colonias_demo[0]?.slug || "",
          zona: f.zona || terr.colonias_demo[0]?.zona || "",
        }));
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      const valor =
        typeof form.valor === "string" && form.valor.trim() !== "" && !Number.isNaN(Number(form.valor))
          ? Number(form.valor)
          : form.valor;
      await api.upsertIndicador({ ...form, valor });
      setMsg("Indicador guardado (referencial).");
      setForm((f) => ({
        ...empty,
        territorio: f.territorio,
        zona: f.zona,
        anio: f.anio,
        fuente: "INEGI",
      }));
      load();
    } catch (error) {
      setErr((error as Error).message);
    }
  };

  const edit = (ind: IndicadorContexto) => {
    setForm({
      slug: ind.slug,
      territorio: ind.territorio,
      zona: ind.zona,
      clave: ind.clave,
      nombre: ind.nombre,
      valor: ind.valor,
      anio: ind.anio,
      fuente: ind.fuente,
      nota: ind.nota,
    });
    setMsg("");
    setErr("");
  };

  const remove = async (slug: string) => {
    if (!confirm("¿Eliminar este indicador referencial?")) return;
    try {
      await api.deleteIndicador(slug);
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Cargando indicadores…</StateBlock>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel strong>
      <BotonVolver to="/captura" label="Volver a captura" />
      <h1>Indicadores de contexto (INEGI)</h1>
      <p className={styles.lead}>
        Carga referencial para contrastar con percepción local. No es encuesta SAETO.
      </p>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Colonia</label>
            <select
              required
              value={form.territorio}
              onChange={(e) => {
                const c = colonias.find((x) => x.slug === e.target.value);
                setForm({
                  ...form,
                  territorio: e.target.value,
                  zona: c?.zona ?? form.zona,
                });
              }}
            >
              {colonias.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Clave corta</label>
            <input
              required
              value={form.clave}
              onChange={(e) => setForm({ ...form, clave: e.target.value })}
              placeholder="ej. disponibilidad_agua"
            />
          </div>
        </div>
        <div className={styles.field}>
          <label>Nombre del indicador</label>
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Valor</label>
            <input
              required
              value={String(form.valor)}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Año</label>
            <input
              type="number"
              required
              value={form.anio}
              onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })}
            />
          </div>
          <div className={styles.field}>
            <label>Fuente</label>
            <input
              value={form.fuente ?? "INEGI"}
              onChange={(e) => setForm({ ...form, fuente: e.target.value })}
            />
          </div>
        </div>
        <div className={styles.field}>
          <label>Nota / disclaimer</label>
          <textarea
            value={form.nota ?? ""}
            onChange={(e) => setForm({ ...form, nota: e.target.value })}
          />
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn}>
            {form.slug ? "Actualizar indicador" : "Guardar indicador"}
          </button>
          <Link to="/reportes/contexto-inegi" className={styles.btnGhost}>
            Ver reporte
          </Link>
        </div>
      </form>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}

      <h2 style={{ marginTop: "1.5rem", fontSize: "1.1rem" }}>Cargados</h2>
      <div className={styles.list}>
        {items.map((ind) => (
          <GlassCard key={ind.slug}>
            <div className={styles.listRow}>
              <div>
                <strong>{ind.nombre}</strong>
                <p className={styles.meta}>
                  {ind.territorio_nombre} · {ind.valor} ({ind.anio}) · {ind.fuente}
                </p>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.btnGhost} onClick={() => edit(ind)}>
                  Editar
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() => remove(ind.slug)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </GlassPanel>
  );
}
