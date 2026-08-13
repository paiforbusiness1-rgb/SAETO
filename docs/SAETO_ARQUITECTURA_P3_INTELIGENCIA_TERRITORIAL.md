# SAETO — Arquitectura P3 · Inteligencia territorial operativa

**Estado:** BORRADOR APO — espera aprobación explícita antes de codificar  
**Fecha:** 2026-08-13  
**Complementa:** `SAETO_ARQUITECTURA_P0_P2.md` + `SAETO_SPECS_P3_INTELIGENCIA_TERRITORIAL.md`  
**Principio:** evolucionar el monorepo FastAPI + React; **no** reescribir P0–P2; **no** fusionar dominios canónicos.

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
│ dashboard(sala operativa) │ inteligencia(panorama/calor/…) │
│ observatorio │ actores │ discurso │ coyuntura │ encuestas    │
│ captura │ reportes │ catalogos │ seguridad(rol demo)         │
└──────────────────────────────┬──────────────────────────────┘
                               │ /api/*
┌──────────────────────────────▼──────────────────────────────┐
│ FastAPI                                                      │
│ routers (despacho) → services                                │
│  ├─ inteligencia/  (NUEVO: solo composición / read-models)   │
│  ├─ observatorio / actores / discurso / coyuntura / …        │
│  └─ dashboard (orquesta Capa 1; consume inteligencia)        │
└───────┬──────────────────┬──────────────────┬───────────────┘
        ▼                  ▼                  ▼
  config/*.json      data/demo|runtime    logs/audit
  (umbrales calor,   (hechos; vínculos    (E5/E11)
   corredores,        corredor en
   plantillas)        coyuntura)
```

---

## 2. Módulos: qué se añade sin romper canónicos

| Módulo | Rol P3 | ¿Master data? |
|---|---|---|
| `observatorio` | Sigue dueño de reivindicaciones + indicadores | Sí |
| `actores` | + campos E11 (inteligencia sensible) | Sí |
| `discurso` | Sin cambio de contrato obligatorio en P3-A | Sí |
| `coyuntura` | + `corredor_slug` / `tramo_slug` opcionales | Sí |
| `encuestas` | Fuente de capa `percepcion` en calor | Sí |
| `dashboard` | Sala operativa E9 (4 paneles) | No (agrega) |
| **`inteligencia`** | **NUEVO** panorama, calor, corredores ranking, cobertura | **No** — solo read-models |
| `reportes` | Reportes P3 (calor, corredores, cobertura) | No |
| `catalogos` | Expone nuevos JSON config | Config |
| `seguridad` | Reutiliza filtro rol + audit E5/E11 | Transversal |

**Anti-God-Object:** `inteligencia` se parte en servicios:

```
backend/app/modules/inteligencia/
  panorama_service.py
  calor_service.py
  corredores_service.py
  cobertura_service.py
  __init__.py          # fachada delgada para router
```

Router: `api/routes/inteligencia.py` — solo despacha.

---

## 3. Config HRU (nuevos archivos)

| Archivo | Contenido |
|---|---|
| `config/umbrales-calor.json` | bandas baja/media/alta/muy_alta |
| `config/calor-capas.json` | capas, pesos, ventana_dias default |
| `config/corredores.json` | corredores + tramos + colonias |
| `config/panorama-plantillas.json` | plantillas de resumen ejecutivo |
| `config/ritmo-mesa.json` | checklist evaluación diaria/semanal |
| `config/cobertura-recomendaciones.json` | enums de recomendación |
| `config/actor-inteligencia.json` | enums nivel_riesgo, fuente_inteligencia |

Seeds demo: **no** copiar hechos de Guanajuato/Puebla/Aguascalientes/Yucatán al Oriente. Solo patrones. Colonias ya en `territorio.json`.

---

## 4. Modelo de datos (evolución)

### 4.1 Extensiones (no rompen)

- `coyuntura.seed.json` / write schema ← `corredor_slug?`, `tramo_slug?`  
- `actores.seed.json` / write ← campos E11  
- `reivindicaciones` ← opcional `corredores: string[]`  
- `brief` (dashboard) ← widgets E9 (conteos calor, top corredores)

### 4.2 Nuevos runtime (append / upsert)

| Recurso | Archivo | Dueño |
|---|---|---|
| Evaluaciones de mesa | `data/runtime/evaluaciones_mesa.json` | `dashboard` / `inteligencia` |
| Audit sensible | `data/runtime/audit.log.jsonl` (ya previsto E5) | `seguridad` |

### 4.3 Read-models (no persistidos como hechos)

- `PanoramaTerritorial`  
- `CeldaCalor[]` / `MapaCalorResponse`  
- `CorredorRanking[]`  
- `SectorCobertura[]`  
- `SalaOperativaBrief` (extensión del brief)

### 4.4 Diagrama de flujo de composición

```
reivindicaciones ──┐
coyuntura ─────────┼──► calor_service ──► CeldaCalor / bandas
actores ───────────┤         │
encuestas ─────────┘         │
                             ▼
indicadores + todo lo anterior ──► panorama_service
corredores.json + coyuntura/reivs ──► corredores_service
calor scores ──► cobertura_service
                    │
                    ▼
              dashboard sala operativa (E9)
```

---

## 5. Capa 1 / Capa 2 en P3

| Capa | Contenido P3 |
|---|---|
| **Capa 1** | Sala: semáforo, top calor, corredores bajo presión, checklist ritmo de mesa, CTAs |
| **Capa 2** | Panorama completo, desglose de score, ficha actor sensible, timeline coyuntura por tramo |

La composición de calor/panorama **no bloquea** el brief: si un servicio falla parcialmente, el brief degrada sección a vacío accionable.

---

## 6. API propuesta

### Prefijo `/api/inteligencia`

| Método | Ruta | Entregable |
|---|---|---|
| GET | `/panorama?zona=&colonia=&desde=&hasta=` | E6 |
| GET | `/calor?capa=&desde=&hasta=` | E7 |
| GET | `/calor/top?n=10` | E7 |
| GET | `/corredores` | E8 |
| GET | `/corredores/{slug}` | E8 |
| GET | `/cobertura` | E10 |
| GET | `/sala` | E9 (agregado para 4 paneles) |
| GET/POST | `/evaluaciones-mesa` | E9 |

### Extensiones

| Método | Ruta | Cambio |
|---|---|---|
| GET/PUT | `/api/actores/...` | campos E11 + filtro rol |
| POST/PUT | `/api/coyuntura/eventos` | corredor/tramo opcionales |
| GET | `/api/dashboard/brief` | + resumen calor/corredores (no romper shape: campos opcionales) |
| GET | `/api/reportes/calor` | E7 |
| GET | `/api/reportes/corredores` | E8 |
| GET | `/api/catalogos/corredores` | E8 |
| GET | `/api/catalogos/calor` | umbrales + capas |

Validación Pydantic en escrituras; mensajes de error en lenguaje de mesa.

---

## 7. Frontend

```
frontend/src/modules/inteligencia/
  PanoramaPage.tsx
  CalorPage.tsx
  CorredoresPage.tsx
  CoberturaPage.tsx
  InteligenciaHubPage.tsx
  components/
    LeyendaCalor.tsx
    MapaCalorTerritorial.tsx  # mapa demo visible (SVG/GeoJSON Oriente)
    LeyendaCalor.tsx
    ListaTopCalor.tsx         # ranking complementario
    PanoramaSecciones.tsx
```

**Contrato anti-vendor-lock (mapa):** el componente de mapa solo pinta `CeldaCalor[]` (slug → banda/score). Cambiar a ArcGIS/Mapbox/etc. en Fase 1+ = nuevo adaptador de render, **misma** API `/inteligencia/calor`.

Dashboard: refactor **acotado** a insertar 4 paneles E9 reutilizando `GlassPanel` / links existentes — sin reescribir la sala completa.

Rutas:

- `/inteligencia` hub  
- `/inteligencia/panorama`  
- `/inteligencia/calor`  
- `/inteligencia/corredores`  
- `/inteligencia/cobertura`  

Navegación: entrada desde `GlassNav` + CTAs del brief.

---

## 8. Seguridad territorial

```
GET ficha actor / panorama con actores sensibles
   → resolve_rol
   → strip campos E11 sensibles
   → audit_log si se entregó bloque sensible
```

Calor y cobertura usan **agregados** (scores, conteos), no payloads con PII de encuestados + red de actor en el mismo objeto.

---

## 9. Persistencia y entornos

| Entorno | Comportamiento P3 |
|---|---|
| Local con disco | Read-models en vivo + evaluaciones_mesa persistidas |
| Vercel | Lectura seeds; POST evaluaciones puede no persistir (documentar) |
| Fase 1+ BD | Fuera de este plan salvo nuevo APO |

---

## 10. No-regresión (obligatoria al implementar)

Antes de cerrar cada slice:

1. `GET /api/health` OK  
2. `GET /api/dashboard/brief` shape previa intacta (campos nuevos opcionales)  
3. Reportes P0–P2 responden  
4. `npm run build` OK  
5. Smoke manual: panorama y calor con seeds demo

---

## 11. Relación con `data_fase_2`

Esos archivos son **banco de patrones UX/analíticos**, no dataset Oriente. Quedan fuera del runtime. Opcional (fase docs): carpeta `docs/referencias_fase_2.md` con el mapeo (ya en SPECS §0).

---

*Fin ARQUITECTURA P3 · SAETO*
