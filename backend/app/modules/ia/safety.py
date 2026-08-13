"""Filtros de seguridad territorial antes de enviar contexto a LLMs externos."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException

from app.shared import seed_loader
from app.shared.seguridad import normalize_rol


def require_ia_rol(rol: str | None) -> str:
    cfg = seed_loader.load_ia_groq()
    allowed = set(cfg.get("roles_permitidos") or ["analista", "analista_sensible", "admin"])
    value = normalize_rol(rol)
    if value not in allowed:
        raise HTTPException(
            status_code=403,
            detail=(
                "La lectura IA requiere rol Analista o superior. "
                "Ajuste el rol demo en la barra superior."
            ),
        )
    return value


def actor_publico(raw: dict[str, Any]) -> dict[str, Any]:
    """Omite campos sensibles / reservados antes de salir a Groq."""
    return {
        "nombre": raw.get("nombre"),
        "rol": raw.get("rol"),
        "organizacion": raw.get("organizacion"),
        "colonia": raw.get("colonia"),
        "zona": raw.get("zona"),
        "tipo_actor": raw.get("tipo_actor"),
        "movilizacion_display": raw.get("capacidad_comprobada")
        if raw.get("capacidad_comprobada") is not None
        else raw.get("capacidad_estimada", raw.get("capacidad_movilizacion")),
        "estado_verificacion": raw.get("estado_verificacion"),
        "interes_declarado": raw.get("interes_declarado"),
        # explícitamente NO: interes_reservado, red_afiliacion, cuenta_pendiente_seguridad, alias sensibles
    }


def reiv_publica(raw: dict[str, Any] | Any) -> dict[str, Any]:
    if hasattr(raw, "model_dump"):
        raw = raw.model_dump()
    return {
        "slug": raw.get("slug"),
        "tema": raw.get("tema") or raw.get("tema_nombre"),
        "tema_nombre": raw.get("tema_nombre"),
        "territorio": raw.get("territorio") or raw.get("territorio_nombre"),
        "territorio_nombre": raw.get("territorio_nombre"),
        "zona": raw.get("zona") or raw.get("zona_nombre"),
        "zona_nombre": raw.get("zona_nombre"),
        "semaforo": raw.get("semaforo"),
        "fase_ciclo_vital": raw.get("fase_ciclo_vital"),
        "fase_ciclo_nombre": raw.get("fase_ciclo_nombre"),
        "sentido_ciclo": raw.get("sentido_ciclo"),
        "grado_escalamiento": raw.get("grado_escalamiento"),
        "deuda_historica": raw.get("deuda_historica"),
        "resumen_deuda": raw.get("resumen_deuda"),
        "peso_opinion": raw.get("peso_opinion"),
    }


def evento_publico(raw: dict[str, Any] | Any) -> dict[str, Any]:
    if hasattr(raw, "model_dump"):
        raw = raw.model_dump()
    return {
        "fecha": raw.get("fecha"),
        "tipo_accion": raw.get("tipo_accion") or raw.get("tipo_accion_nombre"),
        "tipo_accion_nombre": raw.get("tipo_accion_nombre"),
        "actor_nombre": raw.get("actor_nombre"),
        "demanda_nombre": raw.get("demanda_nombre"),
        "descripcion_accion": raw.get("descripcion_accion"),
        "respuesta_gobierno": raw.get("respuesta_gobierno"),
        "detalle_respuesta": raw.get("detalle_respuesta"),
        "reaccion": raw.get("reaccion"),
        "resultado": raw.get("resultado"),
        "corredor_nombre": raw.get("corredor_nombre"),
    }
