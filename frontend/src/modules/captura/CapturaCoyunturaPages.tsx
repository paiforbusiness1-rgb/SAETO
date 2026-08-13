import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type CoyunturaWrite } from "../../shared/api/client";
import type {
  ActorSummary,
  CatalogosConfig,
  CoyunturaSummary,
  ReivindicacionSummary,
} from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../../shared/ui/forms.module.css";

const empty: CoyunturaWrite = {
  fecha: new Date().toISOString().slice(0, 10),
  actor: null,
  demanda: null,
  tipo_accion: "reunion",
  descripcion_accion: "",
  respuesta_gobierno: "no_aplica",
  detalle_respuesta: "",
  reaccion: "no_aplica",
  resultado: "",
  impacto_ciclo: null,
  fuentes: [],
  corredor_slug: null,
  tramo_slug: null,
};

export function CapturaCoyunturaListPage() {
  const [items, setItems] = useState<CoyunturaSummary[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .coyuntura()
      .then(setItems)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (slug: string) => {
    if (!confirm("¿Eliminar este evento de coyuntura?")) return;
    try {
      await api.deleteCoyuntura(slug);
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <GlassPanel strong>
      <BotonVolver to="/captura" label="Volver a captura" />
      <h1>Captura de coyuntura</h1>
      <div className={styles.actions}>
        <Link to="/captura/coyuntura/nuevo" className={styles.btn}>
          + Nuevo evento
        </Link>
      </div>
      {loading ? (
        <StateBlock>Cargando…</StateBlock>
      ) : err ? (
        <p className={styles.err}>{err}</p>
      ) : (
        <div className={styles.list}>
          {items.map((e) => (
            <GlassCard key={e.slug}>
              <div className={styles.listRow}>
                <div>
                  <strong>{e.tipo_accion_nombre || e.tipo_accion}</strong>
                  <p className={styles.meta}>
                    {e.fecha}
                    {e.actor_nombre ? ` · ${e.actor_nombre}` : ""}
                  </p>
                </div>
                <div className={styles.actions}>
                  <Link to={`/captura/coyuntura/${e.slug}`} className={styles.btnGhost}>
                    Editar
                  </Link>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => remove(e.slug)}
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

export function CapturaCoyunturaFormPage() {
  const { slug } = useParams();
  const isNew = !slug || slug === "nuevo";
  const navigate = useNavigate();
  const [form, setForm] = useState<CoyunturaWrite>(empty);
  const [actores, setActores] = useState<ActorSummary[]>([]);
  const [demandas, setDemandas] = useState<ReivindicacionSummary[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogosConfig | null>(null);
  const [corredores, setCorredores] = useState<
    { slug: string; nombre: string; tramos: { slug: string; nombre: string }[] }[]
  >([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    Promise.all([
      api.actores(),
      api.reivindicaciones(),
      api.catalogosConfig(),
      api.inteligenciaCorredores(),
    ])
      .then(([acts, revs, cats, corr]) => {
        setActores(acts);
        setDemandas(revs);
        setCatalogos(cats);
        setCorredores(
          corr.map((c) => ({
            slug: c.slug,
            nombre: c.nombre,
            tramos: c.tramos.map((t) => ({ slug: t.slug, nombre: t.nombre })),
          })),
        );
      })
      .catch((e: Error) => setErr(e.message));

    if (!isNew && slug) {
      api
        .coyunturaEvento(slug)
        .then((e) => {
          setForm({
            fecha: e.fecha.slice(0, 10),
            actor: e.actor,
            demanda: e.demanda,
            tipo_accion: e.tipo_accion,
            descripcion_accion: e.descripcion_accion,
            respuesta_gobierno: e.respuesta_gobierno,
            detalle_respuesta: e.detalle_respuesta,
            reaccion: e.reaccion,
            resultado: e.resultado,
            impacto_ciclo: e.impacto_ciclo,
            fuentes: e.fuentes,
            corredor_slug: e.corredor_slug ?? null,
            tramo_slug: e.tramo_slug ?? null,
            slug: e.slug,
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
    if (!form.actor && !form.demanda) {
      setErr("Vincula al menos un actor o una demanda.");
      return;
    }
    try {
      if (isNew) {
        const created = await api.createCoyuntura(form);
        setMsg("Evento registrado.");
        navigate(`/captura/coyuntura/${created.slug}`);
      } else if (slug) {
        await api.updateCoyuntura(slug, form);
        setMsg("Evento actualizado.");
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

  const coy = catalogos?.coyuntura;
  const fases = catalogos?.ciclo_vital.fases ?? [];

  return (
    <GlassPanel strong>
      <BotonVolver to="/captura/coyuntura" label="Volver a coyuntura" />
      <h1>{isNew ? "Nuevo evento de coyuntura" : "Editar evento"}</h1>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Fecha</label>
            <input
              type="date"
              required
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Tipo de acción</label>
            <select
              required
              value={form.tipo_accion}
              onChange={(e) => setForm({ ...form, tipo_accion: e.target.value })}
            >
              {(coy?.tipos_accion ?? []).map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Actor (opcional)</label>
            <select
              value={form.actor ?? ""}
              onChange={(e) =>
                setForm({ ...form, actor: e.target.value || null })
              }
            >
              <option value="">— Ninguno —</option>
              {actores.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Demanda (opcional)</label>
            <select
              value={form.demanda ?? ""}
              onChange={(e) =>
                setForm({ ...form, demanda: e.target.value || null })
              }
            >
              <option value="">— Ninguna —</option>
              {demandas.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.tema_nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label>Descripción de la acción</label>
          <textarea
            required
            value={form.descripcion_accion ?? ""}
            onChange={(e) =>
              setForm({ ...form, descripcion_accion: e.target.value })
            }
          />
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Respuesta gubernamental</label>
            <select
              value={form.respuesta_gobierno}
              onChange={(e) =>
                setForm({ ...form, respuesta_gobierno: e.target.value })
              }
            >
              {(coy?.respuestas_gobierno ?? []).map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Reacción</label>
            <select
              value={form.reaccion}
              onChange={(e) => setForm({ ...form, reaccion: e.target.value })}
            >
              {(coy?.reacciones ?? []).map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label>Detalle de la respuesta</label>
          <textarea
            value={form.detalle_respuesta ?? ""}
            onChange={(e) =>
              setForm({ ...form, detalle_respuesta: e.target.value })
            }
          />
        </div>
        <div className={styles.field}>
          <label>Resultado / consecuencias</label>
          <textarea
            value={form.resultado ?? ""}
            onChange={(e) => setForm({ ...form, resultado: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>Impacto propuesto en fase del ciclo (opcional)</label>
          <select
            value={form.impacto_ciclo ?? ""}
            onChange={(e) =>
              setForm({ ...form, impacto_ciclo: e.target.value || null })
            }
          >
            <option value="">— Sin cambio propuesto —</option>
            {fases.map((f) => (
              <option key={f.slug} value={f.slug}>
                {f.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Corredor crítico (opcional)</label>
            <select
              value={form.corredor_slug ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  corredor_slug: e.target.value || null,
                  tramo_slug: null,
                })
              }
            >
              <option value="">— Sin corredor —</option>
              {corredores.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Tramo (opcional)</label>
            <select
              value={form.tramo_slug ?? ""}
              onChange={(e) =>
                setForm({ ...form, tramo_slug: e.target.value || null })
              }
              disabled={!form.corredor_slug}
            >
              <option value="">— Sin tramo —</option>
              {(
                corredores.find((c) => c.slug === form.corredor_slug)?.tramos ||
                []
              ).map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn}>
            Guardar
          </button>
          <Link to="/captura/coyuntura" className={styles.btnGhost}>
            Cancelar
          </Link>
          <Link to="/coyuntura" className={styles.btnGhost}>
            Ver bitácora
          </Link>
        </div>
      </form>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}
    </GlassPanel>
  );
}
