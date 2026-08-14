import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  api,
  onSaetoRolChange,
  rolVeSensible,
  type ActorWrite,
} from "../../shared/api/client";
import type { ActorSummary, CatalogosConfig } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../../shared/ui/forms.module.css";

const empty: ActorWrite = {
  nombre: "",
  colonia: "",
  zona: "",
  rol: "",
  organizacion: "",
  capacidad_estimada: 0,
  capacidad_comprobada: null,
  fecha_comprobacion: null,
  metodo_comprobacion: null,
  tipo_actor: "liderazgo_vecinal",
  reivindicaciones_abiertas: [],
  estado_verificacion: "declarado",
  notas_mesa: "",
  interes_declarado: "",
  interes_reservado: "",
  recursos_poder: [],
  notas_poder: "",
};

export function CapturaActoresListPage() {
  const [items, setItems] = useState<ActorSummary[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [rolTick, setRolTick] = useState(0);

  const load = () => {
    setLoading(true);
    api
      .actores()
      .then(setItems)
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [rolTick]);

  useEffect(() => onSaetoRolChange(() => setRolTick((n) => n + 1)), []);

  const remove = async (slug: string, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre}?`)) return;
    try {
      await api.deleteActor(slug);
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <GlassPanel strong>
      <BotonVolver to="/captura" label="Volver a captura" />
      <h1>Captura de actores</h1>
      <p className={styles.lead}>Alimenta el mapa de liderazgos.</p>
      <div className={styles.actions}>
        <Link to="/captura/actores/nuevo" className={styles.btn}>
          + Nuevo actor
        </Link>
      </div>
      {loading ? (
        <StateBlock>Cargando…</StateBlock>
      ) : err ? (
        <p className={styles.err}>{err}</p>
      ) : (
        <div className={styles.list}>
          {items.map((a) => (
            <GlassCard key={a.slug}>
              <div className={styles.listRow}>
                <div>
                  <strong>{a.nombre}</strong>
                  <p className={styles.meta}>
                    {a.rol} · {a.colonia_nombre}
                  </p>
                </div>
                <div className={styles.actions}>
                  <Link to={`/captura/actores/${a.slug}`} className={styles.btnGhost}>
                    Editar
                  </Link>
                  <button
                    type="button"
                    className={styles.btnDanger}
                    onClick={() => remove(a.slug, a.nombre)}
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

export function CapturaActorFormPage() {
  const { slug } = useParams();
  const isNew = !slug || slug === "nuevo";
  const navigate = useNavigate();
  const [form, setForm] = useState<ActorWrite>(empty);
  const [colonias, setColonias] = useState<
    { slug: string; nombre: string; zona: string }[]
  >([]);
  const [temas, setTemas] = useState<{ slug: string; nombre: string }[]>([]);
  const [catalogos, setCatalogos] = useState<CatalogosConfig | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [rolTick, setRolTick] = useState(0);

  const veSensible = rolVeSensible();

  useEffect(() => onSaetoRolChange(() => setRolTick((n) => n + 1)), []);

  useEffect(() => {
    Promise.all([api.catalogoTerritorio(), api.catalogoTemas(), api.catalogosConfig()])
      .then(([t, temasData, cats]) => {
        setColonias(t.colonias_demo);
        setTemas(temasData.temas);
        setCatalogos(cats);
        if (isNew && t.colonias_demo[0]) {
          setForm((f) => ({
            ...f,
            colonia: t.colonias_demo[0].slug,
            zona: t.colonias_demo[0].zona,
          }));
        }
      })
      .catch((e: Error) => setErr(e.message));

    if (!isNew && slug) {
      api
        .actor(slug)
        .then((a) => {
          setForm({
            nombre: a.nombre,
            colonia: a.colonia,
            zona: a.zona,
            rol: a.rol,
            organizacion: a.organizacion,
            capacidad_estimada: a.capacidad_estimada ?? a.capacidad_movilizacion,
            capacidad_comprobada: a.capacidad_comprobada,
            fecha_comprobacion: a.fecha_comprobacion,
            metodo_comprobacion: a.metodo_comprobacion,
            tipo_actor: a.tipo_actor,
            reivindicaciones_abiertas: a.reivindicaciones_abiertas,
            estado_verificacion: a.estado_verificacion,
            notas_mesa: a.notas_mesa,
            interes_declarado: a.interes_declarado,
            interes_reservado: a.interes_reservado ?? "",
            recursos_poder: a.recursos_poder,
            notas_poder: a.notas_poder,
            slug: a.slug,
          });
        })
        .catch((e: Error) => setErr(e.message))
        .finally(() => setLoading(false));
    }
  }, [isNew, slug, rolTick]);

  const onColonia = (coloniaSlug: string) => {
    const c = colonias.find((x) => x.slug === coloniaSlug);
    setForm((f) => ({
      ...f,
      colonia: coloniaSlug,
      zona: c?.zona ?? f.zona,
    }));
  };

  const toggleTema = (tema: string) => {
    setForm((f) => {
      const has = f.reivindicaciones_abiertas.includes(tema);
      return {
        ...f,
        reivindicaciones_abiertas: has
          ? f.reivindicaciones_abiertas.filter((t) => t !== tema)
          : [...f.reivindicaciones_abiertas, tema],
      };
    });
  };

  const toggleRecurso = (recurso: string) => {
    setForm((f) => {
      const has = (f.recursos_poder ?? []).includes(recurso);
      return {
        ...f,
        recursos_poder: has
          ? (f.recursos_poder ?? []).filter((r) => r !== recurso)
          : [...(f.recursos_poder ?? []), recurso],
      };
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const payload: ActorWrite = {
      ...form,
      capacidad_movilizacion: form.capacidad_estimada,
    };
    if (payload.capacidad_comprobada != null) {
      if (!payload.fecha_comprobacion || !payload.metodo_comprobacion) {
        setErr("Si hay capacidad comprobada, indica fecha y método de comprobación.");
        return;
      }
    }
    try {
      if (isNew) {
        const created = await api.createActor(payload);
        setMsg("Actor creado.");
        navigate(`/captura/actores/${created.slug}`);
      } else if (slug) {
        await api.updateActor(slug, payload);
        setMsg("Actor actualizado. Ya alimenta la sala de situación.");
      }
    } catch (error) {
      setErr((error as Error).message);
    }
  };

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Cargando ficha…</StateBlock>
      </GlassPanel>
    );
  }

  const poder = catalogos?.poder;

  return (
    <GlassPanel strong>
      <BotonVolver to="/captura/actores" label="Volver a actores" />
      <h1>{isNew ? "Nuevo actor" : "Editar actor"}</h1>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label>Nombre</label>
          <input
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Colonia</label>
            <select
              required
              value={form.colonia}
              onChange={(e) => onColonia(e.target.value)}
            >
              {colonias.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Rol en mesa</label>
            <input
              required
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Tipo de actor</label>
            <select
              value={form.tipo_actor}
              onChange={(e) => setForm({ ...form, tipo_actor: e.target.value })}
            >
              {(poder?.tipos_actor ?? []).map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Organización</label>
            <input
              required
              value={form.organizacion}
              onChange={(e) => setForm({ ...form, organizacion: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label>Capacidad estimada</label>
            <input
              type="number"
              min={0}
              required
              value={form.capacidad_estimada ?? 0}
              onChange={(e) =>
                setForm({ ...form, capacidad_estimada: Number(e.target.value) })
              }
            />
          </div>
          <div className={styles.field}>
            <label>Capacidad comprobada (opcional)</label>
            <input
              type="number"
              min={0}
              value={form.capacidad_comprobada ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  capacidad_comprobada: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
        </div>
        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Fecha de comprobación</label>
            <input
              type="date"
              value={form.fecha_comprobacion ?? ""}
              onChange={(e) =>
                setForm({ ...form, fecha_comprobacion: e.target.value || null })
              }
            />
          </div>
          <div className={styles.field}>
            <label>Método de comprobación</label>
            <select
              value={form.metodo_comprobacion ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  metodo_comprobacion: e.target.value || null,
                })
              }
            >
              <option value="">—</option>
              {(poder?.metodos_comprobacion ?? []).map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Verificación</label>
            <select
              value={form.estado_verificacion}
              onChange={(e) =>
                setForm({
                  ...form,
                  estado_verificacion: e.target.value,
                })
              }
            >
              <option value="declarado">Declarado</option>
              <option value="corroborado_demo">Corroborado</option>
              <option value="corroborado">Corroborado</option>
              <option value="en_revision">En revisión</option>
            </select>
          </div>
        </div>

        <h2>Poder e intereses</h2>
        <div className={styles.field}>
          <label>Interés declarado</label>
          <textarea
            value={form.interes_declarado ?? ""}
            onChange={(e) => setForm({ ...form, interes_declarado: e.target.value })}
          />
        </div>
        {veSensible ? (
          <div className={styles.field}>
            <label>Interés reservado (solo rol sensible)</label>
            <textarea
              value={form.interes_reservado ?? ""}
              onChange={(e) => setForm({ ...form, interes_reservado: e.target.value })}
            />
          </div>
        ) : (
          <p className={styles.meta}>
            Interés reservado oculto — cambia el rol a Analista sensible o Admin para
            capturarlo.
          </p>
        )}
        <div className={styles.field}>
          <label>Recursos de poder</label>
          <div className={styles.checkGrid}>
            {(poder?.recursos ?? []).map((r) => {
              if (r.sensible && !veSensible) return null;
              return (
                <label key={r.slug} className={styles.checkItem}>
                  <input
                    type="checkbox"
                    checked={(form.recursos_poder ?? []).includes(r.slug)}
                    onChange={() => toggleRecurso(r.slug)}
                  />
                  {r.nombre}
                </label>
              );
            })}
          </div>
        </div>
        <div className={styles.field}>
          <label>Notas de poder</label>
          <textarea
            value={form.notas_poder ?? ""}
            onChange={(e) => setForm({ ...form, notas_poder: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label>Reivindicaciones abiertas</label>
          <div className={styles.checkGrid}>
            {temas.map((t) => (
              <label key={t.slug} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={form.reivindicaciones_abiertas.includes(t.slug)}
                  onChange={() => toggleTema(t.slug)}
                />
                {t.nombre}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.field}>
          <label>Notas para la mesa</label>
          <textarea
            value={form.notas_mesa}
            onChange={(e) => setForm({ ...form, notas_mesa: e.target.value })}
          />
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn}>
            Guardar
          </button>
          <Link to="/captura/actores" className={styles.btnGhost}>
            Cancelar
          </Link>
          <Link to="/" className={styles.btnGhost}>
            Ver sala
          </Link>
        </div>
      </form>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}
    </GlassPanel>
  );
}
