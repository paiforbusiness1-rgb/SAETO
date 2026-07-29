import { BrowserRouter } from "react-router-dom";
import { GlassNav } from "../shared/ui/GlassNav";
import { AppRoutes } from "./routes";
import styles from "./App.module.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.shell}>
        <GlassNav />
        <main className={styles.main}>
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
