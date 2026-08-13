"""Fachada delgada del módulo IA."""

from app.modules.ia import clasificar_texto, contexto_decision, groq_client, panorama_lectura
from app.modules.ia.schemas import IaStatus

__all__ = [
    "groq_client",
    "panorama_lectura",
    "clasificar_texto",
    "contexto_decision",
    "get_status",
]


def get_status() -> IaStatus:
    return IaStatus(**groq_client.status_payload())
