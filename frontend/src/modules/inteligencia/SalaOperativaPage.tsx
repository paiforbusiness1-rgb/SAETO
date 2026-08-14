import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getSaetoRol } from "../../shared/api/client";
import type { EvaluacionMesa, SalaOperativa } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import { IaPanel } from "../ia/IaPanel";
import styles from "./InteligenciaPages.module.css";

export function SalaOperativaPage() {
  const [sala, setSala] = useState<SalaOperativa | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ventana, setVentana] = useState("diaria");
  const [notas, setNotas] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .inteligenciaSala()
      .then((data) => {
        setSala(data);
        const first = data.ritmo?.ventanas?.[0]?.slug;
        if (first) setVentana(first);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleCheck = (slug: string) => {
    setChecklist((prev) =>
      prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug],
    );
  };

  const guardarEval = async () => {
    setMsg(null);
    try {
      await api.createEvaluacionMesa({
        ventana,
        notas,
        checklist_ok: checklist,
        focos_revisados: (sala?.analisis.top_calor || [])
          .slice(0, 3)
          .map((c) => c.colonia_nombre || c.zona_nombre)
          .filter(Boolean),
      });
      setNotas("");
      setChecklist([]);
      setMsg("Evaluación de mesa registrada.");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  if (loading && !sala) {
    return (
      <GlassPanel>
        <StateBlock>Abriendo sala operativa…</StateBlock>
      </GlassPanel>
    );
  }

  if (error || !sala) {
    return (
      <GlassPanel>
        <StateBlock actionLabel="Reintentar" onAction={load}>
          {error ?? "Sin datos"}
        </StateBlock>
      </GlassPanel>
    );
  }

  const panels = [
    sala.registro,
    sala.analisis,
    sala.reporteador,
    sala.priorizacion,
  ];

  return (
    <div className={styles.layout}>
      <GlassPanel strong>
        <BotonVolver to="/inteligencia" />
        <h1>Sala operativa</h1>
        <p className={styles.lead}>{sala.resumen}</p>
        <p className={styles.meta}>Rol actual: {getSaetoRol()}</p>
        <div className={styles.actions}>
          <button type="button" onClick={load}>
            Recalcular
          </button>
          <Link className={styles.panelLink} to="/">
            Brief Capa 1
          </Link>
        </div>
        <IaPanel
          title="Lectura IA de sala (panorama Oriente)"
          disclaimer="Genera narrativa de mesa con hechos del panorama compuesto."
          onGenerate={async () => {
            const res = await api.iaPanoramaLectura({});
            return `${res.lectura}\n\n— modelo ${res.modelo}\n${res.disclaimer}`;
          }}
        />
      </GlassPanel>

      <div className={styles.panels}>
        {panels.map((p) => (
          <GlassPanel key={p.titulo}>
            <h2>{p.titulo}</h2>
            <p className={styles.meta}>{p.descripcion}</p>
            <div className={styles.actions} style={{ marginTop: "0.75rem" }}>
              {(p.accesos || []).map((a) => (
                <Link key={a.to} className={styles.panelLink} to={a.to}>
                  {a.label}
                </Link>
              ))}
            </div>
            {p.titulo === "Análisis" && sala.analisis.top_calor?.length ? (
              <ul className={styles.panelList}>
                {sala.analisis.top_calor.slice(0, 3).map((c) => (
                  <li key={c.colonia_slug || c.zona_slug}>
                    {c.colonia_nombre} · {c.banda_nombre} ({c.score})
                  </li>
                ))}
              </ul>
            ) : null}
            {p.titulo === "Priorización" && sala.priorizacion.sectores?.length ? (
              <ul className={styles.panelList}>
                {sala.priorizacion.sectores.slice(0, 3).map((s) => (
                  <li key={s.sector_slug}>
                    P{s.prioridad} {s.sector_nombre}: {s.recomendacion_nombre}
                  </li>
                ))}
              </ul>
            ) : null}
          </GlassPanel>
        ))}
      </div>

      <GlassPanel>
        <h2>Ritmo de mesa</h2>
        <div className={styles.formGrid}>
          <label>
            Ventana
            <select value={ventana} onChange={(e) => setVentana(e.target.value)}>
              {(sala.ritmo.ventanas || []).map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.checkList}>
            {(sala.ritmo.checklist || []).map((c) => (
              <label key={c.slug}>
                <input
                  type="checkbox"
                  checked={checklist.includes(c.slug)}
                  onChange={() => toggleCheck(c.slug)}
                />{" "}
                {c.nombre}
              </label>
            ))}
          </div>
          <label>
            Notas
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} />
          </label>
          <div className={styles.actions}>
            <button type="button" onClick={guardarEval}>
              Guardar evaluación
            </button>
          </div>
          {msg ? <p className={styles.meta}>{msg}</p> : null}
        </div>
        <h3 style={{ marginTop: "1.25rem" }}>Evaluaciones recientes</h3>
        {sala.evaluaciones_recientes.length === 0 ? (
          <p className={styles.empty}>Aún no hay evaluaciones registradas.</p>
        ) : (
          <div className={styles.stack}>
            {sala.evaluaciones_recientes.map((e: EvaluacionMesa) => (
              <GlassCard key={e.slug}>
                <strong>
                  {e.ventana} · {e.fecha.slice(0, 16)}
                </strong>
                <p className={styles.meta}>
                  Rol {e.rol}
                  {e.notas ? ` — ${e.notas}` : ""}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
