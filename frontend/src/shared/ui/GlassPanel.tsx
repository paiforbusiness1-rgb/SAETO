import type { CSSProperties, ReactNode } from "react";
import styles from "./GlassPanel.module.css";

type Props = {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  style?: CSSProperties;
};

export function GlassPanel({ children, className = "", strong, style }: Props) {
  const cls = [styles.panel, strong ? styles.strong : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={cls} style={style}>
      {children}
    </section>
  );
}
