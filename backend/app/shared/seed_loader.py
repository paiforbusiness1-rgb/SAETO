from __future__ import annotations

import json
import os
import tempfile
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.shared.persistence import atomic_write_json

BACKEND_ROOT = Path(__file__).resolve().parents[2]
CONFIG_DIR = BACKEND_ROOT / "config"
DEMO_DIR = BACKEND_ROOT / "data" / "demo"
# Preferido en local; en Vercel (FS read-only) se resuelve a /tmp vía get_runtime_dir().
_RUNTIME_DIR_PREFERRED = BACKEND_ROOT / "data" / "runtime"


@lru_cache(maxsize=1)
def get_runtime_dir() -> Path:
    """Directorio escribible para runtime (encuestas, audit, evaluaciones).

    Vercel solo permite escritura en /tmp. Opcional: SAETO_RUNTIME_DIR.
    """
    candidates: list[Path] = []
    override = (os.getenv("SAETO_RUNTIME_DIR") or "").strip()
    if override:
        candidates.append(Path(override))
    candidates.append(_RUNTIME_DIR_PREFERRED)
    candidates.append(Path(tempfile.gettempdir()) / "saeto-runtime")

    for directory in candidates:
        try:
            directory.mkdir(parents=True, exist_ok=True)
            probe = directory / ".saeto_write_ok"
            probe.write_text("1", encoding="utf-8")
            probe.unlink(missing_ok=True)
            return directory
        except OSError:
            continue
    return Path(tempfile.gettempdir()) / "saeto-runtime"


# Compatibilidad con imports antiguos
RUNTIME_DIR = _RUNTIME_DIR_PREFERRED


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
        load_encuestas_indice,
        load_plantilla_encuesta,
        load_encuesta_rapida,
        load_umbrales_calor,
        load_calor_capas,
        load_corredores,
        load_panorama_plantillas,
        load_ritmo_mesa,
        load_cobertura_recomendaciones,
        load_actor_inteligencia,
        load_ia_groq,
        load_actores_seed,
        load_reivindicaciones_seed,
        load_discurso_seed,
        load_brief_seed,
        load_coyuntura_seed,
        load_indicadores_seed,
        load_encuestas_seed,
        load_encuestas_data,
        load_evaluaciones_mesa,
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
def load_encuestas_indice() -> dict[str, Any]:
    path = CONFIG_DIR / "encuestas-plantillas.json"
    if not path.exists():
        return {
            "demo": True,
            "plantillas": [
                {
                    "slug": "rapida_mesa",
                    "nombre": "Encuesta rápida de mesa",
                    "archivo": "encuesta-rapida.json",
                    "orden": 1,
                }
            ],
        }
    return _read_json(path)


@lru_cache(maxsize=16)
def load_plantilla_encuesta(slug: str) -> dict[str, Any]:
    for meta in load_encuestas_indice().get("plantillas", []):
        if meta.get("slug") == slug:
            return _read_json(CONFIG_DIR / meta["archivo"])
    raise KeyError(f"Plantilla de encuesta desconocida: {slug}")


@lru_cache(maxsize=1)
def load_encuesta_rapida() -> dict[str, Any]:
    try:
        return load_plantilla_encuesta("rapida_mesa")
    except KeyError:
        return _read_json(CONFIG_DIR / "encuesta-rapida.json")


@lru_cache(maxsize=1)
def load_umbrales_calor() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "umbrales-calor.json")


@lru_cache(maxsize=1)
def load_calor_capas() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "calor-capas.json")


@lru_cache(maxsize=1)
def load_corredores() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "corredores.json")


@lru_cache(maxsize=1)
def load_panorama_plantillas() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "panorama-plantillas.json")


@lru_cache(maxsize=1)
def load_ritmo_mesa() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "ritmo-mesa.json")


@lru_cache(maxsize=1)
def load_cobertura_recomendaciones() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "cobertura-recomendaciones.json")


@lru_cache(maxsize=1)
def load_actor_inteligencia() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "actor-inteligencia.json")


@lru_cache(maxsize=1)
def load_ia_groq() -> dict[str, Any]:
    return _read_json(CONFIG_DIR / "ia-groq.json")


def _evaluaciones_path() -> Path:
    return get_runtime_dir() / "evaluaciones_mesa.json"


@lru_cache(maxsize=1)
def load_evaluaciones_mesa() -> dict[str, Any]:
    empty = {"demo": True, "items": []}
    try:
        path = _evaluaciones_path()
        if not path.exists():
            atomic_write_json(path, empty)
        return _read_json(path)
    except OSError:
        return empty


def save_evaluaciones_mesa(data: dict[str, Any]) -> None:
    atomic_write_json(_evaluaciones_path(), data)
    clear_all_caches()


def list_plantillas_encuesta() -> list[dict[str, Any]]:
    items = list(load_encuestas_indice().get("plantillas", []))
    out: list[dict[str, Any]] = []
    for meta in sorted(items, key=lambda x: x.get("orden", 99)):
        plantilla = load_plantilla_encuesta(meta["slug"])
        out.append(
            {
                "slug": meta["slug"],
                "nombre": plantilla.get("nombre") or meta.get("nombre", meta["slug"]),
                "disclaimer": plantilla.get("disclaimer", ""),
                "orden": meta.get("orden", 99),
                "preguntas_count": len(plantilla.get("preguntas", [])),
            }
        )
    return out


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


@lru_cache(maxsize=1)
def load_encuestas_seed() -> dict[str, Any]:
    path = DEMO_DIR / "encuestas.seed.json"
    if not path.exists():
        return {"demo": True, "items": []}
    return _read_json(path)


def _encuestas_runtime_path() -> Path:
    return get_runtime_dir() / "encuestas.json"


def ensure_encuestas_runtime() -> Path:
    """Bootstrap runtime desde seed demo si aún no existe (captura de evaluación)."""
    path = _encuestas_runtime_path()
    if not path.exists():
        atomic_write_json(path, load_encuestas_seed())
    return path


@lru_cache(maxsize=1)
def load_encuestas_data() -> dict[str, Any]:
    """Lee encuestas de runtime; si el FS no permite escribir, cae al seed demo."""
    try:
        path = ensure_encuestas_runtime()
        return _read_json(path)
    except OSError:
        return load_encuestas_seed()


def save_encuestas_data(data: dict[str, Any]) -> None:
    atomic_write_json(_encuestas_runtime_path(), data)
    clear_all_caches()


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


def save_encuestas_seed(data: dict[str, Any]) -> None:
    """Solo fixtures versionados. La captura operativa usa save_encuestas_data."""
    atomic_write_json(DEMO_DIR / "encuestas.seed.json", data)
    clear_all_caches()


def append_audit(entry: dict[str, Any]) -> None:
    """Auditoría best-effort: no tumba la API si el FS es read-only."""
    from datetime import datetime, timezone

    payload = {"ts": datetime.now(timezone.utc).isoformat(), **entry}
    try:
        path = get_runtime_dir() / "audit.log.jsonl"
        with path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except OSError:
        return
