"""Cliente HTTP mínimo hacia Groq (OpenAI-compatible)."""

from __future__ import annotations

import json
import os
from typing import Any

import httpx
from fastapi import HTTPException

from app.shared import seed_loader


def api_key() -> str | None:
    return (os.getenv("GROQ_API_KEY") or "").strip() or None


def config() -> dict[str, Any]:
    return seed_loader.load_ia_groq()


def status_payload() -> dict[str, Any]:
    cfg = config()
    return {
        "demo": True,
        "habilitado": bool(cfg.get("habilitado", True)),
        "proveedor": cfg.get("proveedor", "groq"),
        "modelo": cfg.get("modelo", ""),
        "api_key_configurada": bool(api_key()),
        "roles_permitidos": list(cfg.get("roles_permitidos") or []),
        "disclaimer": cfg.get("disclaimer", ""),
    }


def chat_completion(prompt: str, *, system: str | None = None) -> str:
    cfg = config()
    if not cfg.get("habilitado", True):
        raise HTTPException(status_code=503, detail="Módulo IA deshabilitado en config")
    key = api_key()
    if not key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Falta GROQ_API_KEY. Configúrala en backend/.env o en la variable de entorno "
                "y reinicia uvicorn para probar en local."
            ),
        )

    messages: list[dict[str, str]] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    body = {
        "model": cfg.get("modelo", "llama-3.3-70b-versatile"),
        "temperature": float(cfg.get("temperatura", 0.2)),
        "max_tokens": int(cfg.get("max_tokens", 900)),
        "messages": messages,
    }
    base = str(cfg.get("base_url") or "https://api.groq.com/openai/v1").rstrip("/")
    timeout = float(cfg.get("timeout_segundos", 45))

    try:
        with httpx.Client(timeout=timeout) as client:
            res = client.post(
                f"{base}/chat/completions",
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                },
                content=json.dumps(body),
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail="Groq no respondió a tiempo") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Error de red hacia Groq: {exc}") from exc

    if res.status_code >= 400:
        detail = res.text[:400]
        raise HTTPException(
            status_code=502,
            detail=f"Groq respondió {res.status_code}: {detail}",
        )

    data = res.json()
    try:
        return str(data["choices"][0]["message"]["content"]).strip()
    except (KeyError, IndexError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="Respuesta Groq ilegible") from exc
