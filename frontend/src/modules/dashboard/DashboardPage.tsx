import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { Brief } from "../../shared/api/types";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { SemaforoPill } from "../../shared/ui/SemaforoPill";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const [data, setData] = useState<Brief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .brief()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Cargando sala de situación…</StateBlock>
      </GlassPanel>
    );
  }

  if (error || !data) {
    return (
      <GlassPanel>
        <StateBlock actionLabel="Reintentar" onAction={load}>
          {error ?? "Sin datos"}
        </StateBlock>
      </GlassPanel>
    );
  }

  return (
    <div className={styles.layout}>
      <GlassPanel strong className={styles.hero}>
        <p className={styles.kicker}>Capa 1 · Brief ejecutivo</p>
        <h1>SAETO</h1>
        <p className={styles.acronym} aria-label="Significado del acrónimo SAETO">
          <span>S</span>istema de <span>A</span>nálisis <span>E</span>stratégico{" "}
          <span>T</span>erritorial <span>O</span>riente
        </p>
        <p className={styles.lead}>{data.resumen_ejecutivo}</p>
        <div className={styles.counts}>
          <span>
            Rojo <strong>{data.conteo_semaforo.rojo ?? 0}</strong>
          </span>
          <span>
            Amarillo <strong>{data.conteo_semaforo.amarillo ?? 0}</strong>
          </span>
          <span>
            Verde <strong>{data.conteo_semaforo.verde ?? 0}</strong>
          </span>
        </div>
      </GlassPanel>

      <div className={styles.grid}>
        <GlassPanel>
          <div className={styles.sectionHead}>
            <h2>Reivindicaciones prioritarias</h2>
            <Link to="/observatorio" className={styles.more}>
              Ver todas
            </Link>
          </div>
          <div className={styles.stack}>
            {data.reivindicaciones_top.map((r) => (
              <GlassCard key={r.slug} to={`/observatorio/${r.slug}`}>
                <div className={styles.row}>
                  <div>
                    <strong>{r.tema_nombre}</strong>
                    <p className={styles.meta}>
                      {r.territorio_nombre} · {r.zona_nombre}
                    </p>
                  </div>
                  <SemaforoPill value={r.semaforo} label={r.semaforo_etiqueta} />
                </div>
              </GlassCard>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className={styles.sectionHead}>
            <h2>Actores clave</h2>
            <Link to="/actores" className={styles.more}>
              Ver mapa
            </Link>
          </div>
          <div className={styles.stack}>
            {data.actores_clave.map((a) => (
              <GlassCard key={a.slug} to={`/actores/${a.slug}`}>
                <strong>{a.nombre}</strong>
                <p className={styles.meta}>
                  {a.rol} · {a.colonia_nombre}
                </p>
                <p className={styles.meta}>
                  Movilización estimada: {a.capacidad_movilizacion}
                </p>
              </GlassCard>
            ))}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel>
        <h2>Alertas de coyuntura</h2>
        <ul className={styles.alerts}>
          {data.alertas_coyuntura.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  );
}
