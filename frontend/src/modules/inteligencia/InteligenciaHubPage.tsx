import { Link } from "react-router-dom";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import styles from "./InteligenciaPages.module.css";

const items = [
  {
    to: "/consumibles",
    title: "Consumibles",
    desc: "Mapa + gráfica + cruce electoral — outputs tipo presentación",
  },
  {
    to: "/inteligencia/calor",
    title: "Mapa de calor",
    desc: "Capas territoriales y bandas de intensidad",
  },
  {
    to: "/inteligencia/panorama",
    title: "Panorama situacional",
    desc: "Lectura unificada por alcaldía o colonia",
  },
  {
    to: "/inteligencia/corredores",
    title: "Corredores críticos",
    desc: "Ejes y tramos bajo presión",
  },
  {
    to: "/inteligencia/cobertura",
    title: "Cobertura de mesa",
    desc: "Priorización analítica (no patrullaje)",
  },
  {
    to: "/inteligencia/sala",
    title: "Sala operativa",
    desc: "Registro · Análisis · Reporte · Priorización",
  },
  {
    to: "/inteligencia/ia-clasificar",
    title: "IA · Clasificar texto",
    desc: "Groq sugiere tema, fase y sentido desde texto público",
  },
];

export function InteligenciaHubPage() {
  return (
    <GlassPanel strong>
      <BotonVolver to="/" />
      <h1>Inteligencia territorial</h1>
      <p className={styles.lead}>
        Máquina de lectura Oriente: calor, panorama, corredores y cobertura de
        mesa. Los hechos viven en Observatorio, Actores, Coyuntura y Encuestas;
        aquí solo se componen.
      </p>
      <div className={styles.hub}>
        {items.map((item) => (
          <GlassCard key={item.to} to={item.to}>
            <strong>{item.title}</strong>
            <p className={styles.meta}>{item.desc}</p>
          </GlassCard>
        ))}
      </div>
      <p className={styles.meta} style={{ marginTop: "1rem" }}>
        <Link to="/">Volver a la sala de situación</Link>
      </p>
    </GlassPanel>
  );
}
