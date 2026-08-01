# SAETO — Arquitectura P0 → P2

**Estado:** BORRADOR PARA CONTRASTE (Gemini / mesa técnica)  
**Fecha:** 2026-07-31  
**Complementa:** `SAETO_SPECS_P0_P2.md`  
**Principio:** evolucionar el monorepo actual (FastAPI + React), no reescribir.

---

## 1. Vista de contexto

```
┌──────────────────────────────────────────────────────────┐
│                     Usuarios de mesa                      │
│         (lector / capturista / analista / sensible)       │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼──────────────────────────────┐
│  Frontend React (glass)                                   │
│  dashboard │ observatorio │ actores │ discurso            │
│  coyuntura │ catalogos │ captura │ reportes               │
└───────────────────────────┬──────────────────────────────┘
                            │ /api/*
┌───────────────────────────▼──────────────────────────────┐
│  Backend FastAPI                                          │
│  routers (solo despacho) → services de dominio            │
│  enrich + semáforo + ciclo + poder (reglas)               │
└───────────────────────────┬──────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   config/*.json      data/demo|runtime     logs/audit
   (catálogos HRU)    (hechos JSON)         (sensible P2)
```

---

## 2. Módulos canónicos (anti-God-Object)

| Módulo | Responsabilidad | Entregables |
|---|---|---|
| `observatorio` | Demandas, evidencia, ciclo vital, indicadores contexto | E1, E5b |
| `actores` | Fichas, movilización, tipología, poder, intereses | E2, E5a |
| `discurso` | Rúbricas de mesa + niveles Capa 2 | E4 |
| `coyuntura` | **Nuevo** bitácora CÓMO | E3 |
| `dashboard` | Brief Capa 1 (agrega slugs + lecturas) | consume E1–E4 |
| `reportes` | Agregaciones gerenciales | todos |
| `catalogos` | Enums y listas maestras | todos |
| `seguridad` | **Nuevo (P2)** roles, filtro campos, audit log | E5 |

Routers FastAPI existentes se mantienen; se añade `api/routes/coyuntura.py` y, en P2, `seguridad` o middleware de rol.

---

## 3. Modelo de datos (evolución)

### 3.1 Existente (se extiende, no se rompe)

- `reivindicaciones.seed.json` ← + campos E1  
- `actores.seed.json` ← + campos E2 (y E5a en P2)  
- `discurso.seed.json` ← + rúbricas E4  
- `brief.seed.json` ← opcionalmente filtros por fase  
- `config/*` ← nuevos catálogos de enums  

### 3.2 Nuevo

| Recurso | Archivo propuesto | Dueño |
|---|---|---|
| Eventos coyuntura | `data/demo/coyuntura.seed.json` | `coyuntura` |
| Indicadores INEGI ref. | `data/demo/indicadores_contexto.seed.json` | `observatorio` |
| Catálogo fases ciclo | `config/ciclo-vital.json` | `catalogos` |
| Catálogo tipos acción/respuesta/reacción | `config/coyuntura-catalogos.json` | `catalogos` |
| Catálogo recursos de poder | `config/poder-recursos.json` | `catalogos` |
| Rúbricas discurso mesa | `config/discurso-rubricas-mesa.json` | `catalogos` |
| Audit log | `data/runtime/audit.log.jsonl` | `seguridad` |

### 3.3 Diagrama de relaciones

```
territorio / temas (catálogo)
        │
        ▼
  reivindicacion ──────────◄──── evento_coyuntura
  (ciclo, fuentes)   1    *              │
        │                                │
        │ *                              │
        ▼                                ▼
      actor ◄────────────────────────────┘
   (movilización, tipo)
        │
        │ 1
        ▼
     discurso
  (rúbricas mesa)
        │
        ▼
 indicador_contexto (por territorio, fuente INEGI)
```

---

## 4. Capas Capa 1 / Capa 2 (calidad SAETO)

| Capa | Contenido | UX |
|---|---|---|
| **Capa 1 Brief** | Semáforo, fase ciclo, sentido escalando/desescalando, top actores (comp>est), alertas coyuntura recientes, emociones dominantes | Sala + Reportes ejecutivos |
| **Capa 2 Profundidad** | Timeline coyuntura, 7 niveles discurso, poder detallado, intereses reservados, cruce INEGI | Fichas / acordeones |

La Capa 2 **no bloquea** la Capa 1.

---

## 5. API (contratos nuevos / extendidos)

### P0
- Extender `POST/PUT /api/observatorio/reivindicaciones` con campos E1  
- Extender actores con E2  
- `GET /api/reportes/ciclo-vital` (nuevo)  
- `GET /api/reportes/actores` (ampliar estimado/comprobado)

### P1
- `GET/POST/PUT/DELETE /api/coyuntura/eventos`  
- `GET /api/coyuntura/eventos?demanda=&actor=`  
- Extender discurso write/read con rúbricas mesa  
- `GET /api/reportes/coyuntura`  
- `GET /api/reportes/discurso-mesa`

### P2
- Extender actores con poder/intereses  
- `GET/PUT /api/observatorio/indicadores-contexto`  
- `GET /api/reportes/contexto-inegi`  
- `GET/POST /api/seguridad/rol` (demo) + filtro de respuesta  
- Headers o query `X-SAETO-Rol` solo en demo controlada (documentar; no es auth fuerte)

Validación Pydantic en cada escritura; 400 con mensaje claro de mesa.

---

## 6. Frontend (estructura)

```
frontend/src/modules/
  observatorio/     # + ciclo en ficha y filtros
  actores/          # + movilización dual; luego poder
  discurso/         # rúbricas mesa primero
  coyuntura/        # NUEVO listado + form + timeline widget
  reportes/         # nuevos tableros
  catalogos/        # nuevos catálogos editables
  captura/          # enlaces a nuevas fichas
  seguridad/        # P2 selector rol demo (mínimo)
```

Componentes compartidos: `Glass*`, `SemaforoPill`, nuevo `CicloVitalBadge`, `MovilizacionDual`, `TimelineCoyuntura`.

---

## 7. Seguridad territorial (arquitectura)

```
Request → (P2) resolve_rol → service
                │
                ├─ campos públicos
                └─ campos sensibles omitidos si rol < umbral
                     + audit_log.append(rol, recurso, accion, ts)
```

Clasificación de campos:

| Nivel | Ejemplos |
|---|---|
| Público demo | nombre ficticio, tema, fase, semáforo |
| Mesa | movilización, acciones no violentas, narrativas |
| Sensible | interes_reservado, financiamiento, violencia, generador_violencia |

---

## 8. Persistencia y despliegue

| Entorno | Persistencia | Notas |
|---|---|---|
| Local / servidor con disco | JSON atómico (actual) | Captura completa |
| Vercel Services | Read-mostly | Lectura de seeds; escritura no garantizada |
| Fase posterior (opcional) | SQLite/Postgres | Fuera de este plan salvo acuerdo |

Migración de seeds: scripts de ampliación con defaults (fase `emergencia`/`latencia`, capacidad_estimada ← valor actual `capacidad_movilizacion`).

---

## 9. Reportes gerenciales objetivo

| Reporte | Entregable | Visual |
|---|---|---|
| Ciclo vital / escalamiento | E1 | KPI + barras por fase + lista “escalando” |
| Poder de movilización | E2 | Dual bar estimado vs comprobado |
| Coyuntura | E3 | Timeline + donas acción/respuesta/reacción |
| Discurso de mesa | E4 | Emociones + top narrativas |
| Contexto INEGI vs percepción | E5 | Comparativo por territorio + disclaimer |
| Sala brief | todos | Integra badges ciclo + alertas eventos |

---

## 10. Principios de no-regresión

- No eliminar endpoints actuales; solo extender schemas.  
- Front antiguo sigue funcionando si API envía defaults.  
- Cada entregable = PR/commit lógico atómico (un dominio).  
- APO: plan de entrega aprobado antes de codear cada prioridad (P0, luego P1, luego P2).

---

*Fin Arquitectura P0–P2 · SAETO*
