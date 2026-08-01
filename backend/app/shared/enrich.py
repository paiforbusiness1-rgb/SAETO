from __future__ import annotations

from fastapi import HTTPException

from app.shared import seed_loader
from app.shared.schemas import (
    ActorDetail,
    ActorSummary,
    CicloHistorialEntry,
    ReivindicacionDetail,
    ReivindicacionSummary,
    SemaforoInfo,
)


def resolve_semaforo(intensidad: int) -> SemaforoInfo:
    for band in seed_loader.load_umbrales()["intensidad"]:
        if band["min"] <= intensidad <= band["max"]:
            return SemaforoInfo(
                semaforo=band["semaforo"],
                etiqueta=band["etiqueta"],
                intensidad=intensidad,
            )
    raise HTTPException(status_code=500, detail="Umbral de semáforo no configurado")


def _colonia_nombre(slug: str) -> str:
    for item in seed_loader.load_territorio()["colonias_demo"]:
        if item["slug"] == slug:
            return item["nombre"]
    return slug


def _zona_nombre(slug: str) -> str:
    for item in seed_loader.load_territorio()["zonas"]:
        if item["slug"] == slug:
            return item["nombre"]
    return slug


def _tema_nombre(slug: str) -> str:
    for item in seed_loader.load_catalogo_reivindicaciones()["temas"]:
        if item["slug"] == slug:
            return item["nombre"]
    return slug


def _fase_nombre(slug: str) -> str:
    for item in seed_loader.load_ciclo_vital().get("fases", []):
        if item["slug"] == slug:
            return item["nombre"]
    return slug


def enrich_actor(raw: dict, include_sensible: bool = False) -> ActorSummary:
    estimada = int(raw.get("capacidad_estimada", raw.get("capacidad_movilizacion", 0)) or 0)
    comprobada = raw.get("capacidad_comprobada")
    if comprobada is not None:
        comprobada = int(comprobada)
        display = comprobada
        fuente = "comprobada"
    else:
        display = estimada
        fuente = "estimada"
    return ActorSummary(
        slug=raw["slug"],
        nombre=raw["nombre"],
        colonia=raw["colonia"],
        zona=raw["zona"],
        colonia_nombre=_colonia_nombre(raw["colonia"]),
        zona_nombre=_zona_nombre(raw["zona"]),
        rol=raw["rol"],
        organizacion=raw["organizacion"],
        capacidad_movilizacion=display,
        capacidad_estimada=estimada,
        capacidad_comprobada=comprobada,
        fecha_comprobacion=raw.get("fecha_comprobacion"),
        metodo_comprobacion=raw.get("metodo_comprobacion"),
        tipo_actor=raw.get("tipo_actor", "liderazgo_vecinal"),
        estado_verificacion=raw.get("estado_verificacion", "declarado"),
        reivindicaciones_abiertas=raw.get("reivindicaciones_abiertas", []),
        movilizacion_display=display,
        movilizacion_fuente=fuente,
    )


def actor_detail(raw: dict, include_sensible: bool = False) -> ActorDetail:
    base = enrich_actor(raw, include_sensible=include_sensible)
    reservado = raw.get("interes_reservado") or ""
    if not include_sensible:
        reservado = None
    return ActorDetail(
        **base.model_dump(),
        notas_mesa=raw.get("notas_mesa", ""),
        reivindicaciones_nombres=[
            _tema_nombre(t) for t in raw.get("reivindicaciones_abiertas", [])
        ],
        interes_declarado=raw.get("interes_declarado", ""),
        interes_reservado=reservado,
        recursos_poder=raw.get("recursos_poder", []),
        notas_poder=raw.get("notas_poder", ""),
    )


def enrich_reivindicacion(raw: dict) -> ReivindicacionSummary:
    sem = resolve_semaforo(raw["intensidad"])
    fase = raw.get("fase_ciclo_vital", "emergencia")
    fuentes = raw.get("fuentes_evidencia") or []
    if not fuentes and raw.get("fuente"):
        fuentes = [raw["fuente"]]
    tipo = raw.get("tipo_demanda")
    if not tipo:
        tipo = "historica_latente" if raw.get("deuda_historica") else "actual_in_situ"
    return ReivindicacionSummary(
        slug=raw["slug"],
        tema=raw["tema"],
        tema_nombre=_tema_nombre(raw["tema"]),
        territorio=raw["territorio"],
        territorio_nombre=_colonia_nombre(raw["territorio"]),
        zona=raw["zona"],
        zona_nombre=_zona_nombre(raw["zona"]),
        intensidad=raw["intensidad"],
        semaforo=sem.semaforo,
        semaforo_etiqueta=sem.etiqueta,
        deuda_historica=raw.get("deuda_historica", False),
        peso_opinion=raw.get("peso_opinion", 0),
        fuente=raw.get("fuente", "campo"),
        tipo_demanda=tipo,
        fuentes_evidencia=fuentes,
        fase_ciclo_vital=fase,
        fase_ciclo_nombre=_fase_nombre(fase),
        grado_escalamiento=int(raw.get("grado_escalamiento", raw.get("intensidad", 1))),
        sentido_ciclo=raw.get("sentido_ciclo", "estable"),
        fecha_deteccion=raw.get("fecha_deteccion"),
        fecha_ultima_actualizacion_ciclo=raw.get("fecha_ultima_actualizacion_ciclo"),
    )


def reivindicacion_detail(raw: dict) -> ReivindicacionDetail:
    base = enrich_reivindicacion(raw)
    historial = []
    for entry in raw.get("historial_ciclo") or []:
        fase = entry.get("fase", "emergencia")
        historial.append(
            CicloHistorialEntry(
                fase=fase,
                fase_nombre=_fase_nombre(fase),
                fecha=entry.get("fecha", ""),
                origen=entry.get("origen", "revision"),
                nota=entry.get("nota", ""),
            )
        )
    return ReivindicacionDetail(
        **base.model_dump(),
        resumen_deuda=raw.get("resumen_deuda", ""),
        notas_ciclo=raw.get("notas_ciclo", ""),
        historial_ciclo=historial,
    )
