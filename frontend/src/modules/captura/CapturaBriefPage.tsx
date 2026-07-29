import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, type BriefWrite } from "../../shared/api/client";
import type { ActorSummary, ReivindicacionSummary } from "../../shared/api/types";
import { BotonVolver } from "../../shared/ui/BotonVolver";
import { GlassPanel } from "../../shared/ui/GlassPanel";
import { StateBlock } from "../../shared/ui/StateBlock";
import styles from "../../shared/ui/forms.module.css";

export function CapturaBriefPage() {
  const [form, setForm] = useState<BriefWrite>({
    resumen_ejecutivo: "",
    alertas_coyuntura: [],
    actores_clave_slugs: [],
    reivindicaciones_top_slugs: [],
  });
  const [alertasText, setAlertasText] = useState("");
  const [actores, setActores] = useState<ActorSummary[]>([]);
  const [reivs, setReivs] = useState<ReivindicacionSummary[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.briefRaw(), api.actores(), api.reivindicaciones()])
      .then(([raw, acts, reiv]) => {
        setForm({
          resumen_ejecutivo: raw.resumen_ejecutivo,
          alertas_coyuntura: raw.alertas_coyuntura,
          actores_clave_slugs: raw.actores_clave_slugs,
          reivindicaciones_top_slugs: raw.reivindicaciones_top_slugs,
        });
        setAlertasText(raw.alertas_coyuntura.join("\n"));
        setActores(acts);
        setReivs(reiv);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (list: string[], slug: string) =>
    list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      await api.updateBrief({
        ...form,
        alertas_coyuntura: alertasText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setMsg("Brief actualizado. Revisa la sala de situación.");
    } catch (error) {
      setErr((error as Error).message);
    }
  };

  if (loading) {
    return (
      <GlassPanel>
        <StateBlock>Cargando brief…</StateBlock>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel strong>
      <BotonVolver to="/captura" label="Volver a captura" />
      <h1>Brief ejecutivo</h1>
      <p className={styles.lead}>
        Define el resumen y qué actores/reivindicaciones destacan en la Capa 1.
      </p>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label>Resumen ejecutivo</label>
          <textarea
            required
            value={form.resumen_ejecutivo}
            onChange={(e) => setForm({ ...form, resumen_ejecutivo: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>Alertas de coyuntura (una por línea)</label>
          <textarea
            value={alertasText}
            onChange={(e) => setAlertasText(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>Actores clave en la sala</label>
          <div className={styles.checkGrid}>
            {actores.map((a) => (
              <label key={a.slug} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={form.actores_clave_slugs.includes(a.slug)}
                  onChange={() =>
                    setForm({
                      ...form,
                      actores_clave_slugs: toggle(form.actores_clave_slugs, a.slug),
                    })
                  }
                />
                {a.nombre}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.field}>
          <label>Reivindicaciones top en la sala</label>
          <div className={styles.checkGrid}>
            {reivs.map((r) => (
              <label key={r.slug} className={styles.checkItem}>
                <input
                  type="checkbox"
                  checked={form.reivindicaciones_top_slugs.includes(r.slug)}
                  onChange={() =>
                    setForm({
                      ...form,
                      reivindicaciones_top_slugs: toggle(
                        form.reivindicaciones_top_slugs,
                        r.slug,
                      ),
                    })
                  }
                />
                {r.tema_nombre} · {r.territorio_nombre}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.actions}>
          <button type="submit" className={styles.btn}>
            Guardar brief
          </button>
          <Link to="/" className={styles.btnGhost}>
            Ver sala de situación
          </Link>
        </div>
      </form>
      {msg ? <p className={styles.msg}>{msg}</p> : null}
      {err ? <p className={styles.err}>{err}</p> : null}
    </GlassPanel>
  );
}
