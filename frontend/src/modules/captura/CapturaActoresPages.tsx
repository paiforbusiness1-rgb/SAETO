import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type ActorWrite } from "../../shared/api/client";
import type { ActorSummary } from "../../shared/api/types";
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
  capacidad_movilizacion: 0,
  reivindicaciones_abiertas: [],
  estado_verificacion: "declarado",
  notas_mesa: "",
};

export function CapturaActoresListPage() {
  const [items, setItems] = useState<ActorSummary[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

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
  }, []);

  const remove = async (slug: string) => {
    if (!confirm(`¿Eliminar actor ${slug}?`)) return;
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
                    onClick={() => remove(a.slug)}
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
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    Promise.all([api.catalogoTerritorio(), api.catalogoTemas()])
      .then(([t, temasData]) => {
        setColonias(t.colonias_demo);
        setTemas(temasData.temas);
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
            capacidad_movilizacion: a.capacidad_movilizacion,
            reivindicaciones_abiertas: a.reivindicaciones_abiertas,
            estado_verificacion: a.estado_verificacion,
            notas_mesa: a.notas_mesa,
            slug: a.slug,
          });
        })
        .catch((e: Error) => setErr(e.message))
        .finally(() => setLoading(false));
    }
  }, [isNew, slug]);

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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      if (isNew) {
        const created = await api.createActor(form);
        setMsg("Actor creado.");
        navigate(`/captura/actores/${created.slug}`);
      } else if (slug) {
        await api.updateActor(slug, form);
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
            <label>Rol</label>
            <input
              required
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
            />
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
            <label>Capacidad de movilización</label>
            <input
              type="number"
              min={0}
              required
              value={form.capacidad_movilizacion}
              onChange={(e) =>
                setForm({ ...form, capacidad_movilizacion: Number(e.target.value) })
              }
            />
          </div>
          <div className={styles.field}>
            <label>Verificación</label>
            <select
              value={form.estado_verificacion}
              onChange={(e) =>
                setForm({
                  ...form,
                  estado_verificacion: e.target.value as ActorWrite["estado_verificacion"],
                })
              }
            >
              <option value="declarado">declarado</option>
              <option value="corroborado_demo">corroborado_demo</option>
            </select>
          </div>
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
