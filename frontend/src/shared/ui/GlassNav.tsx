import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { getSaetoRol, setSaetoRol } from "../api/client";
import type { SaetoRol } from "../api/types";
import styles from "./GlassNav.module.css";

const links = [
  { to: "/", label: "Sala de situación" },
  { to: "/reportes", label: "Reportes" },
  { to: "/observatorio", label: "Reivindicaciones" },
  { to: "/coyuntura", label: "Coyuntura" },
  { to: "/actores", label: "Actores" },
  { to: "/discurso", label: "Discurso" },
  { to: "/catalogos", label: "Catálogos" },
  { to: "/captura", label: "Captura" },
  { to: "/acerca", label: "Acerca" },
];

const ROLES: { value: SaetoRol; label: string }[] = [
  { value: "lector", label: "Lector" },
  { value: "capturista", label: "Capturista" },
  { value: "analista", label: "Analista" },
  { value: "analista_sensible", label: "Analista sensible" },
  { value: "admin", label: "Admin" },
];

export function GlassNav() {
  const [rol, setRol] = useState<SaetoRol>(getSaetoRol);

  useEffect(() => {
    setRol(getSaetoRol());
  }, []);

  const onRolChange = (next: SaetoRol) => {
    setSaetoRol(next);
    setRol(next);
  };

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
      <div className={styles.rolWrap}>
        <label className={styles.rolLabel} htmlFor="saeto-rol">
          Rol demo
        </label>
        <select
          id="saeto-rol"
          className={styles.rolSelect}
          value={rol}
          onChange={(e) => onRolChange(e.target.value as SaetoRol)}
          title="Control de acceso demo para campos sensibles"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <span className={styles.badge}>DEMO</span>
    </header>
  );
}
