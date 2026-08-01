from __future__ import annotations

from datetime import date

from fastapi import HTTPException

from app.shared import seed_loader
from app.shared.enrich import enrich_reivindicacion, reivindicacion_detail
from app.shared.persistence import slugify
from app.shared.schemas import (
    IndicadorContexto,
    IndicadorWrite,
    ReivindicacionDetail,
    ReivindicacionSummary,
    ReivindicacionWrite,
)


def list_reivindicaciones(
    territorio: str | None = None,
    tema: str | None = None,
    zona: str | None = None,
    fase: str | None = None,
    sentido: str | None = None,
    fuente: str | None = None,
) -> list[ReivindicacionSummary]:
    items = seed_loader.load_reivindicaciones_seed()["items"]
    result: list[ReivindicacionSummary] = []
    for raw in items:
        if territorio and raw["territorio"] != territorio:
            continue
        if tema and raw["tema"] != tema:
            continue
        if zona and raw["zona"] != zona:
            continue
        enriched = enrich_reivindicacion(raw)
        if fase and enriched.fase_ciclo_vital != fase:
            continue
        if sentido and enriched.sentido_ciclo != sentido:
            continue
        if fuente:
            fuentes = enriched.fuentes_evidencia or ([enriched.fuente] if enriched.fuente else [])
            if fuente not in fuentes and enriched.fuente != fuente:
                continue
        result.append(enriched)
    return sorted(
        result, key=lambda r: (-r.grado_escalamiento, -r.intensidad, -r.peso_opinion)
    )


def get_reivindicacion(slug: str) -> ReivindicacionDetail:
    for item in seed_loader.load_reivindicaciones_seed()["items"]:
        if item["slug"] == slug:
            return reivindicacion_detail(item)
    raise HTTPException(status_code=404, detail="Reivindicación no encontrada")


def _validate_refs(payload: ReivindicacionWrite) -> None:
    if not 1 <= payload.intensidad <= 5:
        raise HTTPException(status_code=400, detail="Intensidad debe ser entre 1 y 5")
    if not 1 <= payload.grado_escalamiento <= 5:
        raise HTTPException(status_code=400, detail="Grado de escalamiento debe ser 1–5")
    if not 0 <= payload.peso_opinion <= 100:
        raise HTTPException(status_code=400, detail="Peso de opinión debe ser 0–100")
    colonias = {c["slug"] for c in seed_loader.load_territorio()["colonias_demo"]}
    zonas = {z["slug"] for z in seed_loader.load_territorio()["zonas"]}
    temas = {t["slug"] for t in seed_loader.load_catalogo_reivindicaciones()["temas"]}
    fases = {f["slug"] for f in seed_loader.load_ciclo_vital()["fases"]}
    if payload.territorio not in colonias:
        raise HTTPException(status_code=400, detail="Colonia no existe en catálogo")
    if payload.zona not in zonas:
        raise HTTPException(status_code=400, detail="Zona no existe en catálogo")
    if payload.tema not in temas:
        raise HTTPException(status_code=400, detail="Tema no existe en catálogo")
    if payload.fase_ciclo_vital not in fases:
        raise HTTPException(status_code=400, detail="Fase de ciclo vital inválida")


def _append_historial(
    historial: list[dict],
    *,
    fase: str,
    fecha: str,
    origen: str,
    nota: str = "",
) -> list[dict]:
    """Idempotente por (fase, fecha)."""
    out = list(historial)
    key = (fase, fecha)
    if any((h.get("fase"), h.get("fecha")) == key for h in out):
        return out
    out.append(
        {
            "fase": fase,
            "fecha": fecha,
            "origen": origen,
            "nota": nota,
        }
    )
    return out


def _to_raw(
    payload: ReivindicacionWrite,
    slug: str,
    previous: dict | None = None,
) -> dict:
    fuentes = payload.fuentes_evidencia or [payload.fuente]
    historial = list((previous or {}).get("historial_ciclo") or [])
    fecha_hist = (
        payload.fecha_ultima_actualizacion_ciclo
        or payload.fecha_deteccion
        or date.today().isoformat()
    )
    if not previous:
        historial = _append_historial(
            historial,
            fase=payload.fase_ciclo_vital,
            fecha=fecha_hist,
            origen="alta",
            nota=payload.notas_ciclo.strip(),
        )
    else:
        prev_fase = previous.get("fase_ciclo_vital")
        if prev_fase != payload.fase_ciclo_vital:
            historial = _append_historial(
                historial,
                fase=payload.fase_ciclo_vital,
                fecha=fecha_hist,
                origen="captura",
                nota=payload.notas_ciclo.strip(),
            )
    return {
        "slug": slug,
        "tema": payload.tema,
        "territorio": payload.territorio,
        "zona": payload.zona,
        "intensidad": payload.intensidad,
        "deuda_historica": payload.deuda_historica,
        "resumen_deuda": payload.resumen_deuda.strip(),
        "fuente": payload.fuente,
        "peso_opinion": payload.peso_opinion,
        "tipo_demanda": payload.tipo_demanda,
        "fuentes_evidencia": fuentes,
        "fase_ciclo_vital": payload.fase_ciclo_vital,
        "grado_escalamiento": payload.grado_escalamiento,
        "sentido_ciclo": payload.sentido_ciclo,
        "fecha_deteccion": payload.fecha_deteccion,
        "fecha_ultima_actualizacion_ciclo": payload.fecha_ultima_actualizacion_ciclo,
        "notas_ciclo": payload.notas_ciclo.strip(),
        "historial_ciclo": historial,
    }


def create_reivindicacion(payload: ReivindicacionWrite) -> ReivindicacionDetail:
    _validate_refs(payload)
    data = seed_loader.load_reivindicaciones_seed()
    items = list(data["items"])
    base = payload.slug or f"{payload.tema}-{payload.territorio}"
    slug = slugify(base)
    if any(i["slug"] == slug for i in items):
        raise HTTPException(status_code=409, detail="Ya existe esa reivindicación")
    items.append(_to_raw(payload, slug))
    seed_loader.save_reivindicaciones_seed({"demo": True, "items": items})
    return get_reivindicacion(slug)


def update_reivindicacion(slug: str, payload: ReivindicacionWrite) -> ReivindicacionDetail:
    _validate_refs(payload)
    data = seed_loader.load_reivindicaciones_seed()
    items = list(data["items"])
    idx = next((i for i, it in enumerate(items) if it["slug"] == slug), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Reivindicación no encontrada")
    new_slug = slugify(payload.slug or slug)
    if new_slug != slug and any(it["slug"] == new_slug for it in items):
        raise HTTPException(status_code=409, detail="Ya existe esa reivindicación")
    items[idx] = _to_raw(payload, new_slug, previous=items[idx])
    seed_loader.save_reivindicaciones_seed({"demo": True, "items": items})
    return get_reivindicacion(new_slug)


def delete_reivindicacion(slug: str) -> dict:
    data = seed_loader.load_reivindicaciones_seed()
    items = [it for it in data["items"] if it["slug"] != slug]
    if len(items) == len(data["items"]):
        raise HTTPException(status_code=404, detail="Reivindicación no encontrada")
    seed_loader.save_reivindicaciones_seed({"demo": True, "items": items})
    return {"ok": True, "slug": slug}


def aplicar_fase_ciclo(
    demanda_slug: str,
    nueva_fase: str,
    *,
    fecha: str | None = None,
    origen: str = "coyuntura",
    nota: str = "",
) -> ReivindicacionDetail:
    fases = {f["slug"] for f in seed_loader.load_ciclo_vital()["fases"]}
    if nueva_fase not in fases:
        raise HTTPException(status_code=400, detail="Fase de ciclo vital inválida")
    data = seed_loader.load_reivindicaciones_seed()
    items = list(data["items"])
    idx = next((i for i, it in enumerate(items) if it["slug"] == demanda_slug), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Reivindicación no encontrada")
    item = dict(items[idx])
    fecha_hist = fecha or date.today().isoformat()
    if item.get("fase_ciclo_vital") == nueva_fase:
        # Idempotente: solo asegura historial
        item["historial_ciclo"] = _append_historial(
            item.get("historial_ciclo") or [],
            fase=nueva_fase,
            fecha=fecha_hist,
            origen=origen,
            nota=nota or "Confirmación (ya en esa fase)",
        )
    else:
        item["fase_ciclo_vital"] = nueva_fase
        item["fecha_ultima_actualizacion_ciclo"] = fecha_hist
        item["historial_ciclo"] = _append_historial(
            item.get("historial_ciclo") or [],
            fase=nueva_fase,
            fecha=fecha_hist,
            origen=origen,
            nota=nota,
        )
    items[idx] = item
    seed_loader.save_reivindicaciones_seed({"demo": True, "items": items})
    return get_reivindicacion(demanda_slug)


def list_indicadores() -> list[IndicadorContexto]:
    colonias = {
        c["slug"]: c for c in seed_loader.load_territorio()["colonias_demo"]
    }
    out = []
    for item in seed_loader.load_indicadores_seed()["items"]:
        col = colonias.get(item["territorio"], {})
        out.append(
            IndicadorContexto(
                slug=item["slug"],
                territorio=item["territorio"],
                territorio_nombre=col.get("nombre", item["territorio"]),
                zona=item.get("zona", col.get("zona", "")),
                clave=item["clave"],
                nombre=item["nombre"],
                valor=item["valor"],
                anio=item["anio"],
                fuente=item.get("fuente", "INEGI"),
                nota=item.get("nota", ""),
                demo=True,
            )
        )
    return out


def upsert_indicador(payload: IndicadorWrite) -> IndicadorContexto:
    colonias = {
        c["slug"]: c for c in seed_loader.load_territorio()["colonias_demo"]
    }
    if payload.territorio not in colonias:
        raise HTTPException(status_code=400, detail="Territorio no existe")
    data = seed_loader.load_indicadores_seed()
    items = list(data.get("items", []))
    slug = slugify(payload.slug or f"{payload.clave}-{payload.territorio}-{payload.anio}")
    zona = payload.zona or colonias[payload.territorio].get("zona", "")
    raw = {
        "slug": slug,
        "territorio": payload.territorio,
        "zona": zona,
        "clave": payload.clave,
        "nombre": payload.nombre,
        "valor": payload.valor,
        "anio": payload.anio,
        "fuente": payload.fuente,
        "nota": payload.nota,
        "demo": True,
    }
    idx = next((i for i, it in enumerate(items) if it["slug"] == slug), None)
    if idx is None:
        items.append(raw)
    else:
        items[idx] = raw
    seed_loader.save_indicadores_seed({"demo": True, "items": items})
    return next(i for i in list_indicadores() if i.slug == slug)


def delete_indicador(slug: str) -> dict:
    data = seed_loader.load_indicadores_seed()
    items = [it for it in data.get("items", []) if it["slug"] != slug]
    if len(items) == len(data.get("items", [])):
        raise HTTPException(status_code=404, detail="Indicador no encontrado")
    seed_loader.save_indicadores_seed({"demo": True, "items": items})
    return {"ok": True, "slug": slug}
