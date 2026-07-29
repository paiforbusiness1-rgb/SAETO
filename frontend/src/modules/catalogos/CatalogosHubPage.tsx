import { Link } from "react-router-dom";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassCard } from "../../shared/ui/GlassCard";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import styles from "../../shared/ui/forms.module.css";

const items = [
  {
    to: "/catalogos/territorio",
    title: "Territorio",
    desc: "Zonas y colonias de la Zona Oriente",
  },
  {
    to: "/catalogos/temas",
    title: "Temas de reivindicación",
    desc: "Agua, basura, seguridad y más",
  },
  {
    to: "/catalogos/umbrales",
    title: "Umbrales de semáforo",
    desc: "Bandas verde / amarillo / rojo",
  },
  {
    to: "/catalogos/discurso",
    title: "Niveles de discurso",
    desc: "Los 7 niveles del análisis político",
  },
];

export function CatalogosHubPage() {
  return (
    <GlassPanel strong>
      <BotonVolver />
      <h1>Catálogos</h1>
      <p className={styles.lead}>
        Mantén aquí las tablas maestras. La captura de hechos usa estos listados.
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
        <Link to="/captura">Ir a Captura →</Link>
      </p>
    </GlassPanel>
  );
}
