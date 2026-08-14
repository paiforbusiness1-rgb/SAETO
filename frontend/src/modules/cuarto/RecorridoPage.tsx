import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { CasoSituacion, PasoCuarto } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./CuartoPages.module.css";
import { DescargarDiagnostico } from "./DescargarDiagnostico";
import { PasoContexto } from "./pasos/PasoContexto";
import { PasoCortes } from "./pasos/PasoCortes";
import { PasoDecision } from "./pasos/PasoDecision";
import { PasoImpacto } from "./pasos/PasoImpacto";
import { PasoInstalaciones } from "./pasos/PasoInstalaciones";
import { PasoMapa } from "./pasos/PasoMapa";
import { PasoProblema } from "./pasos/PasoProblema";
import { PasoTimeline } from "./pasos/PasoTimeline";

function renderPaso(vista: string, caso: CasoSituacion) {
  switch (vista) {
    case "problema":
      return <PasoProblema caso={caso} />;
    case "mapa":
      return <PasoMapa caso={caso} />;
    case "impacto":
      return <PasoImpacto caso={caso} />;
    case "instalaciones":
      return <PasoInstalaciones caso={caso} />;
    case "timeline":
      return <PasoTimeline caso={caso} />;
    case "cortes":
      return <PasoCortes caso={caso} />;
    case "contexto":
      return <PasoContexto caso={caso} />;
    case "recomendaciones":
      return <PasoDecision caso={caso} />;
    default:
      return <PasoProblema caso={caso} />;
  }
}

export function RecorridoPage() {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const [caso, setCaso] = useState<CasoSituacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .cuartoCaso(slug)
      .then(setCaso)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const pasos = caso?.pasos ?? [];
  const pasoActual: PasoCuarto | undefined = useMemo(() => {
    if (!pasos.length) return undefined;
    const q = params.get("paso");
    return pasos.find((p) => p.slug === q) || pasos[0];
  }, [pasos, params]);

  const idx = pasoActual ? pasos.findIndex((p) => p.slug === pasoActual.slug) : 0;
  const prev = idx > 0 ? pasos[idx - 1] : null;
  const next = idx >= 0 && idx < pasos.length - 1 ? pasos[idx + 1] : null;

  const ir = (p: PasoCuarto) => {
    setParams({ paso: p.slug });
  };

  if (loading && !caso) {
    return (
      <GlassPanel>
        <StateBlock>Armando el recorrido…</StateBlock>
      </GlassPanel>
    );
  }

  if (error || !caso || !pasoActual) {
    return (
      <GlassPanel>
        <BotonVolver to="/cuarto" label="Volver al cuarto" />
        <StateBlock actionLabel="Reintentar" onAction={load}>
          {error ?? "No se encontró el caso."}
        </StateBlock>
      </GlassPanel>
    );
  }

  return (
    <div className={styles.layout}>
      <GlassPanel strong>
        <BotonVolver to="/cuarto" label="Volver al cuarto" />
        <p className={styles.kicker}>
          Paso {pasoActual.orden} de {pasos.length} · {caso.tema_nombre}
        </p>
        <h1>{caso.nombre}</h1>
        <p className={styles.lead}>{caso.subtitulo || caso.resumen}</p>
        <nav className={styles.progress} aria-label="Pasos del recorrido">
          {pasos.map((p) => (
            <button
              key={p.slug}
              type="button"
              className={p.slug === pasoActual.slug ? styles.progressCurrent : undefined}
              onClick={() => ir(p)}
            >
              {p.orden}. {p.titulo}
            </button>
          ))}
        </nav>
        <div className={styles.navRow}>
          <button type="button" onClick={load}>
            Recalcular
          </button>
          <DescargarDiagnostico slug={caso.slug} nombre={caso.nombre} />
          <button type="button" disabled={!prev} onClick={() => prev && ir(prev)}>
            Anterior
          </button>
          {next ? (
            <button type="button" className={styles.primary} onClick={() => ir(next)}>
              Siguiente · {next.titulo}
            </button>
          ) : (
            <Link className={styles.primary} to="/cuarto">
              Cerrar recorrido
            </Link>
          )}
        </div>
      </GlassPanel>

      <GlassPanel>{renderPaso(pasoActual.vista, caso)}</GlassPanel>

      <GlassPanel>
        <div className={styles.navRow}>
          <button type="button" disabled={!prev} onClick={() => prev && ir(prev)}>
            Anterior
          </button>
          {next ? (
            <button type="button" className={styles.primary} onClick={() => ir(next)}>
              Siguiente · {next.titulo}
            </button>
          ) : (
            <Link className={styles.primary} to="/cuarto">
              Cerrar recorrido
            </Link>
          )}
          <Link to="/cuarto">Volver al cuarto</Link>
        </div>
      </GlassPanel>
    </div>
  );
}
