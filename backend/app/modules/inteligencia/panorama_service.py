"""Panorama situacional por territorio (composición de capas existentes)."""

from __future__ import annotations

from app.modules.actores import service as actores_service
from app.modules.coyuntura import service as coyuntura_service
from app.modules.encuestas import service as encuestas_service
from app.modules.inteligencia import calor_service
from app.modules.inteligencia.schemas import PanoramaTerritorial
from app.modules.observatorio import service as observatorio_service
from app.shared import seed_loader


def _zona_nombre(slug: str | None) -> str:
    if not slug:
        return "Zona Oriente"
    for z in seed_loader.load_territorio().get("zonas", []):
        if z["slug"] == slug:
            return z["nombre"]
    return slug


def _colonia_nombre(slug: str | None) -> str:
    if not slug:
        return ""
    for c in seed_loader.load_territorio().get("colonias_demo", []):
        if c["slug"] == slug:
            return c["nombre"]
    return slug


def panorama(
    zona: str | None = None,
    colonia: str | None = None,
) -> PanoramaTerritorial:
    zona = zona or None
    colonia = colonia or None
    if colonia and not zona:
        for c in seed_loader.load_territorio().get("colonias_demo", []):
            if c["slug"] == colonia:
                zona = c["zona"]
                break

    reivs = observatorio_service.list_reivindicaciones()
    if colonia:
        reivs = [r for r in reivs if r.territorio == colonia]
    elif zona:
        reivs = [r for r in reivs if r.zona == zona]

    conteo = {"verde": 0, "amarillo": 0, "rojo": 0}
    conteo_ciclo: dict[str, int] = {}
    escalando = 0
    for r in reivs:
        conteo[r.semaforo] = conteo.get(r.semaforo, 0) + 1
        conteo_ciclo[r.fase_ciclo_vital] = conteo_ciclo.get(r.fase_ciclo_vital, 0) + 1
        if r.sentido_ciclo == "escalando":
            escalando += 1

    demanda_slugs = {r.slug for r in reivs}
    eventos = [
        e
        for e in coyuntura_service.list_eventos()
        if (e.demanda and e.demanda in demanda_slugs)
        or (
            colonia
            and e.actor
            and any(a.slug == e.actor and a.colonia == colonia for a in actores_service.list_actores())
        )
        or (
            zona
            and not colonia
            and e.actor
            and any(a.slug == e.actor and a.zona == zona for a in actores_service.list_actores())
        )
    ][:8]

    actores = actores_service.list_actores()
    if colonia:
        actores = [a for a in actores if a.colonia == colonia]
    elif zona:
        actores = [a for a in actores if a.zona == zona]
    actores = sorted(actores, key=lambda a: -a.movilizacion_display)[:6]

    indicadores = observatorio_service.list_indicadores()
    if colonia:
        indicadores = [i for i in indicadores if i.territorio == colonia]
    elif zona:
        indicadores = [i for i in indicadores if i.zona == zona]

    encuestas = []
    try:
        encuestas = encuestas_service.list_encuestas()
        if colonia:
            encuestas = [e for e in encuestas if e.colonia == colonia]
        elif zona:
            encuestas = [e for e in encuestas if e.zona == zona]
    except Exception:
        encuestas = []

    calor = calor_service.mapa_calor(capa="compuesta")
    intensidad = None
    if colonia:
        intensidad = next((c for c in calor.celdas if c.colonia_slug == colonia), None)
    elif zona:
        intensidad = next((c for c in calor.por_zona if c.zona_slug == zona), None)

    territorio_label = _colonia_nombre(colonia) or _zona_nombre(zona)
    plantilla = seed_loader.load_panorama_plantillas().get(
        "plantilla_resumen",
        "Panorama de {territorio}.",
    )
    resumen = plantilla.format(
        territorio=territorio_label,
        banda=(intensidad.banda_nombre if intensidad else "sin dato"),
        score=(intensidad.score if intensidad else 0),
        n_reivs=len(reivs),
        n_escalando=escalando,
        n_eventos=len(eventos),
        n_actores=len(actores),
    )

    return PanoramaTerritorial(
        demo=True,
        zona_slug=zona,
        zona_nombre=_zona_nombre(zona),
        colonia_slug=colonia,
        colonia_nombre=_colonia_nombre(colonia),
        resumen_ejecutivo=resumen,
        intensidad=intensidad,
        conteo_semaforo=conteo,
        conteo_ciclo=conteo_ciclo,
        escalando=escalando,
        top_reivindicaciones=[
            {
                "slug": r.slug,
                "tema_nombre": r.tema_nombre,
                "territorio_nombre": r.territorio_nombre,
                "semaforo": r.semaforo,
                "semaforo_etiqueta": r.semaforo_etiqueta,
                "fase_ciclo_nombre": r.fase_ciclo_nombre,
                "sentido_ciclo": r.sentido_ciclo,
            }
            for r in sorted(reivs, key=lambda x: (-x.grado_escalamiento, -x.peso_opinion))[:6]
        ],
        eventos_recientes=[
            {
                "slug": e.slug,
                "fecha": e.fecha,
                "tipo_accion_nombre": e.tipo_accion_nombre,
                "actor_nombre": e.actor_nombre,
                "demanda_nombre": e.demanda_nombre,
            }
            for e in eventos
        ],
        actores_clave=[
            {
                "slug": a.slug,
                "nombre": a.nombre,
                "rol": a.rol,
                "colonia_nombre": a.colonia_nombre,
                "movilizacion_display": a.movilizacion_display,
                "movilizacion_fuente": a.movilizacion_fuente,
            }
            for a in actores
        ],
        indicadores_contexto=[
            {
                "slug": i.slug,
                "nombre": i.nombre,
                "valor": i.valor,
                "anio": i.anio,
                "territorio_nombre": i.territorio_nombre,
            }
            for i in indicadores[:6]
        ],
        pulso_encuestas={
            "total": len(encuestas),
            "colonias_cubiertas": len({e.colonia for e in encuestas}),
            "enlace_captura": "/captura/encuestas",
        },
    )
