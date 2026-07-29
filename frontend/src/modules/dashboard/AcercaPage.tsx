import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";
import type { Health } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import styles from "./AcercaPage.module.css";

export function AcercaPage() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null));
  }, []);

  return (
    <GlassPanel strong>
      <BotonVolver />
      <h1>Acerca del prototipo SAETO</h1>
      <p className={styles.pitch}>
        No les traemos más información: les traemos una llave para consumir la que
        ya tienen — quién manda en el territorio, qué se les debe y qué está
        diciendo cada actor — para decidir con evidencia actualizada, no solo con
        experiencia de mesa.
      </p>
      <div className={styles.block}>
        <h2>Fase 0</h2>
        <p>
          Prototipo conceptual fullstack (API Python + sala de situación en
          React). Datos ficticios de demostración. Sin conexión a bases oficiales.
        </p>
      </div>
      {health ? (
        <p className={styles.disclaimer}>{health.disclaimer}</p>
      ) : (
        <p className={styles.disclaimer}>
          Prototipo DEMO — encienda el backend para ver el estado del servicio.
        </p>
      )}
    </GlassPanel>
  );
}
