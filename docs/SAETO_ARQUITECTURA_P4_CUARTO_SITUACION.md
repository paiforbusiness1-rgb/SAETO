# SAETO — Arquitectura P4 · Cuarto de situación territorial

**Estado:** IMPLEMENTADO (Fase 0)  
**Fecha:** 2026-08-14  
**Complementa:** `SAETO_ARQUITECTURA_P0_P2.md`, `SAETO_ARQUITECTURA_P3_INTELIGENCIA_TERRITORIAL.md` + `SAETO_SPECS_P4_CUARTO_SITUACION.md`  
**Principio:** evolucionar el monorepo FastAPI + React; **no** reescribir P0–P3 ni consumibles; **no** fusionar módulos canónicos.

---

## 1. Vista de contexto (extensión)

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuarios de mesa Oriente                  │
│         lector / capturista / analista / sensible / admin    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Frontend React (glass)                                       │
│ cuarto (recorrido guiado)  ← NUEVO                           │
│ inteligencia │ consumibles │ observatorio │ actores          │
│ discurso │ coyuntura │ dashboard │ reportes │ captura        │
└──────────────────────────────┬──────────────────────────────┘
                               │ /api/*
┌──────────────────────────────▼──────────────────────────────┐
│ FastAPI                                                      │
│ routers (despacho) → services                                │
│  ├─ cuarto/     (NUEVO: orquesta recorrido; no master data)  │
│  ├─ consumibles / inteligencia / ia                          │
│  └─ observatorio / actores / discurso / coyuntura / …        │
└───────┬──────────────────┬──────────────────┬───────────────┘
        ▼                  ▼                  ▼
  config/*.json      data/demo|runtime    audit best-effort
  (pasos, casos,     (caso + instala-     (si se dispara IA)
   recomendaciones)   ciones seed)
```

---

## 2. Módulos: qué se añade sin romper canónicos

| Módulo | Rol P4 | ¿Master data? |
|---|---|---|
| `observatorio` | Dueño de la reivindicación ancla | Sí |
| `actores` | Listado no sensible en paso impacto (opcional) | Sí |
| `discurso` | Enlace Capa 2 (“qué se ha dicho”) | Sí |
| `coyuntura` | Timeline de decisiones | Sí |
| `inteligencia` | Sin cambio de contrato | No |
| `consumibles` | Celdas de calor temático + demografía (reuso) | No (seeds ya existentes) |
| `ia` | Contexto de decisión **opcional** | No |
| `dashboard` | CTA a `/cuarto` desde sala | No |
| **`cuarto`** | **NUEVO** recorrido E12–E15 | **No** — solo composición |

**Anti-God-Object:** `cuarto` se parte en servicios:

```
backend/app/modules/cuarto/
  schemas.py
  caso_service.py          # orquesta CasoSituacion
  impacto_service.py       # población / densidad agregada
  timeline_service.py      # coyuntura filtrada
  contexto_service.py      # plantilla HRU (± IA opcional)
  __init__.py              # fachada delgada
```

Router: `backend/app/api/routes/cuarto.py` — **solo despacha**.  
Si un archivo supera ~400–600 líneas: extraer; no mezclar dominio de observatorio aquí.

---

## 3. Config HRU (nuevos archivos)

| Archivo | Contenido |
|---|---|
| `config/cuarto-pasos.json` | orden, slug, título de mesa, obligatorio, tipo de vista |
| `config/cuarto-recomendaciones.json` | textos de decisión / cobertura de mesa |
| `config/cuarto-contexto-plantillas.json` | plantillas “entonces vs ahora” y notas de analista por tema |

Reutilizar (no duplicar):

| Ya existe | Uso en P4 |
|---|---|
| `consumibles-temas.json` | catálogo agua/basura/alumbrado/seguridad |
| `consumibles-cruce.json` | bandas de color si el mapa las necesita |
| `territorio.json` | zonas / colonias |

---

## 4. Seeds (marcados `demo` / `seed` en archivo; UI sin sello)

| Archivo | Rol |
|---|---|
| `data/demo/casos_situacion.seed.json` | Caso `agua-oriente` (+ opcional otros temas en E15) |
| `data/demo/instalaciones_territorio.seed.json` | Puntos E14 (puede nacer vacío) |
| Ya existen | `problematicas_territorio.seed.json`, `demografia_electoral.seed.json`, coyuntura, reivs |

Prohibido copiar hechos de reivindicación/coyuntura al seed de caso: el caso **apunta** (`demanda_slug`, `colonia[]`).

---

## 5. Contratos API (propuesta)

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/api/cuarto/casos` | Índice de casos (nombre, tema, resumen) |
| `GET` | `/api/cuarto/casos/{slug}` | Payload completo `CasoSituacion` |
| `GET` | `/api/cuarto/casos/{slug}/paso/{paso}` | Recorte opcional por paso (si el payload completo pesa) |
| `GET` | `/api/cuarto/config` | Pasos + recomendaciones (para no hardcodear UI) |

Validación: slug/tema desconocido → 404 con mensaje de mesa, no stack.

IA: **no** nuevo endpoint si `POST /api/ia/contexto-decision` cubre Capa 2 (reiv ancla). El frontend llama IA **después** de mostrar plantilla HRU.

---

## 6. Frontend

```
frontend/src/modules/cuarto/
  CuartoHubPage.tsx          # lista de casos
  RecorridoPage.tsx          # wizard de pasos
  pasos/                     # un componente por tipo de vista (problema, mapa, impacto…)
  CuartoPages.module.css
```

Reutilizar:

- `MapaCalorTerritorial` (adaptador de celdas como en consumibles)  
- `HBarChart`  
- `IaPanel` (paso contexto, opcional)  
- `BotonVolver`

Rutas: `/cuarto`, `/cuarto/:slug` (query `?paso=` opcional para no perderse al Volver).  
Nav: etiqueta **Cuarto de situación** (U-First).

---

## 7. Cadena de impacto (APO)

```
UI RecorridoPage
  → GET /api/cuarto/casos/{slug}
    → caso_service
      → observatorio (demanda ancla)
      → consumibles tematicos (mapa)
      → demografia seed (impacto)
      → coyuntura (timeline)
      → instalaciones seed (E14)
      → plantillas HRU (contexto / recomendaciones)
      → (opcional, desde UI) POST /api/ia/contexto-decision
```

**Archivos periféricos previstos**

| Área | Impacto |
|---|---|
| `backend/app/modules/cuarto/` | **Nuevo** |
| `backend/app/api/routes/cuarto.py` + `main.py` | Registrar router |
| `backend/app/shared/seed_loader.py` | Loaders de configs/seeds nuevos |
| `frontend/src/modules/cuarto/` | **Nuevo** |
| `routes.tsx`, `GlassNav`, hubs Inteligencia/Sala | Entrada |
| `client.ts` / `types.ts` | Contratos |
| Docs | SPECS / ARQ / este plan |

**No tocar:** lógica de scores de calor, persistencia de encuestas, contratos de actores sensibles, reglas de IA safety (solo reutilizar).

---

## 8. Seguridad y Zero Trust

- Router no calcula. Servicio valida `slug`/`paso`/`tema` contra catálogo.  
- Payload de caso: **sin** `interes_reservado`, red sensible ni respuestas individuales de encuesta.  
- Runtime: no escribe (solo lectura de seeds). Compatible con FS read-only Vercel.  
- Roles: recorrido **legible por todos**; IA sigue `roles_permitidos` de `ia-groq.json`.

---

## 9. No-regresión (Fase 0)

- `GET /api/inteligencia/calor` y `/api/consumibles/laminas/calor-agua` intactos.  
- `GET /api/health` intacto.  
- Build frontend OK.  
- Smoke: `GET /api/cuarto/casos` + `GET /api/cuarto/casos/agua-oriente`.

En Fase 1+ (fuera de este plan): gemelo mínimo del contrato `CasoSituacion`.

---

## 10. Lo que esta arquitectura **rechaza**

- Acumular el recorrido dentro de `consumibles/lamina_service.py` o `inteligencia/sala_service.py` (God-Object).  
- Un “War Room” de 4 pilares políticos en el mismo módulo.  
- Hardcode de títulos de pasos o recomendaciones en JSX/Python.

---

*SAETO P4 · Arquitectura · Cuarto de situación territorial*
