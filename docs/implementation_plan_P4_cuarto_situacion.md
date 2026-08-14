# Plan de implementación — SAETO P4 · Cuarto de situación territorial

**Estado:** APROBADO E IMPLEMENTADO (slices A→F, Fase 0)  
**Fecha:** 2026-08-14  
**Specs:** `docs/SAETO_SPECS_P4_CUARTO_SITUACION.md`  
**Arquitectura:** `docs/SAETO_ARQUITECTURA_P4_CUARTO_SITUACION.md`  
**Insumo:** `C:\SAETO-main\data_fase_4` (audios 2–3: recorrido de un problema; PDF solo como género visual de paso)  
**Fase:** 0. Un caso agua Oriente. Sin LLM obligatorio. Sin War Room político.

Al aprobar, implementar **solo** lo aquí listado. Efecto colateral imprevisto → detener → actualizar plan → nueva aprobación.

---

## 1. Diagnóstico APO

### 1.1 Qué ya existe (no reinventar)

| Capacidad | Dónde |
|---|---|
| Calor temático agua/basura/alumbrado/seguridad | `consumibles` + seeds problemáticas |
| Demografía / lista nominal agregada | `demografia_electoral.seed.json` |
| Mapa Leaflet Oriente | `MapaCalorTerritorial` |
| Reivindicación agua Barrio Arriba | `observatorio` |
| Coyuntura (CÓMO) | `coyuntura` |
| IA contexto de decisión | `POST /api/ia/contexto-decision` + `IaPanel` |
| Constructo lámina | `consumibles` L5 (no es recorrido guiado) |
| Sala operativa 4 paneles | `inteligencia/sala` (no es el video de capacitación) |

### 1.2 Gap vs audio 2 (lo que P4 cierra)

| Pedido | ¿Existe hoy? | Entregable |
|---|---|---|
| Meter **un** problema al cuarto y avanzar paso a paso | No (hay que saltar de menú) | E12 |
| Caso listo agua Oriente | Piezas sueltas | E13 |
| Mapa + gente impactada en la misma historia | Consumibles + demografía **separados** | E12 pasos 2–3 |
| Instalaciones | No | E14 |
| Decisiones del gobierno en fechas | Coyuntura existe, no orquestada al caso | E12 paso 5 |
| Entonces vs ahora | No | E12 paso 6 |
| Contexto/expertise más allá del número | IA + constructo, no plantilla de paso | E12 paso 7 |
| War Room 4 pilares (TXT audio 3) | No | **Fuera de este plan** |

### 1.3 Cadena de impacto

```
UI /cuarto/:slug
  → /api/cuarto/casos/{slug}
    → cuarto/caso_service
      → observatorio, consumibles.tematicos, coyuntura, seeds caso/instalaciones/demografía
      → config pasos + recomendaciones + plantillas contexto
```

### 1.4 Efectos secundarios / archivos periféricos

| Área | Archivos |
|---|---|
| Backend nuevo | `app/modules/cuarto/*`, `api/routes/cuarto.py` |
| Backend extensión | `seed_loader.py` (loaders), `main.py` (include) |
| Config nuevo | `cuarto-pasos.json`, `cuarto-recomendaciones.json`, `cuarto-contexto-plantillas.json` |
| Seeds | `casos_situacion.seed.json`, `instalaciones_territorio.seed.json` |
| Frontend nuevo | `modules/cuarto/*` |
| Frontend extensión | `routes.tsx`, `GlassNav`, `InteligenciaHubPage`, `SalaOperativaPage` (CTA), `client.ts`, `types.ts` |
| Docs | SPECS/ARQ P4 + este plan; guion 1 página |
| Fuera | No tocar `.cursor/rules`. No importar PDF SSPC como hechos. No ampliar electoral por sección. |

### 1.5 Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| God-object en un `RecorridoPage` enorme | Un componente por tipo de paso; página solo orquesta |
| Meter War Room político “de pasada” | Specs §6; copy UX vetado (voceros/pauta/promesas) |
| Romper consumibles/inteligencia | Solo lectura de sus servicios; cero refactors de scores |
| IA tumba el demo | Capa 1 sin IA; `IaPanel` opcional al final |
| IDs en UI | Solo nombres de colonia/demanda; slugs solo en URL |
| Vercel read-only | Módulo solo lectura (patrón ya resuelto en `get_runtime_dir`) |

---

## 2. Objetivo de la entrega P4

Que gerencia recorra **un problema de agua** en el cuarto de situación, vea mapa, gente, decisiones y contexto, y salga con **recomendaciones de mesa** — sin armar el relato a mano entre cinco menús.

---

## 3. Slices (orden obligatorio)

### Slice A — Cimientos HRU + esqueleto

**Hacer**

- Configs: `cuarto-pasos.json`, `cuarto-recomendaciones.json`, `cuarto-contexto-plantillas.json`.  
- Seed `casos_situacion.seed.json` (agua-oriente, punteros a demanda/colonias).  
- Loaders en `seed_loader` + `clear_all_caches`.  
- Módulo `cuarto` + router `GET /api/cuarto/casos` stub/índice.  
- Wire `main.py`.

**No hacer:** UI wizard ni instalaciones.

**Verificación:** `GET /api/cuarto/casos` lista el caso agua.

---

### Slice B — Payload completo del caso (E12 backend + E13)

**Hacer**

- `caso_service` + `impacto_service` + `timeline_service` + `contexto_service` (plantilla, sin LLM).  
- `GET /api/cuarto/casos/{slug}`.  
- Composición desde observatorio / temáticos / demografía / coyuntura.

**Verificación:** JSON de `agua-oriente` trae problema, celdas, impacto, timeline (o vacío), entonces/ahora, recomendaciones.

---

### Slice C — Recorrido UI (E12)

**Hacer**

- Hub `/cuarto` + `RecorridoPage` con progreso y Siguiente/Anterior/Volver/Recalcular.  
- Pasos 1–3, 5–8 (mapa reusa Leaflet; impacto KPIs; timeline; recomendaciones).  
- Nav + CTA desde Inteligencia y Sala.  
- Tipos en `client.ts` / `types.ts`.

**No hacer:** IA todavía; E14 puede ser placeholder “paso opcional”.

**Verificación:** recorrido agua ≤8 min; build OK; cero IDs en pantalla.

---

### Slice D — Infraestructura (E14)

**Hacer**

- Seed instalaciones agua (pocos puntos Oriente).  
- Paso 4 en mapa (círculos o marcadores).  
- Vacío accionable si el tema no tiene puntos.

**Verificación:** agua muestra puntos; otro tema sin seed no bloquea.

---

### Slice E — Contexto Capa 2 + IA opcional + E15 mínimo

**Hacer**

- Paso contexto con plantilla HRU.  
- `IaPanel` reutilizando `iaContextoDecision(demanda_ancla)` si el rol alcanza; si no, el paso igual cierra.  
- Selector de tema o segundo caso (basura) **solo si** el mismo contrato responde sin UI nueva (E15 mínimo).

**Verificación:** recorrido completo sin Groq; con rol Analista, IA no rompe Volver.

---

### Slice F — Guion + no-regresión

**Hacer**

- `docs/guion_demo_cuarto_situacion.md` (8 min).  
- Smoke: health, calor, consumibles calor-agua, cuarto casos.  
- `npm run build`.

**Verificación:** checklist §5.

---

## 4. Qué no se implementa en estos slices

- Escucha de redes, clipping, trending.  
- Promesas de campaña, gabinete, voceros.  
- Electoral por sección.  
- GIS comercial.  
- Ingesta BD real.

---

## 5. Criterios de aceptación del plan (cierre)

- [ ] `/cuarto/agua-oriente` recorre el problema hasta recomendaciones.  
- [ ] U-First: botones de mesa, sin IDs, sin callejón.  
- [ ] HRU: pasos y recomendaciones no están hardcodeados en JSX.  
- [ ] Canónicos + inteligencia + consumibles + IA previa sin regresión.  
- [ ] War Room político **no aparece** en nav ni copy.  
- [ ] Probar **en local** antes de commit/push/Vercel.

---

## 6. Guion de venta esperado (resultado)

1. Cuarto de situación → **Agua Oriente**.  
2. “El problema está aquí” (mapa).  
3. “Impacta a esta gente” (números).  
4. “El gobierno decidió esto en estas fechas” (timeline).  
5. “El analista aporta esto” (contexto; IA si hay).  
6. “Por eso la mesa prioriza…” (recomendaciones).  
7. Cierre: el mismo flujo, con su información, sin rehacer la mesa.

---

## 7. Aprobación

**Se solicita aprobación explícita** para implementar este plan (slices A→F, Fase 0).

Sin ese visto bueno no se escribe código de dominio.

---

*SAETO P4 · Plan APO · Cuarto de situación territorial*
