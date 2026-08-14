# SAETO — Especificaciones P4 · Cuarto de situación territorial

**Estado:** IMPLEMENTADO (Fase 0, seeds)  
**Fecha:** 2026-08-14  
**Insumo de contraste:** `C:\SAETO-main\data_fase_4` (PDF/PPT Aguascalientes 2021 + audios 1–3 + texto War Room)  
**Complementa:** `SAETO_SPECS_P0_P2.md`, `SAETO_SPECS_P3_INTELIGENCIA_TERRITORIAL.md` (no los reemplaza)  
**Fase:** 0 (prototipo / venta). Seeds permitidos. LLM **no obligatorio** para Capa 1.

**Principio de resignificación:** SAETO no es C4 policial, no es War Room de campaña ni sala de voceros. Es el **cuarto de situación territorial** de la mesa Oriente: construir **un problema** (agua, basura, alumbrado, seguridad) y llevarlo a **decisión** con mapa, gente afectada, bitácora y contexto de analista.

---

## 0. Lectura de `data_fase_4` → SAETO

| Capacidad en referencia | Resignificación SAETO | ¿Este P4? | Módulo dueño |
|---|---|---|---|
| Audio 1 — consumibles visibles (mapa/gráfica/cruce) | Ya cubierto por `consumibles` | Fuera (ya entregado) | `consumibles` |
| Audio 2 — video de capacitación: un problema → mapa → gente → decisiones → contexto | **Recorrido guiado “Construir un problema”** | **P4-A (núcleo)** | **`cuarto`** (nuevo) |
| Audio 3 — clic discurso / actores / afectados / decisiones | Los mismos pasos del recorrido, orquestados | P4-A | `cuarto` consume canónicos |
| PDF Aguascalientes — lámina densas de panorama | Formato de **paso** (mapa + KPI + hechos fechados), no clonar delito/estructuras criminales | P4-A visual de pasos | `cuarto` + `consumibles` (mapa/gráfica) |
| TXT War Room — escucha social, trending, medios | **Fuera de alcance P4** (otro producto) | Diferido | — |
| TXT — termómetro electoral por sección fieles/oposición | Diferido (hoy cruce sintético en consumibles) | Diferido | `consumibles` L4, no ampliar aquí |
| TXT — semáforo de promesas de campaña / gabinete | **Fuera** | Diferido | — |
| TXT — argumentarios, pauta, voceros, crisis | **Fuera** | Diferido | — |
| Mapa de instalaciones (audio 2, “si es posible”) | Capa opcional de **infraestructura temática** (pipas/tanques mock de agua) | **P4-B** | `cuarto` + seed |
| Módulo de contexto / expertise más allá del número | Capa 2: texto de analista (plantilla HRU) + IA existente **opcional** | P4-A Capa 2 | `cuarto` + `ia` (no bloquea) |

---

## 1. Mapa de entregables P4

| ID | Prioridad | Nombre | Pregunta de mesa |
|---|---|---|---|
| **E12** | P4-A | Recorrido guiado “Construir un problema” | ¿Cómo meto el agua al cuarto y decido en 8 minutos? |
| **E13** | P4-A | Caso sembrado Oriente (agua) | ¿Cuál es el caso que se recorre sin armar nada a mano? |
| **E14** | P4-B | Infraestructura temática (opcional) | ¿Dónde están pipas / tanques / puntos de abasto? |
| **E15** | P4-B | Selector de tema (mismo recorrido) | ¿Puedo repetir el mismo flujo con basura / alumbrado / seguridad? |

**Dependencias**

- E12/E13 se apoyan en P0–P3 + consumibles + coyuntura + demografía electoral seed + IA contexto (opcional).  
- E14 es seed nuevo; si no hay puntos, el paso muestra vacío accionable.  
- E15 reutiliza el mismo contrato de E12 con `tema` HRU (`consumibles-temas.json`).

**No fusionar:** `observatorio`, `actores`, `discurso`, `dashboard` siguen dueños de sus hechos. `inteligencia` sigue composición de calor/panorama. `consumibles` sigue láminas. **`cuarto` solo orquesta un recorrido.**

---

## 2. E12 — Recorrido guiado (núcleo de venta)

### Objetivo
Un flujo **U-First** tipo capacitación: la mesa **no arma el rompecabezas** entre menús. Entra a **Cuarto de situación**, elige (o abre) el caso **Agua Oriente**, y avanza:

1. **El problema** — qué es, semáforo, reivindicación ancla.  
2. **Dónde** — mapa de calor temático (reusa Leaflet / celdas de consumibles).  
3. **A quién impacta** — población, densidad, viviendas, lista nominal agregada (seed demográfico; **sin PII**).  
4. **Infraestructura** (E14; si no hay dato: “Sin puntos — Ir a captura” o “Paso opcional”).  
5. **Cuándo y qué decidió el gobierno** — timeline de coyuntura ligada (acción → respuesta → resultado).  
6. **Entonces vs ahora** — población / intensidad en dos cortes (seed de caso, no hardcode en UI).  
7. **Contexto de analista** — plantilla HRU (sequía, tandeo, cuentas pendientes). IA existente **debajo**, no sustituye Capa 1.  
8. **Decisión de mesa** — 2–4 recomendaciones de cobertura analítica (config, no patrullaje) + Volver / Recalcular.

### Actores de uso
Gerencia (recorrido), analista (recorrido + contexto), capturista (enlaces a Captura), lector (solo lectura).

### Contrato `CasoSituacion`

| Campo | Origen |
|---|---|
| `slug` / `nombre` / `tema` | seed caso + catálogo temas |
| `demanda_ancla` | observatorio (slug; UI muestra **nombre**, nunca ID) |
| `colonias[]` | territorio + seed |
| `pasos[]` | `config/cuarto-pasos.json` (orden, título, obligatorio) |
| `problema` | reiv ancla + intensidad temática |
| `celdas_mapa` / `por_zona` | `consumibles.tematicos` (composición, no master) |
| `impacto` | demografía seed (agregado) |
| `instalaciones[]` | seed E14 (opcional) |
| `timeline[]` | coyuntura filtrada por demanda/colonias |
| `entonces_vs_ahora` | seed caso (dos cortes) |
| `contexto_analista` | plantilla HRU + hechos del caso |
| `recomendaciones[]` | `config/cuarto-recomendaciones.json` |
| `enlaces` | rutas humanas (Observatorio, Consumibles, Captura) |

### Reglas
- **Solo composición.** Prohibido duplicar reivindicaciones/actores/coyuntura en un seed paralelo de hechos.  
- Pasos, textos de contexto y recomendaciones salen de **config** (HRU).  
- Cero callejones: cada paso tiene **Siguiente**, **Anterior/Volver**, **Saltar** (si el paso no es obligatorio), **Recalcular**.  
- Lenguaje de mesa: “cuarto de situación”, “problema”, “impacto”, “decisiones”. Nunca “war room”, “voceros”, “pauta”, “despacho”.  
- No enviar a LLM PII de encuestas ni `interes_reservado`. Si se usa IA, reutilizar `ia/contexto_decision` con payload ya saneado.  
- IA **no bloquea** el recorrido si Groq falla o el rol no alcanza.

### UI
- Ruta: `/cuarto` (hub de casos) y `/cuarto/:slug` (recorrido).  
- Entrada visible: nav **Cuarto de situación** + tarjeta en Inteligencia y en Sala.  
- Un viewport de trabajo: **un paso a la vez** (no dashboard de 7 paneles). Marca de progreso (“Paso 3 de 8”).  
- Mapa/gráfica reutilizan componentes existentes; no clonar Leaflet.

### Criterios de aceptación E12
- [ ] Un no-técnico recorre agua Oriente en ≤8 min sin IDs ni comandos.  
- [ ] Cada paso muestra mapa o número o timeline o texto de mesa (nunca pantalla vacía muda).  
- [ ] Volver / Siguiente / Recalcular siempre visibles.  
- [ ] Si falta coyuntura o instalaciones, vacío accionable.  
- [ ] IA opcional; el recorrido cierra sin ella.  
- [ ] No rompe calor, panorama, consumibles ni IA existentes.

---

## 3. E13 — Caso sembrado Agua Oriente

### Objetivo
Un caso **listo para ensayo de venta**, anclado a hechos ya existentes (Barrio Arriba / Iztapalapa) + seeds de problemáticas/demografía P3-consumibles.

### Contenido mínimo del seed `casos_situacion.seed.json`

- `slug`: `agua-oriente`  
- Tema `agua`  
- Demanda ancla existente (p. ej. agua Barrio Arriba)  
- Colonias del calor hídrico  
- Cortes `entonces` / `ahora` (población + intensidad)  
- Notas de contexto (sequía / tandeo) en plantilla, no en JSX  

### Criterios E13
- [ ] Abrir `/cuarto/agua-oriente` sin configuración previa.  
- [ ] El mapa de agua y los KPIs de impacto coinciden con consumibles/demografía.  
- [ ] El timeline cita eventos reales del seed de coyuntura o muestra vacío claro.

---

## 4. E14 — Infraestructura temática (P4-B)

### Objetivo
Puntos de **infraestructura de servicio** (no GIS comercial): p. ej. tanques, pipas, puntos de abasto — seed `instalaciones_territorio.seed.json`.

### Criterios E14
- [ ] El paso “Instalaciones” pinta puntos si hay seed.  
- [ ] Sin seed: mensaje + continuar.  
- [ ] No es mapa de patrullaje ni C4.

---

## 5. E15 — Mismo recorrido, otro tema (P4-B)

Selector HRU de tema (`agua` / `basura` / `alumbrado` / `seguridad`) que recarga el mismo contrato E12. Un caso por tema en seed o el caso agua + filtro tema de consumibles.

### Criterios E15
- [ ] Cambiar a basura cambia mapa, impacto y lectura.  
- [ ] No duplicar pantallas por tema.

---

## 6. Fuera de alcance (explícito)

- Escucha social, sentimiento, trending, clipping de medios.  
- Semáforo de promesas de campaña, evaluación de secretarios, voceros, pauta.  
- Termómetro electoral por sección (fieles / oposición / indecisos).  
- Clonar tablas de incidencia delictiva SSPC ni organigramas criminales del PDF.  
- GIS comercial, BD gobierno real, RAG/MCP obligatorio.  
- Reescribir `inteligencia`, `consumibles` o canónicos.

Esos ítems, si se retoman, serán **P5+ con APO propio** y no se mezclan en este recorrido.

---

## 7. Seguridad territorial

- Agregados demográficos; cero nombres/teléfonos de ciudadanos.  
- Fichas de actor en el recorrido: solo campos no sensibles (nombre público, colonia, movilización display). Interés reservado **fuera**.  
- Audit de generación IA si se dispara (reutilizar `append_audit` best-effort).  
- Validar `slug` / `tema` en el servicio (Zero Trust entre router y dominio).

---

## 8. Doble capa

| Capa | En el recorrido |
|---|---|
| **1 — Brief** | Pasos 1–6 + recomendaciones: se entiende sin IA |
| **2 — Profundidad** | Contexto analista extendido + IA + enlace a discurso/ficha | 

Capa 2 **nunca** bloquea Capa 1.

---

*SAETO P4 · Cuarto de situación territorial · Oriente CDMX · APO*
