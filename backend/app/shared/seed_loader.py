from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.shared.persistence import atomic_write_json

# seed_loader.py vive en backend/app/shared/ → raíz backend = parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[2]
CONFIG_DIR = BACKEND_ROOT / "config"
DEMO_DIR = BACKEND_ROOT / "data" / "demo"


def _read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def clear_all_caches() -> None:
    load_territorio.cache_clear()
    load_catalogo_reivindicaciones.cache_clear()
    load_umbrales.cache_clear()
    load_discurso_niveles.cache_clear()
    load_actores_seed.cache_clear()
    load_reivindicaciones_seed.cache_clear()
    load_discurso_seed.cache_clear()
    load_brief_seed.cache_clear()


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
