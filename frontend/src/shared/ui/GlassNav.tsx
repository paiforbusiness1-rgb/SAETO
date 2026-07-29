import { NavLink } from "react-router-dom";
import styles from "./GlassNav.module.css";

const links = [
  { to: "/", label: "Sala de situación" },
  { to: "/reportes", label: "Reportes" },
  { to: "/observatorio", label: "Reivindicaciones" },
  { to: "/actores", label: "Actores" },
  { to: "/discurso", label: "Discurso" },
  { to: "/catalogos", label: "Catálogos" },
  { to: "/captura", label: "Captura" },
  { to: "/acerca", label: "Acerca" },
];

export function GlassNav() {
  return (
    <header className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.mark}>SAETO</span>
        <span className={styles.sub}>Zona Oriente · CDMX</span>
      </div>
      <nav className={styles.links} aria-label="Principal">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <span className={styles.badge}>DEMO</span>
    </header>
  );
}
