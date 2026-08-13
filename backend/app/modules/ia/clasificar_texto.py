"""Clasificación de texto libre → sugerencias de catálogo SAETO."""

from __future__ import annotations

import json
import re

from app.modules.ia import groq_client, safety
from app.modules.ia.schemas import ClasificarTextoRequest, ClasificarTextoResponse
from app.shared import seed_loader


def _parse_json(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group(0))
        return {}


def generar(payload: ClasificarTextoRequest, rol: str | None) -> ClasificarTextoResponse:
    safety.require_ia_rol(rol)
    cfg = groq_client.config()
    plantilla = cfg["plantillas"]["clasificar_texto"]
    prompt = plantilla.format(texto=payload.texto.strip())
    crudo = groq_client.chat_completion(
        prompt,
        system="Devuelve únicamente JSON válido, sin markdown.",
    )
    data = _parse_json(crudo)

    seed_loader.append_audit(
        {
            "accion": "ia_clasificar_texto",
            "recurso": f"chars:{len(payload.texto)}",
            "rol": safety.require_ia_rol(rol),
            "modelo": cfg.get("modelo"),
        }
    )

    confianza = data.get("confianza", 0)
    try:
        confianza_f = float(confianza)
    except (TypeError, ValueError):
        confianza_f = 0.0

    return ClasificarTextoResponse(
        disclaimer=cfg.get("disclaimer", ""),
        tema_sugerido=str(data.get("tema_sugerido") or "otro"),
        fase_ciclo_sugerida=str(data.get("fase_ciclo_sugerida") or "emergencia"),
        sentido_sugerido=str(data.get("sentido_sugerido") or "estable"),
        confianza=max(0.0, min(1.0, confianza_f)),
        resumen_corto=str(data.get("resumen_corto") or ""),
        notas_mesa=str(data.get("notas_mesa") or ""),
        crudo=crudo,
        modelo=str(cfg.get("modelo", "")),
    )
