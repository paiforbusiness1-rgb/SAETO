"""Evaluaciones de ritmo de mesa (append-only ligero)."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException

from app.modules.inteligencia.schemas import EvaluacionMesa, EvaluacionMesaWrite
from app.shared import seed_loader
from app.shared.persistence import slugify
from app.shared.seguridad import normalize_rol


def list_evaluaciones(limit: int = 20) -> list[EvaluacionMesa]:
    items = seed_loader.load_evaluaciones_mesa().get("items", [])
    out = [EvaluacionMesa(**it) for it in items]
    return sorted(out, key=lambda e: e.fecha, reverse=True)[:limit]


def create_evaluacion(payload: EvaluacionMesaWrite, rol: str | None = None) -> EvaluacionMesa:
    ritmo = seed_loader.load_ritmo_mesa()
    ventanas = {v["slug"] for v in ritmo.get("ventanas", [])}
    if payload.ventana not in ventanas:
        raise HTTPException(status_code=400, detail="Ventana de evaluación no válida")
    checklist = {c["slug"] for c in ritmo.get("checklist", [])}
    for item in payload.checklist_ok:
        if item not in checklist:
            raise HTTPException(status_code=400, detail=f"Ítem de checklist desconocido: {item}")

    now = datetime.now(timezone.utc).isoformat()
    slug = slugify(f"eval-{payload.ventana}-{now[:16]}")
    entry = EvaluacionMesa(
        slug=slug,
        fecha=now,
        rol=normalize_rol(rol),
        ventana=payload.ventana,
        notas=payload.notas.strip(),
        focos_revisados=[f.strip() for f in payload.focos_revisados if f.strip()],
        checklist_ok=payload.checklist_ok,
    )
    data = seed_loader.load_evaluaciones_mesa()
    items = list(data.get("items", []))
    items.append(entry.model_dump())
    seed_loader.save_evaluaciones_mesa({"demo": True, "items": items})
    return entry
