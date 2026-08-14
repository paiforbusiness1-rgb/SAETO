"""Constructo de problema territorial (formato panorama de mesa)."""

from __future__ import annotations

from app.modules.consumibles import cruce_service, tematicos_service as tem
from app.shared import seed_loader


def constructo(tema: str) -> dict:
    tema_meta = tem.tema_or_default(tema)
    celdas = tem.celdas_tematicas(tema_meta.slug)
    top = celdas[:5]
    cruce = cruce_service.celdas_cruce(tema_meta.slug)[:3]
    lecturas = seed_loader.load_consumibles_plantillas().get("lecturas") or {}
    lectura = lecturas.get(tema_meta.slug) or lecturas.get("panorama-oriente") or ""

    contexto = [
        f"Tema: {tema_meta.nombre}.",
        tema_meta.descripcion,
        f"Colonias con dato: {len(celdas)} en Zona Oriente.",
    ]
    impactos = [
        "Presión sobre la mesa operativa y percepción ciudadana.",
        "Riesgo de escalamiento de reivindicaciones ligadas al tema.",
        "Cruce con densidad y lista nominal eleva prioridad política-operativa.",
    ]
    recomendaciones = [
        "Abrir panorama de la colonia top y contrastar con Captura.",
        "Priorizar cobertura de mesa (analítica), no patrullaje.",
        "Usar el cruce electoral×problema como hipótesis de trabajo.",
        "Verificar en campo antes de elevar a gerencia como hecho.",
    ]
    hechos = [
        {
            "colonia": c.colonia_nombre,
            "zona": c.zona_nombre,
            "intensidad": c.score,
            "nota": c.nota_mesa,
        }
        for c in top
    ]

    return {
        "titulo": f"Constructo · {tema_meta.nombre}",
        "flujo": [
            "Origen y contexto",
            "Mapa del problema",
            "Tendencia reciente",
            "Impactos",
            "Recomendaciones de mesa",
        ],
        "contexto": contexto,
        "lectura": lectura,
        "impactos": impactos,
        "recomendaciones": recomendaciones,
        "hechos_relevantes": hechos,
        "focos_cruce": [
            {
                "colonia": c.colonia_nombre,
                "cruce": c.score,
                "problema": c.intensidad_tema,
                "electoral": c.indice_electoral,
            }
            for c in cruce
        ],
    }
