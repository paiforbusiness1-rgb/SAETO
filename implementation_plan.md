# Plan de Implementación — SAETO Fase 0 (Prototipo Conceptual)

**Estado:** FASE 0 ENTREGADA (ejecución completada)  
**Aprobación:** usuario 2026-07-29 («listo aprobado! dale!»)  
**Verificación:** `/api/health`, brief, actores (4), reivs (6), discurso (3), proxy Vite→API OK; `npm run build` OK.  
**Fecha:** 2026-07-29  
**Revisión:** Stack **Python (venv) + FastAPI / React**; UI **glassmorphism** (pedido del usuario).  
**Alcance:** Fase 0 (venta / subsecretario). No es MVP con BD reales ni MCP/RAG.

---

## 1. Diagnóstico APO (análisis global)

### 1.1 Estado del workspace

| Elemento | Estado |
|---|---|
| Código de aplicación | **No existe** (greenfield) |
| Reglas Cursor | `.cursor/rules/saeto-*.mdc` + `AGENTS.md` |
| Insumos | Audios transcritos, 3 PDFs, canvas de propuesta |
| Dependencias legacy | Ninguna — no hay grafo de impacto sobre lógica existente |

### 1.2 Grafo de impacto previsto (fullstack)

```
React (frontend)
  UI sala de situación / módulos
       │  HTTP JSON (fetch)
       ▼
FastAPI (backend, venv)
  api/routes          → solo despachan
       ├─ observatorio/service
       ├─ actores/service
       ├─ discurso/service
       └─ dashboard/service   → arma brief Capa 1
       ▼
  data/demo/*.seed.json   +   config/*.json
```

**Cadena Fase 0:** UI → API REST → servicios de dominio → seeds/config.  
**Sin:** BD SQL, auth productivo, LLM/MCP/RAG, escritura de campo.

### 1.3 Efectos secundarios / archivos periféricos

| Cambio | Afecta |
|---|---|
| Backend Python + venv | `backend/`, `requirements.txt`, `.venv/` (gitignore), CORS |
| Frontend React+Vite+TS | `frontend/`, `package.json`, proxy a API |
| Seeds / config | `backend/data/demo/`, `backend/config/` (fuente única de verdad) |
| README raíz | Cómo levantar venv + API + frontend |
| Reglas Cursor / PDFs / audios / canvas / `implementation_plan.md` | Plan sí se actualiza; resto **no** tocar |

### 1.4 Fuera de alcance (explícito)

- Conexión a BD de la subsecretaría  
- Persistencia SQL / migraciones  
- Encuestas digitales en producción / captura en campo  
- Autenticación real / roles RBAC productivos  
- MCP, RAG, LLM local  
- Rediseño formal PDF → instrumento de campo completo  
- Mobile app nativa  

---

## 2. Objetivo de la entrega Fase 0

Prototipo navegable tipo **sala de situación** (fullstack local) que demuestre:

1. **Capa 1 — Brief ejecutivo** vía `GET /api/dashboard/brief`  
2. **Capa 2 — Profundidad** vía endpoints de actores, reivindicaciones y discurso  
3. Frontend React que solo consume API (sin hardcodear hechos de negocio en JSX)  
4. Pitch: *“llave para consumir información, no más datos”* + badge DEMO  

U-First: botones, lenguaje de mesa, “Volver” siempre, sin IDs técnicos visibles al usuario final.

---

## 3. Stack (decisión del usuario + detalle técnico)

| Capa | Tecnología | Motivo |
|---|---|---|
| Backend | **Python 3.11+** en **`.venv`** | Pedido explícito; aislamiento de deps |
| Framework API | **FastAPI** + Uvicorn | API clara, tipado, ideal prototipo |
| Validación | Pydantic v2 | Contratos de respuesta |
| Frontend | **React 19 + TypeScript + Vite** | UI moderna y modular |
| Estilos | CSS modules + variables CSS + **glassmorphism** | Sala de situación premium (ver §3.1) |
| Datos | JSON seeds en backend | HRU: hechos fuera del código UI |
| Config | JSON en `backend/config/` | Umbrales, catálogos, 7 niveles discurso |
| CORS | Origen `localhost:5173` (dev) | Frontend ↔ API |
| Orquestación local | 2 terminales: `uvicorn` + `npm run dev` | Sin Docker en Fase 0 (opcional después) |

### 3.1 Dirección visual — Glassmorphism (obligatorio en frontend)

Objetivo: sensación de **sala de situación** / panel ejecutivo, no dashboard genérico.

| Elemento | Criterio |
|---|---|
| Superficies | Paneles `backdrop-filter: blur(...)` + fondo semitransparente (`rgba` / tokens) |
| Bordes | Contorno sutil claro/oscuro (`border: 1px solid rgba(...)`), radio moderado |
| Fondo de app | Plano atmosférico (gradiente o textura suave de color) **detrás** de los paneles de vidrio — el glass necesita contraste |
| Jerarquía | Brief (Capa 1) usa paneles glass grandes; detalle (Capa 2) glass anidado o más denso |
| Tipografía | Clara, alto contraste sobre el vidrio; evitar texto lavado |
| Motion | 2–3 transiciones sobrias (entrada de panel, hover de tarjeta, cambio de ruta) — sin ruido |
| Tokens | Variables CSS en `:root` (`--glass-bg`, `--glass-border`, `--glass-blur`, `--surface-atmosphere`, acentos territoriales) — **no** hardcodear colores sueltos en cada componente |
| Accesibilidad | Contraste legible; respetar `prefers-reduced-motion` |
| Evitar | Purple-on-white genérico, glow excesivo, emojis decorativos, sombras multicapa exageradas, look “AI template” |

Componentes UI compartidos (`shared/ui/`): `GlassPanel`, `GlassNav`, `GlassCard` — mismos primitivos para observatorio/actores/discurso (universalidad HRU).

---

## 4. Arquitectura de carpetas (anti-God-Object)

```
/
  README.md
  implementation_plan.md
  .gitignore                 # .venv, node_modules, __pycache__, dist
  backend/
    requirements.txt
    README.md
    app/
      main.py                # crea app, CORS, include routers — NO lógica de dominio
      api/
        routes/
          dashboard.py       # solo despacha
          observatorio.py
          actores.py
          discurso.py
          meta.py            # health + disclaimer demo
      modules/
        dashboard/service.py
        observatorio/service.py
        actores/service.py
        discurso/service.py
      shared/
        schemas.py           # Pydantic (o por módulo si crece)
        seed_loader.py       # carga JSON demo/config
    config/
      territorio.json
      reivindicaciones-catalogo.json
      umbrales-semaforo.json
      discurso-niveles.json
    data/
      demo/
        actores.seed.json
        reivindicaciones.seed.json
        discurso.seed.json
        brief.seed.json
  frontend/
    package.json
    vite.config.ts           # proxy /api → http://127.0.0.1:8000
    index.html
    src/
      main.tsx
      app/App.tsx            # shell + router
      app/routes.tsx         # solo despacha
      shared/styles/tokens.css   # atmosphere + glass tokens
      shared/ui/                 # GlassPanel, GlassNav, GlassCard, BotonVolver
      shared/api/client.ts       # fetch tipado a backend
      modules/
        dashboard/
        observatorio/
        actores/
        discurso/
```

**Regla:** routers Python y React solo despachan. Servicios poseen el dominio.  
**Límite:** alertar si un archivo se acerca a ~400–600 líneas.

---

## 5. Contratos API (Fase 0)

| Método | Ruta | Módulo | Respuesta |
|---|---|---|---|
| GET | `/api/health` | meta | estado + `demo: true` |
| GET | `/api/dashboard/brief` | dashboard | resumen, top reivindicaciones, actores clave, alertas, semáforo resuelto |
| GET | `/api/observatorio/reivindicaciones` | observatorio | lista (filtros query opcionales: territorio, tema) |
| GET | `/api/observatorio/reivindicaciones/{slug}` | observatorio | detalle |
| GET | `/api/actores` | actores | listado |
| GET | `/api/actores/{slug}` | actores | ficha (slug legible, no UUID crudo en UI) |
| GET | `/api/discurso` | discurso | listado de piezas |
| GET | `/api/discurso/{slug}` | discurso | ficha 7 niveles |
| GET | `/api/config/catalogos` | meta | catálogos públicos no sensibles |

Errores: JSON uniforme `{ "detail": "..." }`. 404 con mensaje claro.  
Validación de path/query en cada ruta (Zero Trust ligero entre front y back).

---

## 6. Modelo de datos demo (seeds en backend)

Igual espíritu que el plan anterior, **fuente única en backend**:

- Actores: nombre ficticio, colonia, rol, movilización, reivindicaciones abiertas, estado verificación, `demo: true`  
- Reivindicaciones: tema de catálogo, territorio, intensidad → semáforo vía config, deuda histórica, fuente  
- Discurso: actorRef, tópico, subtítulos, audiencia, resúmenes por 7 niveles del PDF  
- Brief: agregados para Capa 1  

**Seguridad:** sin PII real; disclaimer DEMO en API health y en UI.

---

## 7. Pantallas frontend

| # | Pantalla | Consume |
|---|---|---|
| 1 | Sala de situación | `GET /api/dashboard/brief` |
| 2 | Reivindicaciones | `GET /api/observatorio/reivindicaciones` |
| 3 | Ficha reivindicación | detalle observatorio |
| 4 | Actores | `GET /api/actores` + ficha |
| 5 | Discurso | listado + ficha 7 niveles |
| 6 | Acerca del prototipo | pitch + disclaimer |

Estados UI: carga, vacío, error con “Reintentar” / “Volver al brief”.

---

## 8. Ajuste PDFs → datos

| PDF | Acción Fase 0 |
|---|---|
| Encuestas cual/cuant | Temas → `reivindicaciones-catalogo.json`; no UI completa de satisfacción |
| Tópicos discurso | `discurso-niveles.json` + ficha en módulo discurso |

Instrumento de campo completo = Fase 1 (otro plan).

---

## 9. Archivos a crear (consolidado)

**Backend:** `requirements.txt`, `app/main.py`, 5 routers, 4 services, `seed_loader`, schemas, 4 configs JSON, 4 seeds JSON, `backend/README.md`  

**Frontend:** scaffold Vite React TS, proxy, `api/client.ts`, shell/nav, 4 módulos UI, páginas listadas, `frontend/README.md`  

**Raíz:** `.gitignore`, `README.md` (cómo crear venv, instalar, correr ambos)  

Si aparece efecto/archivo no listado → detener → actualizar plan → nueva aprobación.

---

## 10. Criterios de aceptación

- [ ] `python -m venv .venv` + `pip install -r backend/requirements.txt` funciona  
- [ ] `uvicorn app.main:app` sirve `/api/health` y `/api/dashboard/brief`  
- [ ] `npm install && npm run dev` en frontend consume la API (no JSON embebido de negocio)  
- [ ] Semáforo calculado en **backend** con umbrales de `config/`  
- [ ] Navegación con “Volver”; badge DEMO visible  
- [ ] UI glassmorphism coherente (paneles blur, tokens CSS, sin look genérico)  
- [ ] 4 módulos canónicos separados front y back  
- [ ] Sin BD, sin MCP/RAG, sin auth productivo  
- [ ] README raíz permite demostrar el prototipo al subsecretario en &lt; 5 minutos  

---

## 11. Orden de ejecución (tras `APRUEBO FASE 0`)

1. `.gitignore` + README raíz  
2. Backend: venv instructions, FastAPI skeleton, config+seeds, services, routes  
3. Verificar API con llamadas locales  
4. Frontend scaffold + client + shell  
5. Tokens CSS + primitivos glass (`GlassPanel`, `GlassNav`, `GlassCard`)  
6. Pantallas dashboard → observatorio → actores → discurso (sobre glass)  
7. CORS/proxy + motion sobrio + pulido UX  
8. Checklist §10  

---

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| Datos sensibles en demo | Seeds ficticios + disclaimer |
| God-object en `main.py` | Solo wiring |
| Front con hechos hardcodeados | Solo consume API |
| Scope creep fullstack | Checklist estricto Fase 0 |

---

## 13. Solicitud de aprobación

Incorporado en este documento:

1. Backend **Python + venv + FastAPI**  
2. Frontend **React + Vite + TS**  
3. UI **glassmorphism** (§3.1)

Responde con una de:

- **`APRUEBO FASE 0`** — implemento este plan fullstack + glass  
- **`APRUEBO CON CAMBIOS:`** … — rehago el plan  
- **`RECHAZO`** — no código  

Sin esa frase, **no se crea código de aplicación**.
