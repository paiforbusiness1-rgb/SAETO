import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { CasoIndice } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { DescargarDiagnostico } from "../cuarto/DescargarDiagnostico";
import styles from "./reportes.module.css";

const items = [
  {
    to: "/consumibles",
    title: "Consumibles",
    desc: "Mapa, gráfica y cruce electoral × problema — formato presentación",
  },
  {
    to: "/reportes/ejecutivo",
    title: "Tablero ejecutivo",
    desc: "Semáforo global, presión por tema y focos prioritarios",
  },
  {
    to: "/reportes/ciclo-vital",
    title: "Ciclo vital",
    desc: "Fases, sentido y demandas que escalan",
  },
  {
    to: "/reportes/territorio",
    title: "Calor territorial",
    desc: "Qué zona y colonia concentran la presión",
  },
  {
    to: "/reportes/calor",
    title: "Mapa de calor (P3)",
    desc: "Bandas y top focos por capa de inteligencia",
  },
  {
    to: "/reportes/corredores",
    title: "Corredores críticos",
    desc: "Ejes bajo presión de eventos y demandas",
  },
  {
    to: "/reportes/actores",
    title: "Mapa de poder",
    desc: "Ranking de movilización (no GIS) — estimada vs comprobada",
  },
  {
    to: "/reportes/coyuntura",
    title: "Bitácora coyuntura",
    desc: "Acciones, respuestas gubernamentales y reacciones",
  },
  {
    to: "/reportes/discurso-mesa",
    title: "Discurso de mesa",
    desc: "Narrativas, emociones e ideología agregadas",
  },
  {
    to: "/reportes/contexto-inegi",
    title: "Contexto INEGI",
    desc: "Triplete colonia: demanda + indicador + encuesta (lectura de mesa)",
  },
  {
    to: "/reportes/encuestas",
    title: "Encuestas",
    desc: "Percepción local; no crea reivindicaciones solas",
  },
  {
    to: "/reportes/deudas",
    title: "Cuentas pendientes",
    desc: "Deudas históricas a cerrar antes de la coyuntura",
  },
];

export function ReportesHubPage() {
  const [casos, setCasos] = useState<CasoIndice[]>([]);

  useEffect(() => {
    api.cuartoCasos().then(setCasos).catch(() => setCasos([]));
  }, []);

  return (
    <div className={styles.stack}>
      <GlassPanel strong>
        <BotonVolver />
        <h1>Reportes visuales</h1>
        <p className={styles.lead}>
          Lectura gerencial a golpe de vista para la mesa de decisión. Los datos
          salen de lo cargado en Captura y Catálogos.
        </p>
      </GlassPanel>

      {casos.length ? (
        <GlassPanel>
          <h2 className={styles.sectionTitle}>Diagnóstico de caso (PDF)</h2>
          <p className={styles.lead}>
            Un archivo por caso: panorama, intensidad, impacto, cruce electoral,
            hechos y recomendaciones. Elija el recorte y descargue.
          </p>
          <div className={styles.hub}>
            {casos.map((c) => (
              <div key={c.slug}>
                <p>
                  <strong>{c.nombre}</strong>
                </p>
                <p className={styles.meta}>{c.tema_nombre}</p>
                <p style={{ marginTop: "0.6rem" }}>
                  <DescargarDiagnostico slug={c.slug} nombre={c.nombre} />
                </p>
                <p className={styles.meta} style={{ marginTop: "0.45rem" }}>
                  <Link to={`/cuarto/${c.slug}`}>Recorrer en el cuarto</Link>
                </p>
              </div>
            ))}
          </div>
        </GlassPanel>
      ) : null}

      <GlassPanel>
        <h2 className={styles.sectionTitle}>Tableros en pantalla</h2>
        <div className={styles.hub}>
          {items.map((item) => (
            <GlassCard key={item.to} to={item.to}>
              <strong>{item.title}</strong>
              <p className={styles.meta}>{item.desc}</p>
            </GlassCard>
          ))}
        </div>
        <p className={styles.meta} style={{ marginTop: "1.25rem" }}>
          <Link to="/">Volver a la sala de situación</Link>
        </p>
      </GlassPanel>
    </div>
  );
}
