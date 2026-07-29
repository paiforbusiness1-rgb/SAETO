import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./GlassCard.module.css";

type Props = {
  children: ReactNode;
  to?: string;
  className?: string;
};

export function GlassCard({ children, to, className = "" }: Props) {
  const cls = `${styles.card} ${className}`.trim();
  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }
  return <div className={cls}>{children}</div>;
}
