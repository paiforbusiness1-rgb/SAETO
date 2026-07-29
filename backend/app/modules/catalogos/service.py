from __future__ import annotations

from fastapi import HTTPException

from app.shared import seed_loader
from app.shared.schemas import (
    DiscursoNivelesCatalog,
    TemasCatalog,
    TerritorioCatalog,
    UmbralesCatalog,
)


def get_territorio() -> dict:
    return seed_loader.load_territorio()


def save_territorio(payload: TerritorioCatalog) -> dict:
    for z in payload.zonas:
        if not z.get("slug") or not z.get("nombre"):
            raise HTTPException(status_code=400, detail="Cada zona requiere slug y nombre")
    for c in payload.colonias_demo:
        if not c.get("slug") or not c.get("nombre") or not c.get("zona"):
            raise HTTPException(status_code=400, detail="Cada colonia requiere slug, nombre y zona")
    zona_slugs = {z["slug"] for z in payload.zonas}
    for c in payload.colonias_demo:
        if c["zona"] not in zona_slugs:
            raise HTTPException(status_code=400, detail=f"Colonia con zona inexistente: {c['slug']}")
    data = payload.model_dump()
    seed_loader.save_territorio(data)
    return data


def get_temas() -> dict:
    return seed_loader.load_catalogo_reivindicaciones()


def save_temas(payload: TemasCatalog) -> dict:
    for t in payload.temas:
        if not t.get("slug") or not t.get("nombre"):
            raise HTTPException(status_code=400, detail="Cada tema requiere slug y nombre")
    data = payload.model_dump()
    seed_loader.save_catalogo_reivindicaciones(data)
    return data


def get_umbrales() -> dict:
    return seed_loader.load_umbrales()


def save_umbrales(payload: UmbralesCatalog) -> dict:
    if not payload.intensidad:
        raise HTTPException(status_code=400, detail="Debe haber al menos una banda")
    for b in payload.intensidad:
        if "min" not in b or "max" not in b or "semaforo" not in b or "etiqueta" not in b:
            raise HTTPException(status_code=400, detail="Banda incompleta")
        if b["semaforo"] not in ("verde", "amarillo", "rojo"):
            raise HTTPException(status_code=400, detail="Semáforo inválido")
    data = payload.model_dump()
    seed_loader.save_umbrales(data)
    return data


def get_discurso_niveles() -> dict:
    return seed_loader.load_discurso_niveles()


def save_discurso_niveles(payload: DiscursoNivelesCatalog) -> dict:
    for n in payload.niveles:
        if not n.get("slug") or not n.get("nombre"):
            raise HTTPException(status_code=400, detail="Cada nivel requiere slug y nombre")
    data = payload.model_dump()
    seed_loader.save_discurso_niveles(data)
    return data
