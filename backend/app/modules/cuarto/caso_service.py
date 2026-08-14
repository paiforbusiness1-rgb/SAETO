"""Orquesta el payload de un caso de situación. No es master data."""

from __future__ import annotations

from fastapi import HTTPException

from app.modules.consumibles import tematicos_service
from app.modules.cuarto import contexto_service, impacto_service, timeline_service
from app.modules.cuarto.schemas import (
    CasoIndice,
    CasoSituacion,
    CorteTemporal,
    CuartoConfig,
    DemandaAncla,
    InstalacionPunto,
    PasoMeta,
)
from app.modules.observatorio import service as observatorio_service
from app.shared import seed_loader


def pasos_config() -> list[PasoMeta]:
    raw = seed_loader.load_cuarto_pasos().get("pasos") or []
    pasos = [PasoMeta(**p) for p in raw]
    return sorted(pasos, key=lambda p: p.orden)


def config() -> CuartoConfig:
    recs = seed_loader.load_cuarto_recomendaciones().get("por_tema") or {}
    return CuartoConfig(
        pasos=pasos_config(),
        temas_con_recomendacion=sorted(recs.keys()),
    )


def _tema_nombre(slug: str) -> str:
    for t in tematicos_service.list_temas():
        if t.slug == slug:
            return t.nombre
    return slug


def _colonia_nombre(slug: str) -> str:
    demo = tematicos_service.demografia_map().get(slug, {})
    if demo.get("nombre"):
        return str(demo["nombre"])
    for c in seed_loader.load_territorio().get("colonias_demo", []):
        if c.get("slug") == slug:
            return str(c.get("nombre") or slug)
    return slug


def _casos_raw() -> list[dict]:
    return list(seed_loader.load_casos_situacion_seed().get("items") or [])


def list_casos() -> list[CasoIndice]:
    out: list[CasoIndice] = []
    for raw in _casos_raw():
        tema = str(raw.get("tema") or "")
        out.append(
            CasoIndice(
                slug=raw["slug"],
                nombre=raw.get("nombre") or raw["slug"],
                subtitulo=raw.get("subtitulo") or "",
                tema=tema,
                tema_nombre=_tema_nombre(tema),
                resumen=raw.get("resumen") or "",
            )
        )
    return out


def _demanda_ancla(demanda_slug: str | None) -> DemandaAncla | None:
    if not demanda_slug:
        return None
    try:
        det = observatorio_service.get_reivindicacion(demanda_slug)
    except HTTPException:
        return None
    titulo = f"{det.tema_nombre} · {det.territorio_nombre}"
    return DemandaAncla(
        slug=det.slug,
        titulo=titulo,
        tema=det.tema,
        tema_nombre=det.tema_nombre,
        territorio_nombre=det.territorio_nombre,
        zona_nombre=det.zona_nombre,
        intensidad=det.intensidad,
        semaforo=det.semaforo,
        semaforo_etiqueta=det.semaforo_etiqueta,
        fase_ciclo_nombre=det.fase_ciclo_nombre,
        sentido_ciclo=det.sentido_ciclo,
        deuda_historica=det.deuda_historica,
        resumen_deuda=det.resumen_deuda,
        notas_ciclo=det.notas_ciclo,
    )


def _celdas_caso(tema: str, colonias: list[str]):
    wanted = set(colonias)
    todas = tematicos_service.celdas_tematicas(tema)
    celdas = [c for c in todas if c.colonia_slug in wanted] if wanted else todas
    por_zona = tematicos_service.agregar_por_zona(celdas)
    barras = tematicos_service.barras_desde_zonas(por_zona)
    return celdas, por_zona, barras


def _instalaciones(tema: str, colonias: list[str]) -> list[InstalacionPunto]:
    wanted = set(colonias)
    out: list[InstalacionPunto] = []
    for raw in seed_loader.load_instalaciones_territorio_seed().get("items") or []:
        if raw.get("tema") != tema:
            continue
        if wanted and raw.get("colonia") not in wanted:
            continue
        out.append(
            InstalacionPunto(
                nombre=raw.get("nombre") or "Punto",
                tipo_nombre=raw.get("tipo_nombre") or raw.get("tipo") or "Instalación",
                colonia_nombre=_colonia_nombre(str(raw.get("colonia") or "")),
                lat=float(raw["lat"]),
                lng=float(raw["lng"]),
                estado_nombre=raw.get("estado_nombre") or raw.get("estado") or "",
                nota=raw.get("nota") or "",
            )
        )
    return out


def _corte(raw: dict | None) -> CorteTemporal | None:
    if not raw:
        return None
    return CorteTemporal(
        etiqueta=str(raw.get("etiqueta") or ""),
        poblacion=int(raw.get("poblacion") or 0),
        intensidad=int(raw.get("intensidad") or 0),
        nota=str(raw.get("nota") or ""),
    )


def get_caso(slug: str) -> CasoSituacion:
    raw = next((c for c in _casos_raw() if c.get("slug") == slug), None)
    if not raw:
        raise HTTPException(
            status_code=404,
            detail="No hay un caso con ese nombre en el cuarto de situación.",
        )
    tema = str(raw.get("tema") or "")
    colonias = [str(x) for x in (raw.get("colonias") or [])]
    demanda_slug = raw.get("demanda_slug")
    celdas, por_zona, barras = _celdas_caso(tema, colonias)
    impacto = impacto_service.construir(colonias, tema)
    return CasoSituacion(
        slug=raw["slug"],
        nombre=raw.get("nombre") or raw["slug"],
        subtitulo=raw.get("subtitulo") or "",
        tema=tema,
        tema_nombre=_tema_nombre(tema),
        resumen=raw.get("resumen") or "",
        demanda=_demanda_ancla(demanda_slug),
        pasos=pasos_config(),
        celdas=celdas,
        por_zona=por_zona,
        barras_zona=barras,
        impacto=impacto,
        instalaciones=_instalaciones(tema, colonias),
        timeline=timeline_service.construir(demanda_slug),
        entonces=_corte(raw.get("entonces")),
        ahora=_corte(raw.get("ahora")),
        contexto=contexto_service.contexto(tema),
        recomendaciones=contexto_service.recomendaciones(tema),
    )
