from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.shared.persistence import atomic_write_json

BACKEND_ROOT = Path(__file__).resolve().parents[2]
CONFIG_DIR = BACKEND_ROOT / "config"
DEMO_DIR = BACKEND_ROOT / "data" / "demo"
RUNTIME_DIR = BACKEND_ROOT / "data" / "runtime"


def _read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def clear_all_caches() -> None:
    for fn in (
        load_territorio,
        load_catalogo_reivindicaciones,
        load_umbrales,
        load_discurso_niveles,
        load_ciclo_vital,
        load_coyuntura_catalogos,
        load_poder_recursos,
        load_discurso_mesa,
        load_actores_seed,
        load_reivindicaciones_seed,
        load_discurso_seed,
        load_brief_seed,
        load_coyuntura_seed,
        load_indicadores_seed,
    ):
        fn.cache_clear()


@lru_cache(maxsize=1)
def load_territorio() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "territorio.json")


@lru_cache(maxsize=1)
def load_catalogo_reivindicaciones() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "reivindicaciones-catalogo.json")


@lru_cache(maxsize=1)
def load_umbrales() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "umbrales-semaforo.json")


@lru_cache(maxsize=1)
def load_discurso_niveles() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "discurso-niveles.json")


@lru_cache(maxsize=1)
def load_ciclo_vital() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "ciclo-vital.json")


@lru_cache(maxsize=1)
def load_coyuntura_catalogos() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "coyuntura-catalogos.json")


@lru_cache(maxsize=1)
def load_poder_recursos() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "poder-recursos.json")


@lru_cache(maxsize=1)
def load_discurso_mesa() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "discurso-rubricas-mesa.json")


@lru_cache(maxsize=1)
def load_actores_seed() -> dict[str, Any]:
    return _read_json(DEMO_DIR / "actores.seed.json")


@lru_cache(maxsize=1)
def load_reivindicaciones_seed() -> dict[str, Any]:
    return _read_json(DEMO_DIR / "reivindicaciones.seed.json")


@lru_cache(maxsize=1)
def load_discurso_seed() -> dict[str, Any]:
    return _read_json(DEMO_DIR / "discurso.seed.json")


@lru_cache(maxsize=1)
def load_brief_seed() -> dict[str, Any]:
    return _read_json(DEMO_DIR / "brief.seed.json")


@lru_cache(maxsize=1)
def load_coyuntura_seed() -> dict[str, Any]:
    path = DEMO_DIR / "coyuntura.seed.json"
    if not path.exists():
        return {"demo": True, "items": []}
    return _read_json(path)


@lru_cache(maxsize=1)
def load_indicadores_seed() -> dict[str, Any]:
    path = DEMO_DIR / "indicadores_contexto.seed.json"
    if not path.exists():
        return {"demo": True, "items": []}
    return _read_json(path)


def save_territorio(data: dict[str, Any]) -> None:
    atomic_write_json(CONFIG_DIR / "territorio.json", data)
    clear_all_caches()


def save_catalogo_reivindicaciones(data: dict[str, Any]) -> None:
    atomic_write_json(CONFIG_DIR / "reivindicaciones-catalogo.json", data)
    clear_all_caches()


def save_umbrales(data: dict[str, Any]) -> None:
    atomic_write_json(CONFIG_DIR / "umbrales-semaforo.json", data)
    clear_all_caches()


def save_discurso_niveles(data: dict[str, Any]) -> None:
    atomic_write_json(CONFIG_DIR / "discurso-niveles.json", data)
    clear_all_caches()


def save_actores_seed(data: dict[str, Any]) -> None:
    atomic_write_json(DEMO_DIR / "actores.seed.json", data)
    clear_all_caches()


def save_reivindicaciones_seed(data: dict[str, Any]) -> None:
    atomic_write_json(DEMO_DIR / "reivindicaciones.seed.json", data)
    clear_all_caches()


def save_discurso_seed(data: dict[str, Any]) -> None:
    atomic_write_json(DEMO_DIR / "discurso.seed.json", data)
    clear_all_caches()


def save_brief_seed(data: dict[str, Any]) -> None:
    atomic_write_json(DEMO_DIR / "brief.seed.json", data)
    clear_all_caches()


def save_coyuntura_seed(data: dict[str, Any]) -> None:
    atomic_write_json(DEMO_DIR / "coyuntura.seed.json", data)
    clear_all_caches()


def save_indicadores_seed(data: dict[str, Any]) -> None:
    atomic_write_json(DEMO_DIR / "indicadores_contexto.seed.json", data)
    clear_all_caches()


def append_audit(entry: dict[str, Any]) -> None:
    from datetime import datetime, timezone

    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    path = RUNTIME_DIR / "audit.log.jsonl"
    payload = {"ts": datetime.now(timezone.utc).isoformat(), **entry}
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(payload, ensure_ascii=False) + "\n")
