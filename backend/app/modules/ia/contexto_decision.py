"""Contexto de decisión / expertise: demanda + coyuntura + actores públicos → Groq."""

from __future__ import annotations

import json

from fastapi import HTTPException

from app.modules.actores import service as actores_service
from app.modules.coyuntura import service as coyuntura_service
from app.modules.ia import groq_client, safety
from app.modules.ia.schemas import ContextoDecisionRequest, ContextoDecisionResponse
from app.modules.observatorio import service as observatorio_service
from app.shared import seed_loader


def generar(payload: ContextoDecisionRequest, rol: str | None) -> ContextoDecisionResponse:
    safety.require_ia_rol(rol)
    cfg = groq_client.config()

    try:
        demanda = observatorio_service.get_reivindicacion(payload.demanda_slug)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=404, detail="Demanda no encontrada") from exc

    eventos = coyuntura_service.list_eventos(demanda=payload.demanda_slug)
    # detalle de eventos (sin sensibles tipología filtrada ya en UI/roles de captura)
    eventos_det = []
    for ev in eventos[:8]:
        try:
            det = coyuntura_service.get_evento(ev.slug)
            eventos_det.append(safety.evento_publico(det))
        except HTTPException:
            eventos_det.append(safety.evento_publico(ev))

    actores = []
    for a in actores_service.list_actores(rol=safety.require_ia_rol(rol)):
        # actores vinculados por tema abierto o colonia de la demanda
        if demanda.territorio and a.colonia == demanda.territorio:
            actores.append(safety.actor_publico(a.model_dump()))
        elif demanda.tema in (a.reivindicaciones_abiertas or []):
            actores.append(safety.actor_publico(a.model_dump()))

    hechos = {
        "demanda": safety.reiv_publica(demanda),
        "eventos_coyuntura": eventos_det,
        "actores_relacionados": actores[:6],
    }

    plantilla = cfg["plantillas"]["contexto_decision"]
    prompt = plantilla.format(hechos=json.dumps(hechos, ensure_ascii=False, indent=2))
    lectura = groq_client.chat_completion(
        prompt,
        system="Español de mesa. No inventes acuerdos ni fechas ausentes en los hechos.",
    )

    seed_loader.append_audit(
        {
            "accion": "ia_contexto_decision",
            "recurso": f"demanda:{payload.demanda_slug}",
            "rol": safety.require_ia_rol(rol),
            "modelo": cfg.get("modelo"),
        }
    )

    return ContextoDecisionResponse(
        disclaimer=cfg.get("disclaimer", ""),
        demanda_slug=payload.demanda_slug,
        lectura=lectura,
        modelo=str(cfg.get("modelo", "")),
        hechos_usados=hechos,
    )
