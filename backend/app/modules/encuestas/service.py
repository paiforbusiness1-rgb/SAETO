from __future__ import annotations

from fastapi import HTTPException

from app.shared import seed_loader
from app.shared.persistence import slugify
from app.shared.schemas import EncuestaDetail, EncuestaSummary, EncuestaWrite

_PRIORIDAD_FALLBACKS = (
    "problemas_prioridad",
    "principales_problemas",
    "prioridades_comunidad",
)


def _colonia_meta(slug: str) -> dict:
    for item in seed_loader.load_territorio()["colonias_demo"]:
        if item["slug"] == slug:
            return item
    return {}


def _zona_nombre(slug: str) -> str:
    for item in seed_loader.load_territorio()["zonas"]:
        if item["slug"] == slug:
            return item["nombre"]
    return slug


def _load_plantilla(slug: str) -> dict:
    try:
        return seed_loader.load_plantilla_encuesta(slug)
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _prioridades_de(raw: dict, plantilla: dict | None = None) -> list[str]:
    resp = raw.get("respuestas") or {}
    clave = (plantilla or {}).get("clave_prioridades")
    if clave and isinstance(resp.get(clave), list):
        return list(resp[clave])
    for key in _PRIORIDAD_FALLBACKS:
        if isinstance(resp.get(key), list):
            return list(resp[key])
    return []


def _plantilla_nombre(slug: str) -> str:
    for meta in seed_loader.list_plantillas_encuesta():
        if meta["slug"] == slug:
            return meta["nombre"]
    return slug


def _enrich(raw: dict) -> EncuestaSummary:
    col = _colonia_meta(raw["colonia"])
    resp = raw.get("respuestas") or {}
    plantilla_slug = raw.get("plantilla", "rapida_mesa")
    try:
        plantilla = seed_loader.load_plantilla_encuesta(plantilla_slug)
    except KeyError:
        plantilla = {}
    return EncuestaSummary(
        slug=raw["slug"],
        fecha=raw["fecha"],
        plantilla=plantilla_slug,
        plantilla_nombre=_plantilla_nombre(plantilla_slug),
        colonia=raw["colonia"],
        colonia_nombre=col.get("nombre", raw["colonia"]),
        zona=raw.get("zona") or col.get("zona", ""),
        zona_nombre=_zona_nombre(raw.get("zona") or col.get("zona", "")),
        edad=resp.get("edad"),
        sexo=resp.get("sexo"),
        problemas_prioridad=_prioridades_de(raw, plantilla),
        demo=bool(raw.get("demo", False)),
    )


def _detail(raw: dict) -> EncuestaDetail:
    base = _enrich(raw)
    plantilla = _load_plantilla(raw.get("plantilla", "rapida_mesa"))
    data = base.model_dump()
    data.update(
        {
            "respuestas": raw.get("respuestas") or {},
            "notas_mesa": raw.get("notas_mesa", ""),
            "plantilla_meta": plantilla,
            "demo": bool(raw.get("demo", False)),
        }
    )
    return EncuestaDetail(**data)


def list_plantillas() -> list[dict]:
    return seed_loader.list_plantillas_encuesta()


def get_plantilla(slug: str) -> dict:
    return _load_plantilla(slug)


def list_encuestas(
    colonia: str | None = None,
    plantilla: str | None = None,
) -> list[EncuestaSummary]:
    items = seed_loader.load_encuestas_data().get("items", [])
    out = []
    for raw in items:
        if colonia and raw.get("colonia") != colonia:
            continue
        if plantilla and raw.get("plantilla") != plantilla:
            continue
        out.append(_enrich(raw))
    return sorted(out, key=lambda e: e.fecha, reverse=True)


def get_encuesta(slug: str) -> EncuestaDetail:
    for raw in seed_loader.load_encuestas_data().get("items", []):
        if raw["slug"] == slug:
            return _detail(raw)
    raise HTTPException(status_code=404, detail="Encuesta no encontrada")


def _validate(payload: EncuestaWrite) -> dict:
    colonias = {c["slug"]: c for c in seed_loader.load_territorio()["colonias_demo"]}
    if payload.colonia not in colonias:
        raise HTTPException(status_code=400, detail="Colonia no existe en catálogo")
    zona = payload.zona or colonias[payload.colonia]["zona"]
    plantilla_slug = payload.plantilla or "rapida_mesa"
    plantilla = _load_plantilla(plantilla_slug)
    max_prob = int(plantilla.get("max_problemas_prioridad", 3))
    respuestas: dict = {}

    for preg in plantilla.get("preguntas", []):
        slug = preg["slug"]
        tipo = preg["tipo"]
        valor = (payload.respuestas or {}).get(slug)
        if preg.get("obligatoria") and (valor is None or valor == "" or valor == []):
            raise HTTPException(
                status_code=400,
                detail=f"Falta responder: {preg.get('texto', slug)}",
            )
        if valor is None or valor == "":
            continue
        opcion_slugs = {o["slug"] for o in preg.get("opciones", [])}
        if tipo == "opcion_unica":
            if valor not in opcion_slugs:
                raise HTTPException(
                    status_code=400,
                    detail=f"Opción inválida en {preg.get('texto', slug)}",
                )
            respuestas[slug] = valor
        elif tipo == "opcion_multiple":
            if not isinstance(valor, list):
                raise HTTPException(
                    status_code=400,
                    detail=f"{preg.get('texto', slug)} debe ser selección múltiple",
                )
            lim = int(preg.get("max_selecciones", max_prob))
            if len(valor) > lim:
                raise HTTPException(
                    status_code=400,
                    detail=f"Máximo {lim} opciones en {preg.get('texto', slug)}",
                )
            for v in valor:
                if v not in opcion_slugs:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Opción inválida en {preg.get('texto', slug)}",
                    )
            respuestas[slug] = valor
        elif tipo == "numero":
            try:
                respuestas[slug] = float(valor) if "." in str(valor) else int(valor)
            except (TypeError, ValueError) as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Número inválido en {preg.get('texto', slug)}",
                ) from exc
        elif tipo == "escala":
            try:
                num = int(valor)
            except (TypeError, ValueError) as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Escala inválida en {preg.get('texto', slug)}",
                ) from exc
            mn = int(preg.get("min", 1))
            mx = int(preg.get("max", 10))
            if num < mn or num > mx:
                raise HTTPException(
                    status_code=400,
                    detail=f"Escala fuera de rango ({mn}-{mx}) en {preg.get('texto', slug)}",
                )
            respuestas[slug] = num
        elif tipo == "texto":
            text = str(valor).strip()
            max_chars = int(preg.get("max_chars", 1000))
            if len(text) > max_chars:
                raise HTTPException(
                    status_code=400,
                    detail=f"Texto demasiado largo en {preg.get('texto', slug)} (máx. {max_chars})",
                )
            if text:
                respuestas[slug] = text
        else:
            respuestas[slug] = valor

    return {"zona": zona, "respuestas": respuestas, "plantilla": plantilla_slug}


def _to_raw(payload: EncuestaWrite, slug: str, zona: str, respuestas: dict, plantilla: str) -> dict:
    return {
        "slug": slug,
        "fecha": payload.fecha,
        "plantilla": plantilla,
        "colonia": payload.colonia,
        "zona": zona,
        "respuestas": respuestas,
        "notas_mesa": (payload.notas_mesa or "").strip(),
        "demo": False,
    }


def create_encuesta(payload: EncuestaWrite) -> EncuestaDetail:
    checked = _validate(payload)
    data = seed_loader.load_encuestas_data()
    items = list(data.get("items", []))
    slug = slugify(payload.slug or f"enc-{payload.fecha}-{payload.colonia}")
    if any(i["slug"] == slug for i in items):
        base = slug
        n = 2
        while any(i["slug"] == slug for i in items):
            slug = f"{base}-{n}"
            n += 1
    items.append(
        _to_raw(
            payload,
            slug,
            checked["zona"],
            checked["respuestas"],
            checked["plantilla"],
        )
    )
    seed_loader.save_encuestas_data({"demo": True, "items": items})
    return get_encuesta(slug)


def update_encuesta(slug: str, payload: EncuestaWrite) -> EncuestaDetail:
    checked = _validate(payload)
    data = seed_loader.load_encuestas_data()
    items = list(data.get("items", []))
    idx = next((i for i, it in enumerate(items) if it["slug"] == slug), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")
    new_slug = slugify(payload.slug or slug)
    if new_slug != slug and any(it["slug"] == new_slug for it in items):
        raise HTTPException(status_code=409, detail="Ya existe esa encuesta")
    items[idx] = _to_raw(
        payload,
        new_slug,
        checked["zona"],
        checked["respuestas"],
        checked["plantilla"],
    )
    seed_loader.save_encuestas_data({"demo": True, "items": items})
    return get_encuesta(new_slug)


def delete_encuesta(slug: str) -> dict:
    data = seed_loader.load_encuestas_data()
    items = [it for it in data.get("items", []) if it["slug"] != slug]
    if len(items) == len(data.get("items", [])):
        raise HTTPException(status_code=404, detail="Encuesta no encontrada")
    seed_loader.save_encuestas_data({"demo": True, "items": items})
    return {"ok": True, "slug": slug}
