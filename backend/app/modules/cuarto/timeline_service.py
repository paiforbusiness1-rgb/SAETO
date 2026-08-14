"""Timeline de decisiones: coyuntura filtrada por demanda ancla."""

from __future__ import annotations

from fastapi import HTTPException

from app.modules.coyuntura import service as coyuntura_service
from app.modules.cuarto.schemas import TimelineEvento


def _catalog_nombre(clave: str, slug: str | None) -> str:
    if not slug:
        return ""
    from app.shared import seed_loader

    for item in seed_loader.load_coyuntura_catalogos().get(clave, []):
        if item.get("slug") == slug:
            return str(item.get("nombre") or slug)
    return slug


def construir(demanda_slug: str | None) -> list[TimelineEvento]:
    if not demanda_slug:
        return []
    out: list[TimelineEvento] = []
    for resumen in coyuntura_service.list_eventos(demanda=demanda_slug):
        try:
            det = coyuntura_service.get_evento(resumen.slug)
        except HTTPException:
            det = None
        out.append(
            TimelineEvento(
                fecha=resumen.fecha,
                tipo_nombre=resumen.tipo_accion_nombre or resumen.tipo_accion,
                actor_nombre=resumen.actor_nombre,
                demanda_nombre=resumen.demanda_nombre,
                descripcion=(det.descripcion_accion if det else ""),
                respuesta_nombre=_catalog_nombre(
                    "respuestas_gobierno",
                    resumen.respuesta_gobierno,
                ),
                detalle_respuesta=(det.detalle_respuesta if det else ""),
                resultado=(det.resultado if det else ""),
                enlace=f"/coyuntura/{resumen.slug}",
            )
        )
    return sorted(out, key=lambda e: e.fecha)
