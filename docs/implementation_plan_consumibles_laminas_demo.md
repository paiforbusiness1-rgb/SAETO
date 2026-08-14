# Plan de implementación — Consumibles demo (láminas tipo PPT)

**Estado:** IMPLEMENTADO EN LOCAL (2026-08-13) — validar UI antes de GitHub/Vercel  
**Fecha:** 2026-08-13  
**Fase:** 0 (prototipo / venta)  
**Aprobación:** “adelante”

---

## 1. Objetivo

Que la mesa vea en SAETO **consumibles en pantalla** del mismo tipo que las presentaciones de referencia (`data_fase_2`: León, Puebla calor, Yucatán panorama):

- **Mapa** que hable de un problema  
- **Gráfica / tabla** con números  
- **Lectura corta** de mesa  
- **Cruce** demográfico-electoral × problemática (mock, marcado DEMO)

Cerrar el hueco de los audios fase 3: el concepto ya se entendió; ahora faltan los **outputs visibles**.

---

## 2. Qué NO es este plan

- No es BD electoral real ni padrón oficial.  
- No es GIS comercial ni réplica de logos institucionales ajenos.  
- No sustituye Captura operativa ni IA como producto principal (la IA queda de apoyo).  
- No reescribe el módulo `inteligencia` ni el monolito completo de `reportes/service.py`.  
- No promete “producto terminado”: es **paquete de láminas DEMO**.

---

## 3. Cadena de impacto (APO)

```
UI Consumibles (láminas)
  → /api/consumibles/*
    → módulos consumibles (lámina + cruce + temáticos)
      → seeds demo nuevos + configs HRU
      → reutiliza calor_service / territorio / GeoJSON / charts existentes
```

**Archivos periféricos previstos**

| Área | Impacto |
|---|---|
| `backend/app/modules/consumibles/` | **Nuevo** (servicios separados) |
| `backend/app/api/routes/consumibles.py` | **Nuevo** router |
| `backend/app/main.py` | Registrar router |
| `backend/app/shared/seed_loader.py` | Loaders de seeds/config nuevos |
| `backend/data/demo/*.seed.json` | Seeds mock (problemáticas, demografía, electoral) |
| `backend/config/consumibles-*.json` | Plantillas de lámina, temas, umbrales de cruce |
| `frontend/src/modules/consumibles/` | Hub + visor lámina |
| `frontend/src/modules/inteligencia/geo/` | Ampliar colonias demo (más puntos para calor) |
| `frontend/src/app/routes.tsx` + `GlassNav` / hubs | Entrada visible |
| `frontend/src/shared/api/client.ts` + `types.ts` | Contratos |
| `docs/` + nota en README / manual (breve) | Guion demo |

**No-regresión:** calor, panorama, IA, captura y reportes actuales siguen vivos; consumibles es capa de presentación adicional.

---

## 4. Láminas a entregar (5 consumibles)

Cada lámina = una pantalla “tipo PPT” con sello **DEMO**, botón **Volver**, y opcional **Recalcular**.

| # | Lámina | Pregunta de mesa | Componentes en pantalla |
|---|---|---|---|
| **L1** | **Panorama Oriente** | ¿Cómo está el Oriente hoy? | Mapa alcaldías + KPIs demográficos mock + lectura corta + semáforo agregado |
| **L2** | **Calor temático — Agua** | ¿Dónde duele el agua? | Mapa/puntos por colonia + barras por zona + top colonias + frase gerencial |
| **L3** | **Calor temático — Basura / alumbrado / seguridad** (selector de tema) | ¿Qué problema priorizar en mapa? | Misma plantilla L2 con cambio de tema (basura, alumbrado, seguridad ciudadana) |
| **L4** | **Cruce electoral × problemática** | ¿Dónde el problema toca padrón/densidad/voto? | Mapa de cruce (score compuesto) + gráfica dual (problema vs intensidad electoral mock) + tabla colonia |
| **L5** | **Constructo de un problema** (estilo Yucatán, versión SAETO) | ¿Cuál es la historia completa? | Contexto → mapa → tendencia (gráfica) → impactos → recomendaciones de mesa (texto mock HRU) |

**Entrada de menú sugerida:**  
`Inteligencia → Consumibles (láminas DEMO)` y acceso espejo desde `Reportes → Consumibles`.

---

## 5. Datos mock a inventar (autorizados)

Todo con `"demo": true` y disclaimer visible en UI.

### 5.1 Problemáticas sociales por colonia (`problematicas_territorio.seed.json`)

Colonias demo **ampliadas** (de 4 a ~12–16 puntos en Oriente) para que el calor se vea “lleno” como en Puebla.

Temas (catálogo HRU en `consumibles-temas.json`):

| Tema | Métricas inventadas (ejemplos) |
|---|---|
| **Agua** | Días de tandeo / mes, % quejas, intensidad 0–100 |
| **Basura** | Retraso recolección (días), puntos críticos, intensidad |
| **Alumbrado** | Luminarias reportadas apagadas, intensidad |
| **Seguridad** | Percepción inseguridad local, eventos coyuntura mock, intensidad |
| **Movilidad / baches** (opcional corto) | Reportes / mes |

Cada fila: `colonia`, `zona`, `tema`, `intensidad`, `serie_mensual[]` (6–10 meses), `nota_mesa`.

### 5.2 Demografía mock (`demografia_electoral.seed.json`)

Por colonia (agregado, **no PII**):

- `poblacion_total`, `densidad_hab_km2`  
- `viviendas`, `%_viviendas_sin_agua` (coherente con tema agua)  
- `poblacion_18_mas` (contexto, no padrón real)

### 5.3 Electoral mock (`demografia_electoral.seed.json` o seed hermano)

Por colonia / sección sintética:

- `casillas` (núm.)  
- `lista_nominal_mock`  
- `participacion_pct` última jornada ficticia  
- `historicidad`: 2–3 elecciones mock con `%_partido_a`, `%_partido_b`, `%_otros` (etiquetas genéricas: “Fuerza A / Fuerza B / Otros” — **sin nombres de partidos reales** para no politizar de más el demo)  
- `indice_electoral_demo` 0–100 (para choropleth de cruce)

### 5.4 Cruce (regla HRU, no hardcode mágico en UI)

Config `consumibles-cruce.json`:

```
score_cruce = w_problema * intensidad_tema + w_electoral * indice_electoral + w_densidad * densidad_norm
```

Pesos y bandas en JSON. Bandas de color reutilizan o extienden umbrales de calor.

### 5.5 Lecturas gerenciales mock

Textos cortos por lámina/tema en seed o plantilla (`consumibles-plantillas.json`), sustituibles luego por IA **sin bloquear** la lámina (Capa 1 visual primero; IA opcional debajo).

---

## 6. Arquitectura (anti-God-Object)

### Backend — módulo nuevo `consumibles`

| Archivo | Responsabilidad |
|---|---|
| `schemas.py` | Contratos lámina, celda cruce, serie, KPI |
| `tematicos_service.py` | Scores por tema social (L2/L3) |
| `cruce_service.py` | Cruce demográfico-electoral × problema (L4) |
| `lamina_service.py` | Orquesta payload L1–L5 |
| `constructo_service.py` | L5 constructo (secciones fijas) |
| `__init__.py` | Fachada |

Router: `backend/app/api/routes/consumibles.py` → solo despacha.

### Endpoints (propuesta)

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/api/consumibles` | Índice de láminas |
| `GET` | `/api/consumibles/laminas/{slug}` | Payload completo de una lámina |
| `GET` | `/api/consumibles/temas` | Catálogo temas |
| `GET` | `/api/consumibles/calor-tematico?tema=` | Capas para mapa L2/L3 |
| `GET` | `/api/consumibles/cruce?tema=` | Celdas + series L4 |

### Frontend — módulo `consumibles`

| Pieza | Rol |
|---|---|
| `ConsumiblesHubPage` | Galería de 5 láminas |
| `LaminaViewerPage` | Layout “lámina viva” (mapa + gráficas + lectura) |
| `CruceMapaPanel` | Reusa Leaflet / patrón `MapaCalorTerritorial` con capa cruce |
| Charts | Reusa `reportes/charts.tsx` (barras / donut) |

**UX U-First:** títulos de mesa, sin IDs internos, siempre **Volver**, sello DEMO, selector de tema en lenguaje claro (“Agua”, “Basura”…).

---

## 7. Seguridad territorial (demo)

- Solo agregados territoriales; **cero** nombres/teléfonos de ciudadanos.  
- No mezclar en payload de lámina `interes_reservado` ni tipologías sensibles.  
- Lectura pública de consumibles para todos los roles demo (es vitrina); si más adelante se exporta, auditar.  
- Disclaimer fijo: *“Cifras inventadas para demostración. No son estadísticas oficiales ni padrón electoral.”*

---

## 8. Criterios de aceptación

1. Desde menú, un no-técnico abre **Consumibles** y ve 5 láminas con nombre claro.  
2. L2/L3: al cambiar tema (agua/basura/alumbrado/seguridad), el **mapa y la gráfica cambian** de inmediato.  
3. L4: se ve cruce problema × electoral mock en mapa **y** en tabla/gráfica.  
4. Cada lámina tiene lectura corta + sello DEMO + Volver.  
5. Juan José / mesa percibe **delta visual** vs el demo anterior (outputs, no solo resumen IA).  
6. Build frontend + smoke endpoints OK en local.  
7. No rompe `/inteligencia/calor`, panorama ni IA existentes.

---

## 9. Orden de trabajo (slices)

| Slice | Entrega |
|---|---|
| **S0** | Config + seeds mock (temas, problemáticas, demografía/electoral, plantillas) + ampliar GeoJSON colonias |
| **S1** | Backend consumibles (servicios + router) |
| **S2** | UI hub + L1 Panorama Oriente |
| **S3** | L2/L3 calor temático con selector |
| **S4** | L4 cruce electoral × problemática |
| **S5** | L5 constructo + enlace desde Reportes/Inteligencia + guion demo 1 página |

Probar **siempre en local** antes de commit/push/Vercel (como pidió el usuario en sesiones previas).

---

## 10. Guion demo (resultado esperado, ~8 min)

1. Inteligencia → **Consumibles**.  
2. Abrir **Calor — Agua** → “aquí duele”.  
3. Cambiar a **Basura** / **Seguridad** → mismo formato, otro problema.  
4. Abrir **Cruce electoral × problemática** → “ya no se lo cuento: se ve”.  
5. Cierre: “Estos son consumibles DEMO; con su información real, el mismo formato.”

---

## 11. Aprobación

**Se solicita aprobación explícita** para implementar este plan (Fase 0, mocks inventados autorizados).

Al aprobar, se ejecutará en slices S0→S5 sin fusionar responsabilidades en un solo God-Object.

---

*SAETO — consumibles tipo lámina PPT · Oriente CDMX · DEMO*
