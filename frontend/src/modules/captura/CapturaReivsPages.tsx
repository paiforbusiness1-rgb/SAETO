import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type ReivindicacionWrite } from "../../shared/api/client";
import type { ReivindicacionSummary } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { SemaforoPill } from "../../shared/ui/SemaforoPill";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../../shared/ui/forms.module.css";

const empty: ReivindicacionWrite = {
  tema: "",
  territorio: "",
  zona: "",
  intensidad: 3,
  deuda_historica: false,
  resumen_deuda: "",
  fuente: "campo_demo",
  peso_opinion: 50,
};

export function CapturaReivsListPage() {
  const [items, setItems] = useState<ReivindicacionSummary[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .reivindicaciones()
      .then(setItems)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (slug: string) => {
    if (!confirm("¿Eliminar esta reivindicación?")) return;
    try {
      await api.deleteReivindicacion(slug);
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <GlassPanel strong>
      <BotonVolver to="/captura" label="Volver a captura" />
      <h1>Captura de reivindicaciones</h1>
      <div className={styles.actions}>
        <Link to="/captura/reivindicaciones/nueva" className={styles.btn}>
          + Nueva reivindicación
        </Link>
      </div>
      {loading ? (
        <StateBlock>Cargando…</StateBlock>
      ) : err ? (
        <p className={styles.err}>{err}</p>
      ) : (
        <div className={styles.list}>
          {items.map((r) => (
            <GlassCard key={r.slug}>
              <div className={styles.listRow}>
                <div>
                  <strong>{r.tema_nombre}</strong>
                  <p className={styles.meta}>
                    {r.territorio_nombre} · intensidad {r.intensidad}
                  </p>
                </div>
                <div className={styles.actions}>
                  <SemaforoPill value={r.semaforo} label={r.semaforo_etiqueta} />
                  <Link
                    to={`/captura/reivindicaciones/${r.slug}`}
                    className={styles.btnGhost}
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => remove(r.slug)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </GlassPanel>
  );
}

export function CapturaReivFormPage() {
  const { slug } = useParams();
  const isNew = !slug || slug === "nueva";
  const navigate = useNavigate();
  const [form, setForm] = useState<ReivindicacionWrite>(empty);
  const [temas, setTemas] = useState<{ slug: string; nombre: string }[]>([]);
  const [colonias, setColonias] = useState<
    { slug: string; nombre: string; zona: string }[]
  >([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    Promise.all([api.catalogoTemas(), api.catalogoTerritorio()])
      .then(([temasData, terr]) => {
        setTemas(temasData.temas);
        setColonias(terr.colonias_demo);
        if (isNew) {
          setForm((f) => ({
            ...f,
            tema: temasData.temas[0]?.slug ?? "",
            territorio: terr.colonias_demo[0]?.slug ?? "",
            zona: terr.colonias_demo[0]?.zona ?? "",
          }));
        }
      })
      .catch((e: Error) => setErr(e.message));

    if (!isNew && slug) {
      api
        .reivindicacion(slug)
        .then((r) => {
          setForm({
            tema: r.tema,
            territorio: r.territorio,
            zona: r.zona,
            intensidad: r.intensidad,
            deuda_historica: r.deuda_historica,
            resumen_deuda: r.resumen_deuda,
            fuente: r.fuente,
            peso_opinion: r.peso_opinion,
            slug: r.slug,
          });
        })
        .catch((e: Error) => setErr(e.message))
        .finally(() => setLoading(false));
    }
  }, [isNew, slug]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      if (isNew) {
        const created = await api.createReivindicacion(form);
        setMsg("Reivindicación creada.");
        navigate(`/captura/reivindicaciones/${created.slug}`);
      } else if (slug) {
        await api.updateReivindicacion(slug, form);
        setMsg("Reivindicación actualizada.");
      }
    } catch (error) {
      setErr((error as Error).message);
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
      <BotonVolver to="/captura/reivindicaciones" label="Volver a reivindicaciones" />
      <h1>{isNew ? "Nueva reivindicación" : "Editar reivindicación"}</h1>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Tema</label>
            <select
              required
              value={form.tema}
              onChange={(e) => setForm({ ...form, tema: e.target.value })}
            >
              {temas.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
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
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Intensidad (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              required
              value={form.intensidad}
              onChange={(e) => setForm({ ...form, intensidad: Number(e.target.value) })}
            />
          </div>
          <div className={styles.field}>
            <label>Peso de opinión (0–100)</label>
            <input
              type="number"
              min={0}
              max={100}
              required
              value={form.peso_opinion}
              onChange={(e) =>
                setForm({ ...form, peso_opinion: Number(e.target.value) })
              }
            />
          </div>
          <div className={styles.field}>
            <label>Fuente</label>
            <select
              value={form.fuente}
              onChange={(e) => setForm({ ...form, fuente: e.target.value })}
            >
              <option value="encuesta_demo">encuesta_demo</option>
              <option value="bd_gobierno_demo">bd_gobierno_demo</option>
              <option value="campo_demo">campo_demo</option>
            </select>
          </div>
        </div>
        <label className={styles.checkItem}>
          <input
            type="checkbox"
            checked={form.deuda_historica}
            onChange={(e) => setForm({ ...form, deuda_historica: e.target.checked })}
          />
          Deuda histórica / cuenta pendiente
        </label>
        <div className={styles.field}>
          <label>Resumen de la deuda / demanda</label>
          <textarea
            required
            value={form.resumen_deuda}
            onChange={(e) => setForm({ ...form, resumen_deuda: e.target.value })}
          />
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn}>
            Guardar
          </button>
          <Link to="/captura/reivindicaciones" className={styles.btnGhost}>
            Cancelar
          </Link>
          <Link to="/observatorio" className={styles.btnGhost}>
            Ver observatorio
          </Link>
        </div>
      </form>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}
    </GlassPanel>
  );
}
