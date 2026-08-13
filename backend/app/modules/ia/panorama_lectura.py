"""Lectura IA de panorama territorial (hechos públicos/demo → Groq)."""

from __future__ import annotations

import json

from app.modules.ia import groq_client, safety
from app.modules.ia.schemas import PanoramaLecturaRequest, PanoramaLecturaResponse
from app.modules.inteligencia import panorama_service
from app.shared import seed_loader


def generar(payload: PanoramaLecturaRequest, rol: str | None) -> PanoramaLecturaResponse:
    safety.require_ia_rol(rol)
    cfg = groq_client.config()
    panorama = panorama_service.panorama(zona=payload.zona, colonia=payload.colonia)

    hechos = {
        "territorio": {
            "zona": panorama.zona_nombre,
            "colonia": panorama.colonia_nombre,
        },
        "resumen_base": panorama.resumen_ejecutivo,
        "intensidad": panorama.intensidad.model_dump() if panorama.intensidad else None,
        "conteo_semaforo": panorama.conteo_semaforo,
        "escalando": panorama.escalando,
        "reivindicaciones": [safety.reiv_publica(r) for r in panorama.top_reivindicaciones],
        "eventos": panorama.eventos_recientes,
        "actores": panorama.actores_clave,
        "indicadores_contexto": panorama.indicadores_contexto,
        "pulso_encuestas": {
            "total": panorama.pulso_encuestas.get("total"),
            "colonias_cubiertas": panorama.pulso_encuestas.get("colonias_cubiertas"),
        },
    }

    plantilla = cfg["plantillas"]["panorama_lectura"]
    prompt = plantilla.format(hechos=json.dumps(hechos, ensure_ascii=False, indent=2))
    lectura = groq_client.chat_completion(
        prompt,
        system="Responde en español de mesa política-operativa. Sin jerga técnica de IDs.",
    )

    seed_loader.append_audit(
        {
            "accion": "ia_panorama_lectura",
            "recurso": f"zona:{payload.zona or '-'}|colonia:{payload.colonia or '-'}",
            "rol": safety.require_ia_rol(rol),
            "modelo": cfg.get("modelo"),
        }
    )

    return PanoramaLecturaResponse(
        disclaimer=cfg.get("disclaimer", ""),
        zona=payload.zona,
        colonia=payload.colonia,
        lectura=lectura,
        modelo=str(cfg.get("modelo", "")),
        hechos_usados=hechos,
    )
