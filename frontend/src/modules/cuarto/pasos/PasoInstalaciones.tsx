import { Link } from "react-router-dom";
import { useMemo } from "react";
import type { CasoSituacion } from "../../../shared/api/types";
import { MapaCalorTerritorial } from "../../inteligencia/MapaCalorTerritorial";
import { toCeldaCalor } from "../toCeldaCalor";
import styles from "../CuartoPages.module.css";

export function PasoInstalaciones({ caso }: { caso: CasoSituacion }) {
  const celdasMapa = useMemo(
    () => (caso.celdas || []).filter((c) => c.colonia_slug).map(toCeldaCalor),
    [caso.celdas],
  );
  const zonasMapa = useMemo(
    () => (caso.por_zona || []).map(toCeldaCalor),
    [caso.por_zona],
  );
  const marcadores = useMemo(
    () =>
      caso.instalaciones.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        nombre: p.nombre,
        nota: `${p.tipo_nombre} · ${p.estado_nombre}`,
      })),
    [caso.instalaciones],
  );

  if (!caso.instalaciones.length) {
    return (
      <div>
        <h2>Instalaciones</h2>
        <p className={styles.empty}>
          Este tema no tiene puntos de infraestructura cargados. Puede saltar el
          paso y seguir el recorrido, o registrar más adelante desde Captura.
        </p>
        <p className={styles.meta}>
          <Link to="/captura">Ir a captura</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Instalaciones</h2>
      <p className={styles.lead}>
        Puntos de {caso.tema_nombre.toLowerCase()} en el recorte. Los marcadores
        dorados son infraestructura; el calor sigue siendo el problema.
      </p>
      <div className={styles.grid2}>
        <MapaCalorTerritorial
          celdas={celdasMapa}
          porZona={zonasMapa}
          marcadores={marcadores}
        />
        <div>
          {caso.instalaciones.map((p) => (
            <div key={`${p.nombre}-${p.lat}`} className={styles.instalacion}>
              <strong>{p.nombre}</strong>
              <p className={styles.meta}>
                {p.tipo_nombre} · {p.colonia_nombre} · {p.estado_nombre}
              </p>
              {p.nota ? <p className={styles.meta}>{p.nota}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
