import styles from "./charts.module.css";

type BarItem = {
  label: string;
  value: number;
  tone?: "rojo" | "amarillo" | "verde" | "accent" | "neutral";
  hint?: string;
};

type Props = {
  items: BarItem[];
  max?: number;
  unit?: string;
};

export function HBarChart({ items, max, unit }: Props) {
  const peak = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className={styles.bars} role="img" aria-label="Gráfico de barras">
      {items.map((item) => (
        <div key={item.label} className={styles.barRow}>
          <div className={styles.barLabel}>
            <span>{item.label}</span>
            {item.hint ? <small>{item.hint}</small> : null}
          </div>
          <div className={styles.barTrack}>
            <div
              className={`${styles.barFill} ${styles[item.tone ?? "accent"]}`}
              style={{ width: `${Math.max(4, (100 * item.value) / peak)}%` }}
            />
          </div>
          <div className={styles.barValue}>
            {item.value}
            {unit ?? ""}
          </div>
        </div>
      ))}
    </div>
  );
}

type DonutProps = {
  slices: { clave: string; etiqueta: string; valor: number }[];
};

const DONUT_COLORS: Record<string, string> = {
  rojo: "#e05656",
  amarillo: "#d4a017",
  verde: "#3dba7c",
  deuda_historica: "#c4a35a",
  sin_deuda: "#7eb8a2",
};

export function DonutChart({ slices }: DonutProps) {
  const total = slices.reduce((s, x) => s + x.valor, 0) || 1;
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 120 120" className={styles.donut} aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
        />
        {slices.map((slice) => {
          const len = (slice.valor / total) * c;
          const el = (
            <circle
              key={slice.clave}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={DONUT_COLORS[slice.clave] ?? "#7eb8a2"}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 60 60)"
            />
          );
          offset += len;
          return el;
        })}
        <text x="60" y="58" textAnchor="middle" className={styles.donutTotal}>
          {total}
        </text>
        <text x="60" y="72" textAnchor="middle" className={styles.donutSub}>
          total
        </text>
      </svg>
      <ul className={styles.legend}>
        {slices.map((s) => (
          <li key={s.clave}>
            <span
              className={styles.swatch}
              style={{ background: DONUT_COLORS[s.clave] ?? "#7eb8a2" }}
            />
            {s.etiqueta}: <strong>{s.valor}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

type KpiProps = {
  label: string;
  value: string | number;
  tone?: "rojo" | "amarillo" | "verde" | "neutral";
};

export function KpiTile({ label, value, tone = "neutral" }: KpiProps) {
  return (
    <div className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
    </div>
  );
}
