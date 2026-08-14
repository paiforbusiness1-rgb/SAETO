"""Celdas temáticas y utilidades compartidas de consumibles."""

from __future__ import annotations

from collections import defaultdict

from app.modules.consumibles.schemas import CeldaConsumible, SeriePunto, TemaMeta
from app.shared import seed_loader


def disclaimer() -> str:
    return seed_loader.load_consumibles_temas().get(
        "disclaimer",
        "Cifras territoriales para análisis de mesa Oriente.",
    )


def list_temas() -> list[TemaMeta]:
    return [TemaMeta(**t) for t in seed_loader.load_consumibles_temas().get("temas", [])]


def tema_or_default(slug: str | None) -> TemaMeta:
    temas = list_temas()
    if not temas:
        return TemaMeta(slug="agua", nombre="Agua")
    if slug:
        for t in temas:
            if t.slug == slug:
                return t
    return temas[0]


def _zona_nombre(slug: str) -> str:
    for z in seed_loader.load_territorio().get("zonas", []):
        if z["slug"] == slug:
            return z["nombre"]
    return slug


def _colonia_nombre(slug: str) -> str:
    for c in seed_loader.load_demografia_electoral_seed().get("items", []):
        if c["colonia"] == slug:
            return c.get("nombre") or slug
    for c in seed_loader.load_territorio().get("colonias_demo", []):
        if c["slug"] == slug:
            return c.get("nombre") or slug
    return slug


def _banda(score: float, cfg: dict | None = None) -> dict:
    cfg = cfg or seed_loader.load_consumibles_cruce()
    for band in cfg.get("bandas", []):
        if band["min"] <= score <= band["max"]:
            return band
    bands = cfg.get("bandas", [])
    return bands[-1] if bands else {"slug": "baja", "nombre": "Baja", "color": "#3dba7c"}


def items_tema(tema: str) -> list[dict]:
    return [
        i
        for i in seed_loader.load_problematicas_territorio_seed().get("items", [])
        if i.get("tema") == tema
    ]


def demografia_map() -> dict[str, dict]:
    return {
        i["colonia"]: i
        for i in seed_loader.load_demografia_electoral_seed().get("items", [])
    }


def celdas_tematicas(tema: str) -> list[CeldaConsumible]:
    out: list[CeldaConsumible] = []
    demo = demografia_map()
    for item in items_tema(tema):
        slug = item["colonia"]
        zona = item["zona"]
        score = float(item.get("intensidad") or 0)
        band = _banda(score)
        demo_row = demo.get(slug, {})
        out.append(
            CeldaConsumible(
                colonia_slug=slug,
                colonia_nombre=_colonia_nombre(slug),
                zona_slug=zona,
                zona_nombre=_zona_nombre(zona),
                score=score,
                banda_slug=band["slug"],
                banda_nombre=band["nombre"],
                color=band["color"],
                intensidad_tema=score,
                indice_electoral=float(
                    demo_row.get("indice_electoral")
                    or demo_row.get("indice_electoral_demo")
                    or 0
                )
                or None,
                densidad=float(demo_row.get("densidad_hab_km2") or 0) or None,
                metrica_clave=item.get("metrica_clave"),
                metrica_valor=float(item["metrica_valor"]) if item.get("metrica_valor") is not None else None,
                nota_mesa=item.get("nota_mesa"),
            )
        )
    out.sort(key=lambda c: c.score, reverse=True)
    return out


def agregar_por_zona(celdas: list[CeldaConsumible]) -> list[CeldaConsumible]:
    buckets: dict[str, list[CeldaConsumible]] = defaultdict(list)
    for c in celdas:
        buckets[c.zona_slug].append(c)
    out: list[CeldaConsumible] = []
    for zona, items in buckets.items():
        score = sum(i.score for i in items) / max(len(items), 1)
        band = _banda(score)
        out.append(
            CeldaConsumible(
                colonia_slug="",
                colonia_nombre="",
                zona_slug=zona,
                zona_nombre=_zona_nombre(zona),
                score=round(score, 1),
                banda_slug=band["slug"],
                banda_nombre=band["nombre"],
                color=band["color"],
            )
        )
    out.sort(key=lambda c: c.score, reverse=True)
    return out


def barras_desde_zonas(por_zona: list[CeldaConsumible]) -> list[dict]:
    return [
        {
            "label": z.zona_nombre,
            "value": round(z.score, 1),
            "tone": "rojo"
            if z.score >= 75
            else "amarillo"
            if z.score >= 55
            else "verde"
            if z.score < 35
            else "accent",
        }
        for z in por_zona
    ]


def serie_promedio(tema: str) -> list[SeriePunto]:
    meses = seed_loader.load_problematicas_territorio_seed().get("meses") or []
    items = items_tema(tema)
    if not meses or not items:
        return []
    out: list[SeriePunto] = []
    for idx, mes in enumerate(meses):
        vals = []
        for it in items:
            serie = it.get("serie_mensual") or []
            if idx < len(serie):
                vals.append(float(serie[idx]))
        out.append(SeriePunto(mes=mes, valor=round(sum(vals) / max(len(vals), 1), 1)))
    return out
