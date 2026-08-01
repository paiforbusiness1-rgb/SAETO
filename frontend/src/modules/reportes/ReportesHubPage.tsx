import { Link } from "react-router-dom";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import styles from "./reportes.module.css";

const items = [
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
    to: "/reportes/actores",
    title: "Mapa de poder",
    desc: "Movilización estimada vs comprobada por liderazgo",
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
    desc: "Indicadores referenciales por territorio (con disclaimer)",
  },
  {
    to: "/reportes/deudas",
    title: "Cuentas pendientes",
    desc: "Deudas históricas a cerrar antes de la coyuntura",
  },
];

export function ReportesHubPage() {
  return (
    <GlassPanel strong>
      <BotonVolver />
      <h1>Reportes visuales</h1>
      <p className={styles.lead}>
        Lectura gerencial a golpe de vista para la mesa de decisión. Los datos
        salen de lo cargado en Captura y Catálogos.
      </p>
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
  );
}
