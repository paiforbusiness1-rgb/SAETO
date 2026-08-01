import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type EncuestaWrite } from "../../shared/api/client";
import type {
  EncuestaPlantilla,
  EncuestaPlantillaMeta,
  EncuestaPregunta,
  EncuestaSummary,
} from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../../shared/ui/forms.module.css";

export function CapturaEncuestasListPage() {
  const [items, setItems] = useState<EncuestaSummary[]>([]);
  const [plantillaFiltro, setPlantillaFiltro] = useState("");
  const [metas, setMetas] = useState<EncuestaPlantillaMeta[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.encuestas({ plantilla: plantillaFiltro || undefined }),
      api.encuestaPlantillas(),
    ])
      .then(([list, plants]) => {
        setItems(list);
        setMetas(plants);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [plantillaFiltro]);

  const remove = async (slugItem: string) => {
    if (!confirm("¿Eliminar esta respuesta de encuesta?")) return;
    try {
      await api.deleteEncuesta(slugItem);
      load();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <GlassPanel strong>
      <BotonVolver to="/captura" label="Volver a captura" />
      <h1>Captura de encuestas</h1>
      <p className={styles.lead}>
        Tres plantillas para evaluación: rápida de mesa, percepción ciudadana y
        diagnóstico de necesidades. Anonimizadas (sin nombre ni teléfono). Las
        respuestas de captura se guardan en runtime local.
      </p>
      <div className={styles.actions}>
        <Link to="/captura/encuestas/nueva" className={styles.btn}>
          + Nueva respuesta
        </Link>
      </div>
      <div className={styles.field}>
        <label htmlFor="filtro-plantilla">Plantilla</label>
        <select
          id="filtro-plantilla"
          value={plantillaFiltro}
          onChange={(e) => setPlantillaFiltro(e.target.value)}
        >
          <option value="">Todas</option>
          {metas.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.nombre}
            </option>
          ))}
        </select>
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
                  <strong>{e.colonia_nombre}</strong>
                  <p className={styles.meta}>
                    {e.fecha} · {e.zona_nombre} ·{" "}
                    {e.plantilla_nombre || e.plantilla}
                  </p>
                </div>
                <div className={styles.actions}>
                  <Link to={`/captura/encuestas/${e.slug}`} className={styles.btnGhost}>
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

function PreguntaField({
  p,
  plantilla,
  respuestas,
  setRespuestas,
  toggleMulti,
}: {
  p: EncuestaPregunta;
  plantilla: EncuestaPlantilla;
  respuestas: Record<string, string | string[] | number>;
  setRespuestas: (next: Record<string, string | string[] | number>) => void;
  toggleMulti: (pregSlug: string, opcion: string, max: number) => void;
}) {
  return (
    <div className={styles.field}>
      <label>
        {p.texto}
        {p.obligatoria ? " *" : ""}
      </label>
      {p.tipo === "opcion_unica" ? (
        <select
          required={!!p.obligatoria}
          value={String(respuestas[p.slug] ?? "")}
          onChange={(e) => setRespuestas({ ...respuestas, [p.slug]: e.target.value })}
        >
          <option value="">Seleccione…</option>
          {p.opciones.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.nombre}
            </option>
          ))}
        </select>
      ) : null}
      {p.tipo === "opcion_multiple" ? (
        <div className={styles.checkGrid}>
          {p.opciones.map((o) => {
            const selected = Array.isArray(respuestas[p.slug])
              ? (respuestas[p.slug] as string[]).includes(o.slug)
              : false;
            const max = p.max_selecciones ?? plantilla.max_problemas_prioridad ?? 3;
            return (
              <label key={o.slug} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleMulti(p.slug, o.slug, max)}
                />
                {o.nombre}
              </label>
            );
          })}
        </div>
      ) : null}
      {p.tipo === "numero" ? (
        <input
          type="number"
          required={!!p.obligatoria}
          value={respuestas[p.slug] === undefined ? "" : String(respuestas[p.slug])}
          onChange={(e) =>
            setRespuestas({
              ...respuestas,
              [p.slug]: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
        />
      ) : null}
      {p.tipo === "escala" ? (
        <div className={styles.checkGrid}>
          {(p.opciones.length
            ? p.opciones
            : Array.from({ length: (p.max ?? 10) - (p.min ?? 1) + 1 }, (_, i) => {
                const n = (p.min ?? 1) + i;
                return { slug: String(n), nombre: String(n) };
              })
          ).map((o) => {
            const checked = String(respuestas[p.slug] ?? "") === o.slug;
            return (
              <label key={o.slug} className={styles.checkItem}>
                <input
                  type="radio"
                  name={p.slug}
                  required={!!p.obligatoria}
                  checked={checked}
                  onChange={() =>
                    setRespuestas({ ...respuestas, [p.slug]: Number(o.slug) })
                  }
                />
                {o.nombre}
              </label>
            );
          })}
          {p.etiqueta_min || p.etiqueta_max ? (
            <p className={styles.meta}>
              {p.etiqueta_min ? `${p.min ?? 1}: ${p.etiqueta_min}` : ""}
              {p.etiqueta_min && p.etiqueta_max ? " · " : ""}
              {p.etiqueta_max ? `${p.max ?? 5}: ${p.etiqueta_max}` : ""}
            </p>
          ) : null}
        </div>
      ) : null}
      {p.tipo === "texto" ? (
        <textarea
          required={!!p.obligatoria}
          maxLength={p.max_chars ?? 1000}
          value={String(respuestas[p.slug] ?? "")}
          onChange={(e) => setRespuestas({ ...respuestas, [p.slug]: e.target.value })}
        />
      ) : null}
    </div>
  );
}

export function CapturaEncuestaFormPage() {
  const { slug } = useParams();
  const isNew = !slug || slug === "nueva";
  const navigate = useNavigate();
  const [metas, setMetas] = useState<EncuestaPlantillaMeta[]>([]);
  const [plantillaSlug, setPlantillaSlug] = useState("rapida_mesa");
  const [plantilla, setPlantilla] = useState<EncuestaPlantilla | null>(null);
  const [colonias, setColonias] = useState<
    { slug: string; nombre: string; zona: string }[]
  >([]);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [colonia, setColonia] = useState("");
  const [zona, setZona] = useState("");
  const [respuestas, setRespuestas] = useState<
    Record<string, string | string[] | number>
  >({});
  const [notas, setNotas] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [plants, terr] = await Promise.all([
          api.encuestaPlantillas(),
          api.catalogoTerritorio(),
        ]);
        if (cancelled) return;
        setMetas(plants);
        setColonias(terr.colonias_demo);
        if (isNew && terr.colonias_demo[0]) {
          setColonia(terr.colonias_demo[0].slug);
          setZona(terr.colonias_demo[0].zona);
        }
        if (!isNew && slug) {
          const e = await api.encuesta(slug);
          if (cancelled) return;
          setFecha(e.fecha);
          setColonia(e.colonia);
          setZona(e.zona);
          setRespuestas(e.respuestas);
          setNotas(e.notas_mesa);
          setPlantillaSlug(e.plantilla);
          setPlantilla(e.plantilla_meta);
        } else {
          const initial = plants[0]?.slug || "rapida_mesa";
          setPlantillaSlug(initial);
          const full = await api.encuestaPlantilla(initial);
          if (!cancelled) setPlantilla(full);
        }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, slug]);

  useEffect(() => {
    if (!isNew || loading) return;
    let cancelled = false;
    (async () => {
      try {
        const full = await api.encuestaPlantilla(plantillaSlug);
        if (!cancelled) setPlantilla(full);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plantillaSlug, isNew, loading]);

  const onColonia = (slugCol: string) => {
    const c = colonias.find((x) => x.slug === slugCol);
    setColonia(slugCol);
    setZona(c?.zona ?? zona);
  };

  const toggleMulti = (pregSlug: string, opcion: string, max: number) => {
    setRespuestas((prev) => {
      const cur = Array.isArray(prev[pregSlug]) ? [...(prev[pregSlug] as string[])] : [];
      const has = cur.includes(opcion);
      let next = has ? cur.filter((x) => x !== opcion) : [...cur, opcion];
      if (next.length > max) next = next.slice(0, max);
      return { ...prev, [pregSlug]: next };
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    const body: EncuestaWrite = {
      fecha,
      colonia,
      zona,
      respuestas,
      notas_mesa: notas,
      plantilla: plantillaSlug,
      slug: isNew ? null : slug,
    };
    try {
      if (isNew) {
        const created = await api.createEncuesta(body);
        setMsg("Respuesta guardada.");
        navigate(`/captura/encuestas/${created.slug}`);
      } else if (slug) {
        await api.updateEncuesta(slug, body);
        setMsg("Respuesta actualizada.");
      }
    } catch (error) {
      setErr((error as Error).message);
    }
  };

  const bloques = useMemo(() => {
    if (!plantilla) return [];
    const ordered = [...plantilla.preguntas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    const map = new Map<string, EncuestaPregunta[]>();
    for (const p of ordered) {
      const key = p.bloque || "general";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    const labels = new Map(
      (plantilla.bloques || []).map((b) => [b.slug, b.nombre] as const),
    );
    return [...map.entries()].map(([slugB, pregs]) => ({
      slug: slugB,
      nombre: labels.get(slugB) || slugB,
      preguntas: pregs,
    }));
  }, [plantilla]);

  if (loading || !plantilla) {
    return (
      <GlassPanel>
        <StateBlock>{err || "Cargando plantilla…"}</StateBlock>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel strong>
      <BotonVolver to="/captura/encuestas" label="Volver a encuestas" />
      <h1>{isNew ? "Nueva respuesta de encuesta" : "Editar respuesta"}</h1>
      <p className={styles.lead}>{plantilla.disclaimer}</p>

      <form className={styles.form} onSubmit={onSubmit}>
        {isNew ? (
          <div className={styles.field}>
            <label>Plantilla *</label>
            <select
              required
              value={plantillaSlug}
              onChange={(e) => {
                setPlantillaSlug(e.target.value);
                setRespuestas({});
                setPlantilla(null);
              }}
            >
              {metas.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.nombre}
                  {m.preguntas_count ? ` (${m.preguntas_count} preguntas)` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className={styles.meta}>Plantilla: {plantilla.nombre || plantillaSlug}</p>
        )}

        <div className={styles.row2}>
          <div className={styles.field}>
            <label>Fecha</label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Colonia / comunidad</label>
            <select required value={colonia} onChange={(e) => onColonia(e.target.value)}>
              {colonias.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {bloques.map((b) => (
          <section key={b.slug}>
            <h2 className={styles.meta}>{b.nombre}</h2>
            {b.preguntas.map((p) => (
              <PreguntaField
                key={p.slug}
                p={p}
                plantilla={plantilla}
                respuestas={respuestas}
                setRespuestas={setRespuestas}
                toggleMulti={toggleMulti}
              />
            ))}
          </section>
        ))}

        <div className={styles.field}>
          <label>Notas de mesa (opcional)</label>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.btn} disabled={!plantilla}>
            Guardar
          </button>
          <Link to="/captura/encuestas" className={styles.btnGhost}>
            Cancelar
          </Link>
          <Link to="/encuestas" className={styles.btnGhost}>
            Ver listado
          </Link>
        </div>
      </form>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}
    </GlassPanel>
  );
}
