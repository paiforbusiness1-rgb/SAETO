"""Orquesta payloads de láminas consumibles."""

from __future__ import annotations

from fastapi import HTTPException

from app.modules.consumibles import constructo_service, cruce_service, tematicos_service as tem
from app.modules.consumibles.schemas import ConsumibleMeta, LaminaResponse
from app.shared import seed_loader


def list_laminas() -> list[ConsumibleMeta]:
    items = seed_loader.load_consumibles_plantillas().get("laminas") or []
    out = [ConsumibleMeta(**x) for x in items]
    out.sort(key=lambda x: x.orden)
    return out


def _meta(slug: str) -> ConsumibleMeta:
    for item in list_laminas():
        if item.slug == slug:
            return item
    raise HTTPException(status_code=404, detail="Lámina no encontrada")


def _lectura(slug_lamina: str, tema: str) -> str:
    lecturas = seed_loader.load_consumibles_plantillas().get("lecturas") or {}
    if slug_lamina == "panorama-oriente":
        return lecturas.get("panorama-oriente") or ""
    return lecturas.get(tema) or lecturas.get("panorama-oriente") or ""


def _lista_nominal(d: dict) -> int:
    return int(d.get("lista_nominal") or d.get("lista_nominal_mock") or 0)


def _kpis_panorama() -> list[dict]:
    demo = tem.demografia_map()
    pob = sum(int(d.get("poblacion_total") or 0) for d in demo.values())
    casillas = sum(int(d.get("casillas") or 0) for d in demo.values())
    nominal = sum(_lista_nominal(d) for d in demo.values())
    agua = tem.celdas_tematicas("agua")
    return [
        {"label": "Población", "value": f"{pob:,}".replace(",", " ")},
        {"label": "Casillas", "value": str(casillas)},
        {"label": "Lista nominal", "value": f"{nominal:,}".replace(",", " ")},
        {
            "label": "Colonias en calor",
            "value": str(len(demo)),
        },
        {
            "label": "Máx. agua",
            "value": f"{agua[0].score:.0f}" if agua else "—",
            "hint": agua[0].colonia_nombre if agua else "",
        },
    ]


def lamina(slug: str, tema: str | None = None) -> LaminaResponse:
    meta = _meta(slug)
    temas = tem.list_temas()
    disclaimer = tem.disclaimer()
    plantillas = seed_loader.load_consumibles_plantillas()
    if plantillas.get("disclaimer"):
        disclaimer = plantillas["disclaimer"]

    tema_slug = tema or meta.tema_default or "agua"
    tema_meta = tem.tema_or_default(tema_slug)

    if meta.tipo == "panorama":
        # Vista compuesta: usa calor de agua como ancla + KPIs demográficos
        celdas = tem.celdas_tematicas("agua")
        por_zona = tem.agregar_por_zona(celdas)
        return LaminaResponse(
            disclaimer=disclaimer,
            lamina=meta,
            tema=tema_meta,
            temas_disponibles=temas,
            lectura_gerencial=_lectura(meta.slug, "agua"),
            kpis=_kpis_panorama(),
            celdas=celdas,
            por_zona=por_zona,
            barras_zona=tem.barras_desde_zonas(por_zona),
            serie_global=tem.serie_promedio("agua"),
            top=celdas[:5],
            tabla=[
                {
                    "colonia": c.colonia_nombre,
                    "zona": c.zona_nombre,
                    "agua": c.score,
                    "electoral": c.indice_electoral,
                    "densidad": c.densidad,
                }
                for c in celdas[:8]
            ],
        )

    if meta.tipo == "calor_tematico":
        celdas = tem.celdas_tematicas(tema_meta.slug)
        por_zona = tem.agregar_por_zona(celdas)
        return LaminaResponse(
            disclaimer=disclaimer,
            lamina=meta,
            tema=tema_meta,
            temas_disponibles=temas,
            lectura_gerencial=_lectura(meta.slug, tema_meta.slug),
            kpis=[
                {"label": "Tema", "value": tema_meta.nombre},
                {"label": "Colonias", "value": str(len(celdas))},
                {
                    "label": "Top",
                    "value": celdas[0].colonia_nombre if celdas else "—",
                    "hint": f"índice {celdas[0].score:.0f}" if celdas else "",
                },
                {
                    "label": "Zona más caliente",
                    "value": por_zona[0].zona_nombre if por_zona else "—",
                    "hint": f"{por_zona[0].score:.0f}" if por_zona else "",
                },
            ],
            celdas=celdas,
            por_zona=por_zona,
            barras_zona=tem.barras_desde_zonas(por_zona),
            serie_global=tem.serie_promedio(tema_meta.slug),
            top=celdas[:5],
            tabla=[
                {
                    "colonia": c.colonia_nombre,
                    "zona": c.zona_nombre,
                    "intensidad": c.score,
                    "metrica": c.metrica_valor,
                    "nota": c.nota_mesa,
                }
                for c in celdas
            ],
        )

    if meta.tipo == "cruce":
        celdas = cruce_service.celdas_cruce(tema_meta.slug)
        por_zona = tem.agregar_por_zona(celdas)
        cfg = seed_loader.load_consumibles_cruce()
        return LaminaResponse(
            disclaimer=cfg.get("disclaimer") or disclaimer,
            lamina=meta,
            tema=tema_meta,
            temas_disponibles=temas,
            lectura_gerencial=_lectura(meta.slug, tema_meta.slug),
            kpis=[
                {"label": "Tema cruzado", "value": tema_meta.nombre},
                {
                    "label": "Mayor cruce",
                    "value": celdas[0].colonia_nombre if celdas else "—",
                    "hint": f"score {celdas[0].score}" if celdas else "",
                },
                {
                    "label": "Pesos",
                    "value": "P50 · E30 · D20",
                    "hint": "problema · electoral · densidad",
                },
            ],
            celdas=celdas,
            por_zona=por_zona,
            barras_zona=[
                {
                    "label": c.colonia_nombre,
                    "value": c.score,
                    "hint": f"prob {c.intensidad_tema:.0f} · elec {c.indice_electoral:.0f}",
                    "tone": "rojo" if c.score >= 75 else "amarillo" if c.score >= 55 else "accent",
                }
                for c in celdas[:8]
            ],
            serie_global=tem.serie_promedio(tema_meta.slug),
            top=celdas[:5],
            tabla=cruce_service.tabla_cruce(celdas),
        )

    if meta.tipo == "constructo":
        celdas = tem.celdas_tematicas(tema_meta.slug)
        por_zona = tem.agregar_por_zona(celdas)
        return LaminaResponse(
            disclaimer=disclaimer,
            lamina=meta,
            tema=tema_meta,
            temas_disponibles=temas,
            lectura_gerencial=_lectura(meta.slug, tema_meta.slug),
            kpis=[
                {"label": "Problema", "value": tema_meta.nombre},
                {
                    "label": "Foco",
                    "value": celdas[0].colonia_nombre if celdas else "—",
                },
            ],
            celdas=celdas,
            por_zona=por_zona,
            barras_zona=tem.barras_desde_zonas(por_zona),
            serie_global=tem.serie_promedio(tema_meta.slug),
            top=celdas[:5],
            constructo=constructo_service.constructo(tema_meta.slug),
            tabla=[
                {
                    "colonia": c.colonia_nombre,
                    "intensidad": c.score,
                    "nota": c.nota_mesa,
                }
                for c in celdas[:8]
            ],
        )

    raise HTTPException(status_code=400, detail="Tipo de lámina no soportado")
