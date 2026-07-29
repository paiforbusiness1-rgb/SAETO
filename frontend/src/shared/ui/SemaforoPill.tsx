import type { Semaforo } from "../api/types";
import styles from "./SemaforoPill.module.css";

type Props = {
  value: Semaforo;
  label?: string;
};

export function SemaforoPill({ value, label }: Props) {
  return (
    <span className={`${styles.pill} ${styles[value]}`}>
      {label ?? value}
    </span>
  );
}
