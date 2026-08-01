# SAETO — Especificaciones funcionales P0 → P2

**Estado:** BORRADOR PARA CONTRASTE (Gemini / mesa técnica)  
**Fecha:** 2026-07-31  
**Alcance:** 5 entregables priorizados. **Sin codificación** hasta acuerdo explícito.  
**Idioma de producto:** territorio, actores, reivindicaciones, coyuntura — no licitaciones.

---

## 0. Mapa de los 5 entregables

| ID | Prioridad | Nombre corto | Pregunta de decisión que responde |
|---|---|---|---|
| **E1** | P0 | Ciclo vital + fuente de evidencia de la demanda | ¿Qué tan caliente está y con qué evidencia lo sabemos? |
| **E2** | P0 | Movilización estimada vs comprobada | ¿Cuánto puede mover el actor… y qué está verificado? |
| **E3** | P1 | Bitácora CÓMO (acción → respuesta → reacción → resultado) | ¿Qué pasó, qué hizo el Estado y qué siguió? |
| **E4** | P1 | Discurso en rúbricas de mesa | ¿Qué narrativa, emoción y frontera nosotros/ellos empuja? |
| **E5** | P2 | Poder + intereses reservados + cruce INEGI | ¿Con qué recursos cuenta y qué dice el contexto estadístico? |

**Dependencias:** E1 y E2 no dependen de E3–E5. E3 se engancha a demandas/actores. E4 se engancha a actores (y opcionalmente demandas). E5 amplía actores + observatorio referencial.

---

## E1 — P0 · Ciclo vital y fuente de evidencia (QUÉ)

### Objetivo
Clasificar cada reivindicación por **tipo temporal** (actual / histórica latente), **fuente de evidencia** y **fase del ciclo vital** (escalamiento / desescalamiento).

### Actores de uso
Capturista, analista, gerencia (solo lectura en sala/reportes).

### Campos / rúbricas (obligatorios salvo nota)

| Campo | Tipo | Valores / reglas |
|---|---|---|
| `tipo_demanda` | enum | `actual_in_situ` \| `historica_latente` |
| `fuentes_evidencia[]` | multi-enum | `percepcion_local` \| `encuesta_opinion` \| `inegi_referencia` \| `bd_gobierno` \| `campo` |
| `fase_ciclo_vital` | enum | ver catálogo abajo |
| `grado_escalamiento` | int 1–5 | 1=contenida … 5=crisis / alto escalamiento |
| `sentido_ciclo` | enum | `escalando` \| `estable` \| `desescalando` |
| `fecha_deteccion` | date | cuándo entra al radar |
| `fecha_ultima_actualizacion_ciclo` | date | última revisión de fase |
| `notas_ciclo` | texto corto | opcional; lenguaje de mesa |

#### Catálogo `fase_ciclo_vital` (propuesta)

1. `emergencia` — aparece en percepción / primer foco  
2. `articulacion` — ya hay actor o narrativa asociada  
3. `movilizacion` — acciones públicas recurrentes  
4. `negociacion` — mesa / canal institucional abierto  
5. `resolucion_parcial` — concesión o avance incompleto  
6. `latencia` — sin resolución; baja visibilidad pero viva  
7. `cierre` — desescalada sostenida / cuenta saldada (raro; auditable)

### Reglas de negocio
- Semáforo actual **no se elimina**; convive con ciclo. Semáforo = urgencia visual; ciclo = trayectoria.  
- Si `tipo_demanda = historica_latente` y no hay fase, default sugerido: `latencia`.  
- `inegi_referencia` **no implica** que SAETO levantó el dato INEGI: es marca de cruce/contexto (detalle en E5).  
- Cambios de fase deben ser **idempotentes** por `(slug_demanda, fase, fecha)` en bitácora mínima de ciclo (append-only ligera).

### UI
- Captura reivindicación: bloque “Evidencia y ciclo”.  
- Sala / Reportes: KPI de focos por fase + sentido (escalando/desescalando).  
- Ficha: timeline corto de cambios de fase (Capa 2).

### Criterios de aceptación E1
- [ ] Crear/editar demanda con tipo, fuentes, fase, grado y sentido.  
- [ ] Filtrar listado por fase y por fuente.  
- [ ] Brief/reportes muestran conteo por fase y “escalando”.  
- [ ] Seeds demo actualizados; sin hardcode de fases en JSX.

---

## E2 — P0 · Movilización estimada vs comprobada (QUIÉN)

### Objetivo
Separar en la ficha de actor la **capacidad estimada** de la **comprobada**, con trazabilidad de verificación.

### Campos

| Campo | Tipo | Reglas |
|---|---|---|
| `capacidad_estimada` | int ≥ 0 | lo que se declara / intelligence previa |
| `capacidad_comprobada` | int ≥ 0 \| null | solo si hay verificación |
| `fecha_comprobacion` | date \| null | obligatoria si hay comprobada |
| `metodo_comprobacion` | enum \| null | `campo` \| `conteo_evento` \| `fuente_oficial` \| `otra` |
| `estado_verificacion` | enum | `declarado` \| `corroborado` \| `en_revision` (amplía el actual) |
| `tipo_actor` | enum | `liderazgo_vecinal` \| `organizacion` \| `movimiento` \| `actor_institucional` \| `generador_violencia` \| `otro` |

### Reglas
- Reportes de “mapa de poder” priorizan **comprobada** si existe; si no, estimada con etiqueta “no verificada”.  
- `generador_violencia` exige rol de acceso ≥ analista sensible (preparar flag; enforcement pleno en E5).  
- No mostrar IDs técnicos al usuario final.

### Criterios de aceptación E2
- [ ] Formulario de actor con ambos campos y método.  
- [ ] Ranking visual distingue estimado vs comprobado.  
- [ ] Regla: no se puede poner comprobada sin fecha y método.

---

## E3 — P1 · Bitácora CÓMO (coyuntura)

### Objetivo
Registrar la cadena:

**Acción del actor → Retroalimentación gubernamental → Reacción a propuestas → Resultados/consecuencias**

ligada a demanda y/o actor.

### Entidad `evento_coyuntura`

| Campo | Tipo | Valores |
|---|---|---|
| `slug` | string | único |
| `fecha` | date/datetime | |
| `actor_slug` | ref opcional | |
| `demanda_slug` | ref opcional | al menos uno de actor/demanda |
| `tipo_accion` | enum | `reunion` \| `mitin` \| `manifestacion` \| `bloqueo` \| `planton` \| `comunicado` \| `violencia` \| `otra` |
| `descripcion_accion` | texto | |
| `respuesta_gobierno` | enum | `mesa_negociacion` \| `concesion` \| `negativa` \| `silencio` \| `represion` \| `otra` \| `no_aplica` |
| `detalle_respuesta` | texto | |
| `reaccion` | enum | `aceptacion_total` \| `aceptacion_parcial` \| `rechazo_total` \| `rechazo_parcial` \| `diferimiento` \| `no_aplica` |
| `resultado` | texto | consecuencias observadas |
| `impacto_ciclo` | enum opcional | si actualiza fase de la demanda |
| `fuentes[]` | multi | `campo` \| `medios` \| `bd_gobierno` \| `otra` |
| `demo` | bool | |

### Reglas
- Un evento no calcula solo; puede **proponer** cambio de fase (operador confirma).  
- Tipologías violentas: mismo control de sensibilidad que actores.  
- Listados cronológicos en ficha de demanda y de actor.

### UI
- Módulo o sección **Coyuntura / Acciones** bajo Captura.  
- Reporte: línea de tiempo + conteo por tipo de acción y por tipo de respuesta.

### Criterios de aceptación E3
- [ ] CRUD de eventos coyuntura.  
- [ ] Vista timeline en demanda y actor.  
- [ ] Reporte gerencial con distribución de acciones/respuestas/reacciones.

---

## E4 — P1 · Discurso en rúbricas de mesa

### Objetivo
Sustituir (en UX) el lenguaje solo académico por rúbricas del cliente, manteniendo compatibilidad con los 7 niveles como Capa 2 opcional.

### Rúbricas de captura (Capa 1 — obligatorias en ficha discurso)

| Rúbrica | Campo | Notas |
|---|---|---|
| Narrativas que difunden | `narrativas` (texto / tags) | |
| Argumentos que sostienen | `argumentos` | |
| Ideología que proclaman | `ideologia` | catálogo + texto libre corto |
| Emociones que manifiestan | `emociones[]` | ej. enojo, miedo, orgullo, esperanza, agravio |
| Relaciones endo-grupo | `endo_grupo` | normas/lealtades internas |
| Relaciones exo-grupo | `exo_grupo` | enemigo / interlocutor / indiferente |
| Coaliciones posibles | `coaliciones_posibles` | **siempre** marcadas como `hipotesis_mesa: true` |

### Compatibilidad
- `niveles{}` (7 niveles) permanece como Capa 2 colapsable.  
- Mapeo documental (no automático LLM en P1): narrativa↔narrativo, argumentos↔retórico, ideología↔ideológico, emociones↔pathos/léxico, endo/exo↔polarización.

### Criterios de aceptación E4
- [ ] Formulario y ficha muestran rúbricas de mesa primero.  
- [ ] Coaliciones etiquetadas como hipótesis.  
- [ ] Reporte de discurso: nubes/conteos de emociones + tabla narrativas (sin LLM obligatorio).

---

## E5 — P2 · Poder, intereses reservados y cruce INEGI

### Objetivo (dos sub-entregables unidos por sensibilidad/contexto)

#### E5a — Portafolio de poder e intereses
| Campo | Visibilidad |
|---|---|
| `interes_declarado` | general (rol mesa+) |
| `interes_reservado` | solo rol `analista_sensible` / `admin` |
| Recursos de poder (checklist + nota): movilización, financiamiento, respaldo político, mediático, legitimidad, autoridad moral, prestigio, despliegue violencia, otros | violencia/financiamiento → sensible |

#### E5b — Capa referencial INEGI
- No es encuesta SAETO.  
- Entidad `indicador_contexto`: territorio, clave indicador, valor, año, fuente=`INEGI`, url/nota.  
- Cruce en Observatorio: “contexto estadístico” al lado de percepción local.  
- Reporte: brecha percepción vs indicador (cuando ambos existan), con disclaimer metodológico.

### Seguridad (obligatoria en E5)
- Roles mínimos: `lector` \| `capturista` \| `analista` \| `analista_sensible` \| `admin`.  
- En Fase demo: gate simple (selector de rol + disclaimer) si aún no hay auth real; **nunca** exponer reservado en demos públicas.  
- Auditoría de lectura/export de campos sensibles (log append-only).

### Criterios de aceptación E5
- [ ] Campos de poder e intereses en actor; reservado oculto sin rol.  
- [ ] Alta de indicadores INEGI de contexto por territorio.  
- [ ] Vista de cruce con disclaimer.  
- [ ] Log de acceso a reservado.

---

## Requisitos no funcionales (todos los entregables)

- HRU: catálogos de enums en `config/`, no literales mágicos de negocio en UI.  
- Anti-God-Object: servicios por módulo (`observatorio`, `actores`, `discurso`, `coyuntura`, `reportes`).  
- U-First: selects y botones; cero IDs; siempre Volver/Guardar/Cancelar.  
- Persistencia: JSON (como hoy) hasta decisión de SQLite/Postgres.  
- Vercel: escritura puede no persistir; documentar; E3–E5 de captura orientados a entorno con disco escribible.  
- Sin MCP/RAG/LLM obligatorio.

---

## Fuera de alcance (hasta nuevo acuerdo)

- App móvil nativa  
- GIS/mapas cartográficos pesados  
- Auth institucional SSO  
- Ingesta automática masiva INEGI por API (E5b es carga/catálogo referencial)  
- Modelos predictivos de coalición automatizados  

---

*Fin SPECS P0–P2 · SAETO*
