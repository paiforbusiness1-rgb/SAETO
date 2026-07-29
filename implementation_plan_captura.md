# Plan de Implementación — SAETO Fase 0.1 (Catálogos + Captura)

**Estado:** FASE 0.1 ENTREGADA  
**Aprobación:** usuario 2026-07-29 («adelante! apruebo todo!»)  
**Persistencia:** JSON editable  
**Verificación:** build front OK; POST/DELETE actores OK; catálogos GET OK; uvicorn + Vite activos.  
**Fecha:** 2026-07-29  
**Base:** Fase 0 entregada (lectura demo). Esta fase añade **alimentación de información**.

---

## 1. Diagnóstico APO

### 1.1 Qué hay hoy

| Capa | Estado |
|---|---|
| API | Solo **GET** (health, brief, actores, reivs, discurso, catálogos) |
| Datos | JSON en `backend/config/` y `backend/data/demo/` (lectura) |
| UI | Sala de situación + fichas de solo lectura (glass) |

### 1.2 Grafo de impacto (cambio)

```
UI Captura / Catálogos (nuevas pantallas)
  │  POST/PUT/DELETE + GET
  ▼
API routes (extender; routers solo despachan)
  ▼
services de dominio (crear/actualizar/borrar + validar)
  ▼
persistencia JSON (escritura atómica)
  ├── config/*.json          ← catálogos
  └── data/demo/*.seed.json  ← hechos operativos
  ▼
invalidar caché seed_loader + brief recalculable
```

### 1.3 Efectos secundarios

| Área | Impacto |
|---|---|
| `seed_loader.py` | Añadir `save_*`, invalidar `@lru_cache` tras escritura |
| Services actores/observatorio/discurso/dashboard | Métodos create/update/delete; brief puede regenerarse desde datos vivos |
| Routers | Endpoints de escritura; validación Pydantic de entrada |
| Frontend | Sección **Captura** + **Catálogos** en nav; formularios glass; listados con Editar/Eliminar/Volver |
| README | Cómo usar captura (disclaimer: datos locales demo) |
| Auth | **No** (sigue demo local; sin login) |

### 1.4 Fuera de alcance

- BD SQL / PostgreSQL  
- Auth / roles productivos  
- Encuesta digital ciudadana masiva  
- MCP / RAG / LLM  
- Multi-usuario concurrente con locks distribuidos  

---

## 2. Objetivo

Que el equipo pueda **cargar y mantener** desde la UI:

1. **Catálogos:** zonas/colonias, temas de reivindicación, umbrales de semáforo, niveles de discurso  
2. **Hechos:** actores, reivindicaciones, piezas de discurso, alertas/resumen del brief  

Así la sala de situación deja de ser solo seed estático y se **alimenta**.

---

## 3. Persistencia propuesta (default)

**JSON editable en disco** (atómico: escribir `.tmp` + replace), mismo layout actual.

- Rápido, alineado a Fase 0  
- Si más adelante quieres SQLite, será otro plan  

Alternativa si la pides al aprobar: **SQLite**.

---

## 4. Catálogos (pantallas + API)

| Catálogo | Archivo | Operaciones UI |
|---|---|---|
| Territorio (zonas + colonias) | `config/territorio.json` | Alta/edición/baja |
| Temas reivindicación | `config/reivindicaciones-catalogo.json` | Alta/edición/baja |
| Umbrales semáforo | `config/umbrales-semaforo.json` | Editar bandas min/max/etiqueta |
| Niveles discurso | `config/discurso-niveles.json` | Editar nombres/subtítulos (estructura 7 niveles) |

API sugerida:

- `GET/PUT /api/catalogos/territorio`  
- `GET/PUT /api/catalogos/temas`  
- `GET/PUT /api/catalogos/umbrales`  
- `GET/PUT /api/catalogos/discurso-niveles`  

(PUT reemplaza documento validado; UI edita en formularios y guarda.)

---

## 5. Captura de hechos (pantallas + API)

| Entidad | API | Pantallas |
|---|---|---|
| Actores | `POST/PUT/DELETE /api/actores[/{slug}]` | Listado + formulario |
| Reivindicaciones | `POST/PUT/DELETE /api/observatorio/reivindicaciones[/{slug}]` | Listado + formulario (tema/territorio desde catálogo) |
| Discurso | `POST/PUT/DELETE /api/discurso[/{slug}]` | Listado + formulario (actor select + 7 niveles) |
| Brief | `PUT /api/dashboard/brief` | Formulario: resumen, alertas, slugs clave (selectores) |

Validaciones:

- Slugs únicos, generados desde nombre si vacío  
- Refs a catálogo/actor deben existir  
- Intensidad 1–5; semáforo se **recalcula** en lectura con umbrales  
- Idempotencia básica: PUT upsert por slug  

---

## 6. UX (U-First + glass)

- Nuevo grupo en nav: **Catálogos** | **Captura**  
- Flujos guiados con botones: Guardar, Cancelar, Eliminar (con confirmación), **Volver**  
- Selects de catálogo (no IDs crudos a teclear)  
- Badge DEMO + aviso: “Los cambios se guardan en este equipo (archivos locales)”  
- Tras guardar → toast/mensaje y opción “Ver en sala de situación”  

---

## 7. Archivos a tocar (consolidado)

**Backend**

- `app/shared/seed_loader.py` — save + clear cache  
- `app/shared/persistence.py` — escritura atómica (nuevo)  
- `app/shared/schemas.py` — schemas de entrada (Create/Update)  
- `app/modules/*/service.py` — CRUD  
- `app/api/routes/catalogos.py` — nuevo  
- `app/api/routes/{actores,observatorio,discurso,dashboard}.py` — POST/PUT/DELETE  
- `app/main.py` — include router catálogos  

**Frontend**

- `GlassNav` — links Catálogos / Captura  
- `modules/catalogos/*` — pantallas  
- `modules/captura/*` — pantallas formularios (o formularios dentro de cada módulo)  
- `shared/api/client.ts` — métodos escritura  
- Rutas en `app/routes.tsx`  

Si aparece efecto no listado → detener → actualizar plan → nueva aprobación.

---

## 8. Criterios de aceptación

- [ ] Crear/editar/eliminar un actor y verlo en sala / listado  
- [ ] Crear reivindicación eligiendo tema y colonia del catálogo; semáforo coherente  
- [ ] Crear discurso ligado a actor con texto en niveles  
- [ ] Editar catálogo de temas y que aparezca en el select de captura  
- [ ] Editar brief (resumen/alertas/actores clave) y reflejo en home  
- [ ] Reiniciar API y **persistir** cambios (no se pierden al refresh)  
- [ ] Cero callejones: Volver / Cancelar siempre  
- [ ] Sin auth; disclaimer DEMO visible  

---

## 9. Orden de ejecución (tras aprobación)

1. Persistencia atómica + invalidación de caché  
2. Schemas + CRUD backend actores → reivs → discurso → brief  
3. API catálogos PUT  
4. UI Catálogos  
5. UI Captura  
6. Nav + humo manual + README  

---

## 10. Solicitud de aprobación

Responde con una de:

- **`APRUEBO CAPTURA`** — implemento este plan (persistencia JSON)  
- **`APRUEBO CAPTURA CON SQLITE`** — mismo alcance con SQLite  
- **`APRUEBO CON CAMBIOS:`** …  
- **`RECHAZO`**  

Sin eso, **no se escribe código** de captura.
