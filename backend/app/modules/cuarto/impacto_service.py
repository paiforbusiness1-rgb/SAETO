"""Impacto agregado del caso: demografía + nombres de actores públicos."""

from __future__ import annotations

from app.modules.actores import service as actores_service
from app.modules.consumibles import tematicos_service
from app.modules.cuarto.schemas import ImpactoAgregado, ImpactoColonia
from app.shared import seed_loader


def _colonia_nombre(slug: str) -> str:
    demo = tematicos_service.demografia_map().get(slug, {})
    if demo.get("nombre"):
        return str(demo["nombre"])
    for c in seed_loader.load_territorio().get("colonias_demo", []):
        if c.get("slug") == slug:
            return str(c.get("nombre") or slug)
    return slug


def _zona_nombre(slug: str) -> str:
    for z in seed_loader.load_territorio().get("zonas", []):
        if z.get("slug") == slug:
            return str(z.get("nombre") or slug)
    return slug


def _int(value: object) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _float(value: object) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def construir(colonias: list[str], tema: str) -> ImpactoAgregado:
    demo = tematicos_service.demografia_map()
    by_colonia = {i["colonia"]: i for i in tematicos_service.items_tema(tema)}
    filas: list[ImpactoColonia] = []
    pob = 0
    viv = 0
    lista = 0
    densidades: list[float] = []

    for slug in colonias:
        row = demo.get(slug, {})
        tema_row = by_colonia.get(slug, {})
        poblacion = _int(row.get("poblacion_total"))
        viviendas = _int(row.get("viviendas"))
        lista_n = _int(row.get("lista_nominal") or row.get("lista_nominal_demo"))
        densidad = _float(row.get("densidad_hab_km2"))
        if poblacion:
            pob += poblacion
        if viviendas:
            viv += viviendas
        if lista_n:
            lista += lista_n
        if densidad:
            densidades.append(densidad)
        filas.append(
            ImpactoColonia(
                colonia_nombre=_colonia_nombre(slug),
                zona_nombre=_zona_nombre(str(row.get("zona") or tema_row.get("zona") or "")),
                poblacion=poblacion,
                densidad=densidad,
                viviendas=viviendas,
                lista_nominal=lista_n,
                metrica_clave=tema_row.get("metrica_clave"),
                metrica_valor=_float(tema_row.get("metrica_valor")),
                nota_mesa=tema_row.get("nota_mesa"),
            )
        )

    colonias_set = set(colonias)
    actores: list[str] = []
    for actor in actores_service.list_actores(rol="lector"):
        if actor.colonia in colonias_set and actor.nombre not in actores:
            actores.append(actor.nombre)

    return ImpactoAgregado(
        colonias=filas,
        poblacion_total=pob,
        densidad_promedio=round(sum(densidades) / len(densidades), 0) if densidades else None,
        viviendas_total=viv,
        lista_nominal_total=lista,
        actores=actores,
    )
