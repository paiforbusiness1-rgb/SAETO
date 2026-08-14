import { useMemo } from "react";
import type { CasoSituacion } from "../../../shared/api/types";
import { MapaCalorTerritorial } from "../../inteligencia/MapaCalorTerritorial";
import { HBarChart } from "../../reportes/charts";
import { toCeldaCalor } from "../toCeldaCalor";
import styles from "../CuartoPages.module.css";

export function PasoMapa({ caso }: { caso: CasoSituacion }) {
  const celdasMapa = useMemo(
    () => (caso.celdas || []).filter((c) => c.colonia_slug).map(toCeldaCalor),
    [caso.celdas],
  );
  const zonasMapa = useMemo(
    () => (caso.por_zona || []).map(toCeldaCalor),
    [caso.por_zona],
  );

  return (
    <div>
      <h2>Dónde está</h2>
      <p className={styles.lead}>
        Calor de {caso.tema_nombre.toLowerCase()} en las colonias del caso. El
        mapa habla antes que el expediente.
      </p>
      <div className={styles.grid2}>
        <MapaCalorTerritorial celdas={celdasMapa} porZona={zonasMapa} />
        <div>
          <h3>Por alcaldía</h3>
          {caso.barras_zona.length ? (
            <HBarChart
              items={caso.barras_zona.map((b) => ({
                label: b.label,
                value: b.value,
                tone: (b.tone as "rojo" | "amarillo" | "verde" | "accent") || "accent",
              }))}
            />
          ) : (
            <p className={styles.empty}>Sin celdas de calor para este tema.</p>
          )}
        </div>
      </div>
    </div>
  );
}
