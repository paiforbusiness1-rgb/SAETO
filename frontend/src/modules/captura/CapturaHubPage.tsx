import { Link } from "react-router-dom";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import styles from "../../shared/ui/forms.module.css";

const items = [
  {
    to: "/captura/actores",
    title: "Actores",
    desc: "Alta, edición y baja de liderazgos",
  },
  {
    to: "/captura/reivindicaciones",
    title: "Reivindicaciones",
    desc: "Demandas, ciclo vital y evidencia",
  },
  {
    to: "/captura/coyuntura",
    title: "Coyuntura",
    desc: "Acciones, respuesta gubernamental y reacciones",
  },
  {
    to: "/captura/encuestas",
    title: "Encuestas",
    desc: "Tres plantillas; no crean reivindicaciones solas",
  },
  {
    to: "/captura/discurso",
    title: "Discurso",
    desc: "Rúbricas de mesa y niveles analíticos",
  },
  {
    to: "/captura/indicadores",
    title: "Indicadores INEGI",
    desc: "Contexto estadístico referencial por colonia",
  },
  {
    to: "/captura/brief",
    title: "Brief ejecutivo",
    desc: "Resumen, alertas y destacados de la sala",
  },
];

export function CapturaHubPage() {
  return (
    <GlassPanel strong>
      <BotonVolver />
      <h1>Captura y alimentación</h1>
      <p className={styles.lead}>
        Carga la información que alimenta la sala de situación. Los cambios se
        guardan en este equipo (archivos locales DEMO).
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
        ¿Falta un tema o colonia?{" "}
        <Link to="/catalogos">Configura catálogos primero →</Link>
      </p>
    </GlassPanel>
  );
}
