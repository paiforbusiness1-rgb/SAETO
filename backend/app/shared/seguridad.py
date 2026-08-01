from __future__ import annotations

SENSIBLE_ROLES = {"analista_sensible", "admin"}
TIPOS_ACCION_SENSIBLES = {"violencia"}
TIPOS_ACTOR_SENSIBLES = {"generador_violencia"}


def rol_ve_sensible(rol: str | None) -> bool:
    return (rol or "analista") in SENSIBLE_ROLES


def normalize_rol(rol: str | None) -> str:
    allowed = {"lector", "capturista", "analista", "analista_sensible", "admin"}
    value = (rol or "analista").strip()
    return value if value in allowed else "analista"


def require_sensible(rol: str | None, motivo: str) -> None:
    from fastapi import HTTPException

    if not rol_ve_sensible(rol):
        raise HTTPException(
            status_code=403,
            detail=(
                f"Este dato ({motivo}) requiere rol Analista sensible o Admin. "
                "Cambie el rol demo en la barra superior."
            ),
        )


def accion_es_sensible(tipo_accion: str | None) -> bool:
    return (tipo_accion or "") in TIPOS_ACCION_SENSIBLES


def tipo_actor_es_sensible(tipo_actor: str | None) -> bool:
    return (tipo_actor or "") in TIPOS_ACTOR_SENSIBLES


def recursos_sensibles(recursos: list[str] | None) -> list[str]:
    from app.shared import seed_loader

    flagged = {
        r["slug"]
        for r in seed_loader.load_poder_recursos().get("recursos", [])
        if r.get("sensible")
    }
    return [x for x in (recursos or []) if x in flagged]
