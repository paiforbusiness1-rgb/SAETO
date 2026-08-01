# Plan de implementación SAETO — P0 → P2 (5 entregables)

**Estado:** APROBADO — oleadas P0–P2 implementadas (prototipo fullstack)  
**Aprobación:** usuario 2026-07-31 («adelante! plan aprobado!»)  
**Cierre de código:** 2026-07-31  
**Refs:** `docs/SAETO_SPECS_P0_P2.md` · `docs/SAETO_ARQUITECTURA_P0_P2.md`

---

## 1. Resumen ejecutivo

Ampliar SAETO para cubrir el marco del cliente **QUÉ / QUIÉN / DISCURSO / CÓMO** en tres oleadas:

| Oleada | Entregables | Resultado para la mesa |
|---|---|---|
| **P0** | E1 + E2 | Demandas con ciclo/evidencia; actores con movilización dual |
| **P1** | E3 + E4 | Bitácora de coyuntura; discurso en lenguaje de decisión |
| **P2** | E5 | Poder/intereses (con control) + contexto INEGI referencial |

Estimación orientativa (después del acuerdo):  
P0 ≈ 1.0–1.5 semanas · P1 ≈ 1.5–2 semanas · P2 ≈ 1.5–2 semanas  
(prototipo fullstack JSON; sin auth institucional completa).

---

## 2. APO — impacto global

### 2.1 Cadena

```
UI Captura/Fichas/Reportes
  → API REST extendida
    → services (observatorio, actores, discurso, coyuntura, reportes, seguridad)
      → config catálogos + seeds JSON (+ audit P2)
```

### 2.2 Archivos / zonas tocadas (por oleada)

**P0:**  
`schemas`, `enrich`, `observatorio/service`, `actores/service`, seeds reiv/actores, `config/ciclo-vital.json`, captura reiv/actores, reportes ciclo + actores, nav labels.

**P1:**  
nuevo `modules/coyuntura/*`, routes, seed coyuntura, config coyuntura, UI coyuntura, discurso schemas/UI/reportes, manual usuario (sección nueva).

**P2:**  
actores poder/intereses, indicadores contexto, seguridad rol+audit, reportes INEGI, disclaimers, endurecer UI sensible.

### 2.3 Efectos secundarios
- Semáforo sigue; no reemplazar por ciclo (convivencia).  
- `capacidad_movilizacion` legacy → mapear a `capacidad_estimada` con default.  
- Vercel: documentar límites de escritura.  
- Manual de usuario y README se actualizan al cerrar cada oleada.

### 2.4 Fuera de alcance de este plan
SSO, mapas GIS, LLM/MCP, ingesta API INEGI masiva, app móvil.

---

## 3. Orden de ejecución detallado

### Oleada P0 — “Radar y verificación”

#### E1 · Ciclo vital + fuentes
1. Añadir `config/ciclo-vital.json` y enums en catálogos API.  
2. Extender schema/seed reivindicaciones + migración defaults.  
3. Validaciones service (fase, sentido, fuentes).  
4. UI captura + filtros listado + badge en ficha.  
5. `GET /api/reportes/ciclo-vital` + pantalla reporte.  
6. Integrar conteos en brief/sala (Capa 1).  
7. QA checklist E1 + datos demo.

#### E2 · Movilización dual
1. Extender schema/seed actores; migrar campo legacy.  
2. Reglas comprobada ⇒ fecha+método.  
3. UI captura/ficha dual.  
4. Ampliar reporte mapa de poder.  
5. QA checklist E2.

**Puerta de salida P0:** mesa puede filtrar por fase “escalando” y ver ranking estimado vs comprobado.  
**Aprobación intermedia:** demo interna antes de abrir P1.

---

### Oleada P1 — “Trayectoria y relato”

#### E3 · Coyuntura
1. Scaffold módulo backend `coyuntura` (service+router).  
2. Seed + catálogos tipo acción/respuesta/reacción.  
3. CRUD + queries por actor/demanda.  
4. UI Captura Coyuntura + timeline embebido en fichas.  
5. Reporte coyuntura.  
6. (Opcional) botón “proponer cambio de fase” → confirma operador.  
7. QA E3.

#### E4 · Discurso mesa
1. Config rúbricas mesa.  
2. Extender seed/schema discurso.  
3. UI: bloque mesa primero; 7 niveles en Capa 2.  
4. Reporte discurso-mesa (emociones/narrativas).  
5. Actualizar manual (sección discurso).  
6. QA E4.

**Puerta de salida P1:** timeline de un conflicto demo completo + ficha discurso legible por gerencia.

---

### Oleada P2 — “Poder y contexto”

#### E5a · Poder e intereses
1. Catálogo recursos de poder.  
2. Campos actor + UI condicional.  
3. Capa seguridad: rol demo + ocultamiento reservado + audit log.  
4. QA sensibilidad (usuario lector no ve reservado).

#### E5b · INEGI referencial
1. Seed/API indicadores contexto.  
2. UI catálogo/captura de indicadores (admin).  
3. Panel cruce en observatorio + disclaimer.  
4. Reporte contexto.  
5. QA E5.

**Puerta de salida P2:** demo con rol sensible vs lector; cruce percepción vs indicador en al menos 2 territorios.

---

## 4. Plan de datos demo (narrativa continua)

Mantener personajes ficticios actuales y enriquecer:

- Agua Barrio Arriba: `historica_latente` → fase `movilizacion` / `escalando`.  
- Actor Laura: estimada 45 / comprobada 40 (campo).  
- 3–5 eventos coyuntura (mitin → mesa → aceptación parcial).  
- Discurso con emociones + endo/exo.  
- (P2) un interés reservado de ejemplo **solo** en entorno controlado.  
- (P2) 2 indicadores INEGI-like de contexto (valores demo etiquetados).

---

## 5. Pruebas y no-regresión

Por cada entregable:

- [ ] Endpoints viejos responden (compat defaults).  
- [ ] `npm run build` OK.  
- [ ] Smoke API create/read/update.  
- [ ] UI Volver/Guardar/Cancelar.  
- [ ] Reportes no rompen con seeds vacíos.  
- [ ] Manual actualizado si cambia flujo de mesa.

P2 adicional:

- [ ] Matriz de roles × campos visibles.  
- [ ] Audit log escribe al acceder reservado.

---

## 6. Entregables documentales (este paquete)

| Documento | Uso |
|---|---|
| `docs/SAETO_SPECS_P0_P2.md` | Contrato funcional vs Gemini/cliente |
| `docs/SAETO_ARQUITECTURA_P0_P2.md` | Módulos, datos, API, seguridad |
| `docs/implementation_plan_P0_P2.md` | Este plan de oleadas |
| (post-acuerdo) `implementation_plan_P0.md` etc. | Sub-planes APO antes de cada oleada de código |

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Scope creep del cliente (“todo ya”) | Oleadas P0→P2 con puertas de salida |
| Formularios inllenables | Capa 1 obligatoria / Capa 2 opcional |
| Fuga de datos sensibles | Roles + audit desde E5; no en demos públicas |
| Confusión semáforo vs ciclo | Leyendas duales en UI; capacitación en manual |
| Vercel read-only | Captura plena en entorno con disco; Vercel=vitrina |

---

## 8. Criterios de acuerdo para contrastar con Gemini

Antes de codificar, validar juntos:

1. ¿Catálogo de **7 fases** del ciclo vital es aceptable o quieren otro set?  
2. ¿E3 es módulo **Coyuntura** separado o subcarpeta de Observatorio? (propuesta: separado)  
3. ¿E4 **reemplaza** labels académicos en UI o convive siempre visible? (propuesta: mesa primero, académico colapsado)  
4. ¿E5 auth demo por selector de rol es suficiente temporalmente?  
5. ¿INEGI es solo carga manual de indicadores demo o exigen conector? (propuesta: manual/referencial)

---

## 9. Solicitud de aprobación (cuando cierren contraste)

Respuestas esperadas (ejemplos):

- `ACUERDO P0-P2 TAL CUAL` — se abren sub-planes de código por oleada  
- `ACUERDO CON CAMBIOS:` … — se actualizan SPECS/ARQ/PLAN y se recontrasta  
- `SOLO ACUERDO P0` — se congela P1–P2 y se planea solo E1+E2  
- `RECHAZO` — no se codea

**Hasta una de esas frases, no hay implementación.**

---

*Fin Plan de implementación P0–P2 · SAETO*
