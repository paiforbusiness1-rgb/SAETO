import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type DiscursoWrite } from "../../shared/api/client";
import type { ActorSummary, CatalogosConfig, DiscursoSummary } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../../shared/ui/forms.module.css";

export function CapturaDiscursoListPage() {
  const [items, setItems] = useState<DiscursoSummary[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .discursos()
      .then(setItems)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (slug: string) => {
    if (!confirm("¿Eliminar esta pieza de discurso?")) return;
    try {
      await api.deleteDiscurso(slug);
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <GlassPanel strong>
      <BotonVolver to="/captura" label="Volver a captura" />
      <h1>Captura de discurso</h1>
      <div className={styles.actions}>
        <Link to="/captura/discurso/nuevo" className={styles.btn}>
          + Nueva pieza
        </Link>
      </div>
      {loading ? (
        <StateBlock>Cargando…</StateBlock>
      ) : err ? (
        <p className={styles.err}>{err}</p>
      ) : (
        <div className={styles.list}>
          {items.map((d) => (
            <GlassCard key={d.slug}>
              <div className={styles.listRow}>
                <div>
                  <strong>{d.topico_principal}</strong>
                  <p className={styles.meta}>{d.actor_nombre}</p>
                  {d.emociones.length > 0 ? (
                    <p className={styles.meta}>Emociones: {d.emociones.join(", ")}</p>
                  ) : null}
                </div>
                <div className={styles.actions}>
                  <Link to={`/captura/discurso/${d.slug}`} className={styles.btnGhost}>
                    Editar
                  </Link>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => remove(d.slug)}
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

export function CapturaDiscursoFormPage() {
  const { slug } = useParams();
  const isNew = !slug || slug === "nuevo";
  const navigate = useNavigate();
  const [actores, setActores] = useState<ActorSummary[]>([]);
  const [nivelesMeta, setNivelesMeta] = useState<
    { slug: string; nombre: string }[]
  >([]);
  const [catalogos, setCatalogos] = useState<CatalogosConfig | null>(null);
  const [nivelesOpen, setNivelesOpen] = useState(false);
  const [form, setForm] = useState<DiscursoWrite>({
    actor: "",
    topico_principal: "",
    subtopicos: [],
    audiencia: "",
    niveles: {},
    narrativas: "",
    argumentos: "",
    ideologia: "",
    emociones: [],
    endo_grupo: "",
    exo_grupo: "",
    coaliciones_posibles: "",
    hipotesis_mesa: true,
  });
  const [subtopicosText, setSubtopicosText] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.actores(),
      api.catalogoDiscursoNiveles(),
      api.catalogosConfig(),
    ])
      .then(([acts, niv, cats]) => {
        setActores(acts);
        setNivelesMeta(niv.niveles);
        setCatalogos(cats);
        if (isNew) {
          const niveles: Record<string, string> = {};
          niv.niveles.forEach((n) => {
            niveles[n.slug] = "";
          });
          setForm((f) => ({
            ...f,
            actor: acts[0]?.slug ?? "",
            niveles,
          }));
          setLoading(false);
        }
      })
      .catch((e: Error) => {
        setErr(e.message);
        setLoading(false);
      });

    if (!isNew && slug) {
      api
        .discurso(slug)
        .then((d) => {
          setForm({
            actor: d.actor,
            topico_principal: d.topico_principal,
            subtopicos: d.subtopicos,
            audiencia: d.audiencia,
            niveles: d.niveles,
            narrativas: d.narrativas,
            argumentos: d.argumentos,
            ideologia: d.ideologia,
            emociones: d.emociones,
            endo_grupo: d.endo_grupo,
            exo_grupo: d.exo_grupo,
            coaliciones_posibles: d.coaliciones_posibles,
            hipotesis_mesa: d.hipotesis_mesa,
            slug: d.slug,
          });
          setSubtopicosText(d.subtopicos.join(", "));
          setNivelesMeta(d.niveles_meta);
        })
        .catch((e: Error) => setErr(e.message))
        .finally(() => setLoading(false));
    }
  }, [isNew, slug]);

  const toggleEmocion = (emo: string) => {
    setForm((f) => {
      const has = (f.emociones ?? []).includes(emo);
      return {
        ...f,
        emociones: has
          ? (f.emociones ?? []).filter((x) => x !== emo)
          : [...(f.emociones ?? []), emo],
      };
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const payload: DiscursoWrite = {
      ...form,
      subtopicos: subtopicosText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      hipotesis_mesa: true,
    };
    try {
      if (isNew) {
        const created = await api.createDiscurso(payload);
        setMsg("Pieza creada.");
        navigate(`/captura/discurso/${created.slug}`);
      } else if (slug) {
        await api.updateDiscurso(slug, payload);
        setMsg("Pieza actualizada.");
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

  const mesa = catalogos?.discurso_mesa;

  return (
    <GlassPanel strong>
      <BotonVolver to="/captura/discurso" label="Volver a discurso" />
      <h1>{isNew ? "Nueva pieza de discurso" : "Editar discurso"}</h1>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label>Actor</label>
          <select
            required
            value={form.actor}
            onChange={(e) => setForm({ ...form, actor: e.target.value })}
          >
            {actores.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label>Tópico principal</label>
          <input
            required
            value={form.topico_principal}
            onChange={(e) => setForm({ ...form, topico_principal: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>Audiencia</label>
          <input
            value={form.audiencia}
            onChange={(e) => setForm({ ...form, audiencia: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>Subtópicos (separados por coma)</label>
          <input
            value={subtopicosText}
            onChange={(e) => setSubtopicosText(e.target.value)}
          />
        </div>

        <h2>Rúbricas de mesa (Capa 1)</h2>
        <div className={styles.field}>
          <label>Narrativas que difunden</label>
          <textarea
            value={form.narrativas ?? ""}
            onChange={(e) => setForm({ ...form, narrativas: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>Argumentos que sostienen</label>
          <textarea
            value={form.argumentos ?? ""}
            onChange={(e) => setForm({ ...form, argumentos: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>Ideología que proclaman</label>
          <input
            list="ideologias-list"
            value={form.ideologia ?? ""}
            onChange={(e) => setForm({ ...form, ideologia: e.target.value })}
          />
          <datalist id="ideologias-list">
            {(mesa?.ideologias ?? []).map((i) => (
              <option key={i.slug} value={i.nombre} />
            ))}
          </datalist>
        </div>
        <div className={styles.field}>
          <label>Emociones que manifiestan</label>
          <div className={styles.checkGrid}>
            {(mesa?.emociones ?? []).map((e) => (
              <label key={e.slug} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={(form.emociones ?? []).includes(e.slug)}
                  onChange={() => toggleEmocion(e.slug)}
                />
                {e.nombre}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.field}>
          <label>Relaciones endo-grupo</label>
          <textarea
            value={form.endo_grupo ?? ""}
            onChange={(e) => setForm({ ...form, endo_grupo: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>Relaciones exo-grupo</label>
          <textarea
            value={form.exo_grupo ?? ""}
            onChange={(e) => setForm({ ...form, exo_grupo: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>Coaliciones posibles (hipótesis de mesa)</label>
          <textarea
            value={form.coaliciones_posibles ?? ""}
            onChange={(e) =>
              setForm({ ...form, coaliciones_posibles: e.target.value })
            }
          />
          <p className={styles.meta}>
            Siempre se registran como hipótesis — no como predicción automática.
          </p>
        </div>

        <button
          type="button"
          className={styles.btnGhost}
          onClick={() => setNivelesOpen((o) => !o)}
        >
          {nivelesOpen ? "Ocultar" : "Mostrar"} niveles analíticos (Capa 2)
        </button>
        {nivelesOpen ? (
          <>
            <h2>Niveles analíticos (Capa 2)</h2>
            {nivelesMeta.map((n) => (
              <div key={n.slug} className={styles.field}>
                <label>{n.nombre}</label>
                <textarea
                  value={form.niveles[n.slug] ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      niveles: { ...form.niveles, [n.slug]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
          </>
        ) : null}

        <div className={styles.actions}>
          <button type="submit" className={styles.btn}>
            Guardar
          </button>
          <Link to="/captura/discurso" className={styles.btnGhost}>
            Cancelar
          </Link>
          <Link to="/discurso" className={styles.btnGhost}>
            Ver laboratorio
          </Link>
        </div>
      </form>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}
    </GlassPanel>
  );
}
