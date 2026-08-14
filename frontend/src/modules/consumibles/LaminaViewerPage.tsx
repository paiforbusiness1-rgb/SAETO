import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { CeldaCalor, CeldaConsumible, LaminaConsumible } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import { HBarChart } from "../reportes/charts";
import { MapaCalorTerritorial } from "../inteligencia/MapaCalorTerritorial";
import styles from "./ConsumiblesPages.module.css";

function toCeldaCalor(c: CeldaConsumible): CeldaCalor {
  return {
    colonia_slug: c.colonia_slug || null,
    colonia_nombre: c.colonia_nombre || c.zona_nombre,
    zona_slug: c.zona_slug,
    zona_nombre: c.zona_nombre,
    capa: "consumible",
    score: c.score,
    banda: c.banda_slug,
    banda_nombre: c.banda_nombre,
    color: c.color,
    desglose: {},
  };
}

function SerieMini({ serie }: { serie: { mes: string; valor: number }[] }) {
  const peak = Math.max(...serie.map((s) => s.valor), 1);
  return (
    <div className={styles.serie} role="img" aria-label="Tendencia mensual">
      {serie.map((s) => (
        <div key={s.mes} className={styles.serieBar}>
          <div
            className={styles.serieFill}
            style={{ height: `${Math.max(8, (100 * s.valor) / peak)}%` }}
            title={`${s.mes}: ${s.valor}`}
          />
          <small>{s.mes}</small>
        </div>
      ))}
    </div>
  );
}

export function LaminaViewerPage() {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const temaParam = params.get("tema") || undefined;
  const [data, setData] = useState<LaminaConsumible | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = (tema?: string) => {
    setLoading(true);
    setError(null);
    api
      .consumibleLamina(slug, tema)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(temaParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, temaParam]);

  const celdasMapa = useMemo(
    () => (data?.celdas || []).filter((c) => c.colonia_slug).map(toCeldaCalor),
    [data],
  );
  const zonasMapa = useMemo(
    () => (data?.por_zona || []).map(toCeldaCalor),
    [data],
  );

  if (loading && !data) return <StateBlock>Armando lámina…</StateBlock>;
  if (error) return <StateBlock>{error}</StateBlock>;
  if (!data) return <StateBlock>Sin datos</StateBlock>;

  const constructo = data.constructo || {};
  const tableKeys =
    data.tabla.length > 0 ? Object.keys(data.tabla[0]).slice(0, 6) : [];

  return (
    <div className={styles.layout}>
      <GlassPanel strong>
        <BotonVolver to="/consumibles" />
        <h1>{data.lamina.nombre}</h1>
        <p className={styles.lead}>{data.lamina.subtitulo}</p>
        <p className={styles.disclaimer}>{data.disclaimer}</p>

        <div className={styles.actions}>
          {data.lamina.permite_selector || data.lamina.tipo === "calor_tematico" ? (
            <label>
              Tema{" "}
              <select
                value={data.tema?.slug || temaParam || "agua"}
                onChange={(e) => {
                  const next = e.target.value;
                  setParams(next ? { tema: next } : {});
                }}
              >
                {data.temas_disponibles.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button type="button" onClick={() => load(data.tema?.slug || temaParam)}>
            Recalcular
          </button>
          <Link to="/consumibles">Volver a consumibles</Link>
        </div>

        <div className={styles.kpiRow}>
          {data.kpis.map((k) => (
            <div key={k.label} className={styles.kpi}>
              <span className={styles.meta}>{k.label}</span>
              <strong>{k.value}</strong>
              {k.hint ? <small>{k.hint}</small> : null}
            </div>
          ))}
        </div>

        {data.lectura_gerencial ? (
          <p className={styles.lectura}>
            <strong>Lectura de mesa. </strong>
            {data.lectura_gerencial}
          </p>
        ) : null}
      </GlassPanel>

      <div className={styles.grid2}>
        <GlassPanel>
          <h2>Mapa</h2>
          <p className={styles.meta}>
            {data.tema ? `Capa: ${data.tema.nombre}` : "Vista territorial Oriente"}
          </p>
          <MapaCalorTerritorial celdas={celdasMapa} porZona={zonasMapa} />
        </GlassPanel>

        <GlassPanel>
          <h2>Gráfica</h2>
          <HBarChart
            items={data.barras_zona.map((b) => ({
              label: b.label,
              value: b.value,
              tone: (b.tone as "rojo" | "amarillo" | "verde" | "accent" | "neutral") || "accent",
              hint: b.hint,
            }))}
          />
          {data.serie_global.length ? (
            <>
              <h2 style={{ marginTop: "1.25rem" }}>Tendencia</h2>
              <SerieMini serie={data.serie_global} />
            </>
          ) : null}
        </GlassPanel>
      </div>

      {data.lamina.tipo === "constructo" && constructo.titulo ? (
        <GlassPanel>
          <h2>{String(constructo.titulo)}</h2>
          <div className={styles.flujo}>
            {(Array.isArray(constructo.flujo) ? constructo.flujo : []).map((f) => (
              <span key={String(f)}>{String(f)}</span>
            ))}
          </div>
          <div className={styles.constructo}>
            <div className={styles.constructoBlock}>
              <strong>Contexto</strong>
              <ul>
                {(Array.isArray(constructo.contexto) ? constructo.contexto : []).map((x) => (
                  <li key={String(x)}>{String(x)}</li>
                ))}
              </ul>
            </div>
            <div className={styles.constructoBlock}>
              <strong>Impactos</strong>
              <ul>
                {(Array.isArray(constructo.impactos) ? constructo.impactos : []).map((x) => (
                  <li key={String(x)}>{String(x)}</li>
                ))}
              </ul>
            </div>
            <div className={styles.constructoBlock}>
              <strong>Recomendaciones de mesa</strong>
              <ul>
                {(Array.isArray(constructo.recomendaciones)
                  ? constructo.recomendaciones
                  : []
                ).map((x) => (
                  <li key={String(x)}>{String(x)}</li>
                ))}
              </ul>
            </div>
          </div>
        </GlassPanel>
      ) : null}

      {data.tabla.length ? (
        <GlassPanel>
          <h2>Tabla</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {tableKeys.map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.tabla.map((row, idx) => (
                  <tr key={idx}>
                    {tableKeys.map((k) => (
                      <td key={k}>{String(row[k] ?? "—")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      ) : null}
    </div>
  );
}
