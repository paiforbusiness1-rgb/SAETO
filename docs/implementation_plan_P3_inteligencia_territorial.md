# Plan de implementación — SAETO P3 · Inteligencia territorial operativa

**Estado:** IMPLEMENTADO EN LOCAL (2026-08-13) — probar en local antes de GitHub  
**Fecha:** 2026-08-13  
**Specs:** `docs/SAETO_SPECS_P3_INTELIGENCIA_TERRITORIAL.md`  
**Arquitectura:** `docs/SAETO_ARQUITECTURA_P3_INTELIGENCIA_TERRITORIAL.md`  
**Insumo:** patrones de `C:\SAETO-main\data_fase_2` (León, Puebla, Aguascalientes, Yucatán)  
**Fase:** extensión operativa sobre monorepo actual (FastAPI + React). Seeds demo Oriente; sin BD reales ni LLM/MCP obligatorio.

**Verificación local:** servicios inteligencia OK (calor/panorama/corredores/cobertura/sala/eval); brief sin regresión; `npm run build` OK.

---

## 1. Diagnóstico APO

### 1.1 Qué ya existe (no reinventar)

| Capacidad | Estado actual |
|---|---|
| Sala brief Capa 1 | `dashboard` operativo |
| Reivindicaciones + ciclo + semáforo | P0 E1 |
| Actores movilización dual + tipos | P0 E2 |
| Coyuntura bitácora CÓMO | P1 E3 |
| Discurso rúbricas mesa | P1 E4 |
| Poder / INEGI / rol demo | P2 E5 (parcial o entregado según rama) |
| Encuestas plantillas | módulo `encuestas` |
| Territorio alcaldías + colonias demo | `config/territorio.json` |
| Reportes gerenciales | módulo `reportes` |

### 1.2 Gap vs “máquina de inteligencia” (data_fase_2)

| Capacidad detectada | ¿Existe hoy? | Entregable P3 |
|---|---|---|
| Panorama situacional unificado por territorio | No | E6 |
| Mapa de calor multicapa + bandas | No (solo semáforo por demanda) | E7 |
| Corredores / tramos críticos | No | E8 |
| Sala con paneles Registro–Análisis–Reporte–Priorización | Parcial (solo brief) | E9 |
| Sectorización / cobertura priorizada | No | E10 |
| Ficha inteligencia actor (zona, red, riesgo) | Parcial (E5) | E11 |

### 1.3 Cadena de impacto

```
UI inteligencia + dashboard
  → /api/inteligencia/* + extensiones actores/coyuntura/brief/reportes/catalogos
    → inteligencia/{panorama,calor,corredores,cobertura}_service
      → lee servicios existentes (observatorio, actores, coyuntura, encuestas)
      → config umbrales/capas/corredores/plantillas
      → runtime evaluaciones_mesa + audit
```

### 1.4 Efectos secundarios / archivos periféricos

| Área | Archivos impactados |
|---|---|
| Backend nuevo | `app/modules/inteligencia/*`, `api/routes/inteligencia.py` |
| Backend extensión | `schemas.py`, `coyuntura/service`, `actores/service`, `dashboard/service`, `reportes/service`, `catalogos/service`, `main.py` (include router) |
| Config nuevo | `umbrales-calor.json`, `calor-capas.json`, `corredores.json`, `panorama-plantillas.json`, `ritmo-mesa.json`, `cobertura-recomendaciones.json`, `actor-inteligencia.json` |
| Seeds | `coyuntura.seed.json`, `actores.seed.json`, opcional `reivindicaciones.seed.json` (corredores) |
| Frontend nuevo | `modules/inteligencia/*`, rutas, nav |
| Frontend extensión | `DashboardPage`, `client.ts`, `types.ts`, captura coyuntura (select corredor) |
| Docs | SPECS/ARQ P3 (este plan); README mención módulo Inteligencia |
| Fuera | No tocar reglas `.cursor/rules`, no importar PPTX/PDF de otros estados como hechos |

### 1.5 Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| God-object en `inteligencia` | 4 services + fachada; alertar >600 líneas |
| Romper brief | campos nuevos **opcionales**; test shape mínima |
| Confundir SAETO con C4 policial | copy UX: “cobertura de mesa”, “calor territorial”, nunca “patrulla/despacho” |
| Filtrar datos sensibles | reutilizar `seguridad`; agregados en calor |
| Sobre-ingeniería GIS | Demo: mapa SVG/GeoJSON propio **visible**. Licencia comercial diferida a arranque real; scores desacoplados del render |

---

## 2. Objetivo de la entrega P3

Convertir SAETO en **máquina de inteligencia y seguridad territorial** Oriente CDMX donde la mesa:

1. Localiza calor,  
2. Abre panorama,  
3. Cruza corredor/actor,  
4. Registra ritmo de evaluación,  
5. Obtiene priorización de cobertura,

…en lenguaje de territorio/reivindicaciones/coyuntura, con HRU y U-First.

---

## 3. Slices de implementación (orden obligatorio)

### Slice A — Cimientos HRU (E7 config + esqueleto módulo)

**Hacer**

- Crear `modules/inteligencia/` + router vacío `/api/inteligencia/health` o `/calor` stub.  
- Añadir configs: `umbrales-calor.json`, `calor-capas.json`.  
- Exponer vía `catalogos`.  
- Wire `main.py`.

**No hacer:** UI completa, ni scores finales.

**Verificación:** health + GET catálogo calor.

---

### Slice B — Calor territorial (E7)

**Hacer**

- `calor_service`: score por colonia/zona desde reivs + coyuntura (+ pesos).  
- `GET /api/inteligencia/calor` y `/calor/top`.  
- UI `CalorPage` + **mapa demo visible** (`MapaCalorTerritorial` SVG/GeoJSON Oriente) + leyenda + lista Top 10.  
- Semillas: asegurar distribución de bandas en demo (el mapa debe verse “vivo”, no monocromo).

**Verificación:** el mapa se colorea por banda; al cambiar capa recalcula; umbrales solo desde config; click abre panorama.

---

### Slice C — Panorama (E6)

**Hacer**

- `panorama_service` + plantillas config.  
- `GET /api/inteligencia/panorama`.  
- UI `PanoramaPage` con secciones y vacíos accionables.  
- CTA desde calor (click celda).

**Verificación:** panorama Iztapalapa / Barrio Arriba con 6 capas o vacíos claros.

---

### Slice D — Corredores (E8)

**Hacer**

- `corredores.json` demo Oriente.  
- Extender schema coyuntura (+ opcional reivs).  
- Captura: select corredor/tramo.  
- `corredores_service` + UI + reporte.

**Verificación:** evento con corredor aparece en ranking.

---

### Slice E — Sala operativa (E9)

**Hacer**

- `GET /api/inteligencia/sala` o ampliar brief con bloque opcional.  
- Dashboard: 4 paneles Registro / Análisis / Reporteador / Priorización.  
- `evaluaciones_mesa` POST/GET + `ritmo-mesa.json`.

**Verificación:** mesa recorre los 4 paneles sin callejón; Recalcular OK.

---

### Slice F — Cobertura (E10)

**Hacer**

- `cobertura_service` desde scores calor.  
- UI listado prioridades + recomendaciones catálogo.  
- Enlace a panorama.

**Verificación:** orden por prioridad estable con mismos seeds.

---

### Slice G — Inteligencia de actor sensible (E11)

**Hacer**

- Campos actor + catálogo.  
- Filtro rol + audit al leer sensibles.  
- UI ficha (Capa 2) y captura condicionada.

**Verificación:** rol lector no ve red/riesgo; audit escribe línea.

---

### Slice H — Reportes P3 + no-regresión + docs README

**Hacer**

- Reportes calor / corredores.  
- Smoke P0–P2 + build.  
- Actualizar README / manual breve (solo si se aprueba alcance docs).

---

## 4. Fuera de alcance de esta aprobación

- Ingesta de PPTX/PDF de otros estados como datos Oriente.  
- Despacho policial, IPH, radio, SESNSP en vivo.  
- LLM/MCP/RAG.  
- Auth SSO.  
- Migración SQL.  
- Compra de licencia GIS comercial (decisión post-autorización de proyecto real; demo con mapa propio).

---

## 5. Criterios de aceptación globales (DoD P3)

- [ ] SPECS E6–E11 con checks de aceptación cumplidos en demo.  
- [ ] Módulo `inteligencia` solo compone; master data intacta en dueños.  
- [ ] Cero umbrales/capas hardcodeados en JSX/servicios (leen config).  
- [ ] Brief y reportes previos sin regresión.  
- [ ] Copy de producto: territorio / mesa / calor / cobertura — no jerga de patrulla.  
- [ ] U-First: Volver / Recalcular / Editar en vistas nuevas.  
- [ ] Sensibles protegidos por rol + audit.

---

## 6. Estimación relativa (orientativa)

| Slice | Esfuerzo relativo | Dependencia |
|---|---|---|
| A | S | — |
| B | M | A |
| C | M | A, B (CTA) |
| D | M | A |
| E | M | B, C (widgets) |
| F | S–M | B |
| G | M | seguridad E5 |
| H | S | B–G |

Orden recomendado de primer incremento tras aprobación: **A → B → C** (valor visible de “máquina de inteligencia”), luego D/E, luego F/G/H.

---

## 7. Decisión solicitada al usuario

Para cumplir APO, **no se escribe código de dominio** hasta respuesta explícita. Opciones:

1. **Aprobar P3 completo** (slices A–H)  
2. **Aprobar solo P3-A** (slices A–C: calor + panorama + cimientos)  
3. **Ajustar** alcance / copy / capas antes de aprobar  

Respuesta esperada (ejemplo): *“Aprobado P3-A, dale”* o *“Aprobado P3 completo”*.

---

*Fin implementation_plan P3 · SAETO*
