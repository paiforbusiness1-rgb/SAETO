import { useEffect, useId, useState } from "react";
import { NavLink } from "react-router-dom";
import { getSaetoRol, setSaetoRol } from "../api/client";
import type { SaetoRol } from "../api/types";
import styles from "./GlassNav.module.css";

const links = [
  { to: "/", label: "Sala de situación" },
  { to: "/inteligencia", label: "Inteligencia" },
  { to: "/reportes", label: "Reportes" },
  { to: "/observatorio", label: "Reivindicaciones" },
  { to: "/coyuntura", label: "Coyuntura" },
  { to: "/encuestas", label: "Encuestas" },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setRol(getSaetoRol());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const onRolChange = (next: SaetoRol) => {
    setSaetoRol(next);
    setRol(next);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={styles.nav}>
      <div className={styles.topRow}>
        <div className={styles.brand}>
          <span className={styles.mark}>SAETO</span>
          <span className={styles.sub}>Zona Oriente · CDMX</span>
        </div>

        <div className={styles.topActions}>
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
          <button
            type="button"
            className={styles.menuBtn}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? "Cerrar" : "Menú"}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Cerrar menú"
          onClick={closeMenu}
        />
      ) : null}

      <nav
        id={menuId}
        className={`${styles.links} ${menuOpen ? styles.linksOpen : ""}`}
        aria-label="Principal"
      >
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            onClick={closeMenu}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
