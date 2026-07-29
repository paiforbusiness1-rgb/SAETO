import type { ReactNode } from "react";
import styles from "./StateBlock.module.css";

type Props = {
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function StateBlock({ children, actionLabel, onAction }: Props) {
  return (
    <div className={styles.block}>
      <p>{children}</p>
      {actionLabel && onAction ? (
        <button type="button" className={styles.btn} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
