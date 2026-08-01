# Plan APO — Tres plantillas de encuesta (evaluación cliente)

**Estado:** IMPLEMENTADO  
**Aprobación:** «adelante aprobado» (2026-08-01)  
**Fase:** 0 (prototipo / evaluación de instrumentos)

## Objetivo

Dejar disponibles **las tres** plantillas para que el cliente las evalúe en captura:

1. `rapida_mesa` — Encuesta rápida de mesa (ya existe; se conserva)
2. `percepcion_ciudadana` — Encuesta de Percepción Ciudadana de la zona (instrumento cliente, íntegro)
3. `diagnostico_necesidades` — Encuesta de Diagnóstico de Necesidades de la zona (instrumento cliente, íntegro)

Sin PII nominal (sin nombre/teléfono). Comunidad/colonia vía catálogo territorial existente. Campos abiertos = texto libre de percepción, no identificación personal.

---

## Análisis: ¿dónde se guardan las respuestas?

### Hoy (problema)

| Qué | Ruta | Notas |
|-----|------|--------|
| Plantilla | `backend/config/encuesta-rapida.json` | Solo lectura |
| Respuestas | `backend/data/demo/encuestas.seed.json` | **Se muta in-place** al crear/editar/borrar |
| Runtime | `backend/data/runtime/` | Solo `audit.log.jsonl`; **no** hay archivo de encuestas |

Escribir capturas de evaluación del cliente en el **seed versionado** mezcla fixtures demo con datos de prueba, ensucia git y choca con el propósito del seed.

### Propuesta (Fase 0 — evaluación)

| Qué | Ruta | Control |
|-----|------|---------|
| **Plantillas (HRU)** | `backend/config/encuesta-rapida.json` | Versionado |
| | `backend/config/encuesta-percepcion-ciudadana.json` | Versionado |
| | `backend/config/encuesta-diagnostico-necesidades.json` | Versionado |
| | `backend/config/encuestas-plantillas.json` (índice: slug → archivo, nombre, orden) | Versionado |
| **Fixtures demo** | `backend/data/demo/encuestas.seed.json` | Versionado; **solo lectura** en runtime (2–3 ítems por plantilla para mostrar listados/reportes) |
| **Respuestas de captura / evaluación** | `backend/data/runtime/encuestas.json` | **Gitignored** (ya está `backend/data/runtime/`); escritura real del CRUD |

**Comportamiento de carga:**

1. Si no existe `runtime/encuestas.json` → se crea copiando el envelope del seed demo.
2. `list/get/create/update/delete` leen y escriben **solo** runtime.
3. Reiniciar evaluación: borrar `runtime/encuestas.json` (vuelve a seed limpio).

**Forma de cada respuesta (sin cambio de contrato base):**

```json
{
  "slug": "enc-2026-08-01-barrio-arriba",
  "fecha": "2026-08-01",
  "plantilla": "percepcion_ciudadana",
  "colonia": "barrio-arriba",
  "zona": "iztapalapa",
  "respuestas": { "<pregunta_slug>": "<valor|lista|numero|texto>" },
  "notas_mesa": "",
  "demo": false
}
```

El discriminador es `plantilla`. Validación y `plantilla_meta` según ese slug.

**Fase 1+ (fuera de este plan):** BD real, roles, auditoría de exportación; no se introduce ahora.

---

## Tipos de pregunta a soportar

| Tipo | Uso |
|------|-----|
| `opcion_unica` | Escalas Likert, sí/no, catálogos |
| `opcion_multiple` | Top-3 problemas/prioridades; `max_selecciones` |
| `escala` | 1–5 servicios o 1–10 desempeño (UI: radio/botones) |
| `texto` | Preguntas abiertas (máx. caracteres en config) |
| `numero` | Conservado (p. ej. personas en hogar si se modela numérico) |

Bloques (`bloque`) en config para agrupar en UI (I Datos, II Calidad de vida, …).

---

## Backend

- `seed_loader`: `load_plantillas_encuesta()` / `load_plantilla_encuesta(slug)`; `load/save_encuestas_runtime` con bootstrap desde seed; deprecar hardcode de solo `load_encuesta_rapida` en validación.
- `schemas`: `CatalogosResponse.encuestas_plantillas: list[dict]` (o mapa); mantener `encuesta_rapida` como alias de la rápida por compat.
- `encuestas/service`: validar según plantilla del payload; filtro listado `?plantilla=`; summary genérico (`edad`/`sexo` si existen en respuestas; no romper si faltan).
- `reportes/encuestas`: agregados **por plantilla** (selector o secciones); top problemas solo si la plantilla tiene pregunta de prioridades conocida (`problemas_prioridad` / `principales_problemas` / `prioridades_comunidad` vía slug en config).
- API: `GET /api/encuestas/plantillas` (opcional; también vía catalogos) + filtro `plantilla` en listado.

## Frontend

- Captura: **selector de plantilla** al crear; formulario dinámico por bloques; render `escala` y `texto`.
- Listados: badge/filtro por plantilla; copy “Encuestas” (no solo “rápidas”).
- Detalle/reporte: usan `plantilla_meta` de la respuesta.
- Hubs/nav: texto que indique las tres plantillas disponibles para evaluación.

## Datos demo

- Ampliar seed con 1–2 respuestas demo por plantilla nueva (anonimizadas, `demo: true`).
- Rápida: conservar las 10 actuales al bootstrap inicial.

## Fuera de alcance

- PDF/export formal, SSO, GIS, API INEGI.
- PII nominal, firma biométrica, panel ciudadano público.
- Sustituir INEGI / levantamientos oficiales (disclaimer en cada plantilla).

## Criterios de aceptación

1. Cliente puede elegir las 3 plantillas en Captura → Encuestas → Nueva.
2. Cada instrumento refleja secciones/preguntas/opciones del cliente (placeholders `(zona)` resueltos a “esta zona” / colonia en copy UI).
3. Guardar/editar/listar/detalle/reporte funcionan; respuestas nuevas viven en `runtime/encuestas.json`.
4. Sin nombre/teléfono en formularios.
5. `npm run build` OK; smoke `GET/POST /api/encuestas` con `plantilla=percepcion_ciudadana`.

## Archivos principales a tocar

Config ×4 · `seed_loader.py` · `schemas.py` · `meta.py` · `encuestas/service.py` · `encuestas` routes · `reportes/service.py` · seed demo · `CapturaEncuestasPages.tsx` · `EncuestasPages.tsx` · `ReporteEncuestasPage.tsx` · types/client · hubs/copy · este plan → IMPLEMENTADO tras aprobación.
