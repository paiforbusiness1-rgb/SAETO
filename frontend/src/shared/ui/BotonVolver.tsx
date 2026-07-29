import { Link } from "react-router-dom";
import styles from "./BotonVolver.module.css";

type Props = {
  to?: string;
  label?: string;
};

export function BotonVolver({ to = "/", label = "Volver al brief" }: Props) {
  return (
    <Link to={to} className={styles.btn}>
      ← {label}
    </Link>
  );
}
