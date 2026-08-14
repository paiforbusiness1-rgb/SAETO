import type { CeldaCalor, CeldaConsumible } from "../../shared/api/types";

export function toCeldaCalor(c: CeldaConsumible): CeldaCalor {
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

export function fmtNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return Math.round(n).toLocaleString("es-MX");
}
