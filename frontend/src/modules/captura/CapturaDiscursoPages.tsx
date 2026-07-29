import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type DiscursoWrite } from "../../shared/api/client";
import type { ActorSummary, DiscursoSummary } from "../../shared/api/types";
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
  const [form, setForm] = useState<DiscursoWrite>({
    actor: "",
    topico_principal: "",
    subtopicos: [],
    audiencia: "",
    niveles: {},
  });
  const [subtopicosText, setSubtopicosText] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.actores(), api.catalogoDiscursoNiveles()])
      .then(([acts, niv]) => {
        setActores(acts);
        setNivelesMeta(niv.niveles);
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
            slug: d.slug,
          });
          setSubtopicosText(d.subtopicos.join(", "));
          setNivelesMeta(d.niveles_meta);
        })
        .catch((e: Error) => setErr(e.message))
        .finally(() => setLoading(false));
    }
  }, [isNew, slug]);

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
        <h2>Niveles analíticos</h2>
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
