# Plan — SAETO Módulo de Reportes Visuales (gerencial)

**Estado:** ENTREGADO  
**Aprobación:** usuario 2026-07-29 («aprobado!»)  
**Verificación:** build OK; `/api/reportes/*` OK.  
**Objetivo:** Pantallas gráficas “a golpe de vista” para toma de decisiones de mesa/gerencia.

---

## 1. APO (impacto)

```
UI /reportes (nuevo módulo)
  │  GET agregados
  ▼
API /api/reportes/*  (router solo despacha)
  ▼
modules/reportes/service.py  (agrega desde seeds existentes)
  ▼
data/demo + config  (solo lectura; no cambia captura)
```

**Efectos:** `main.py` include router; nav + routes frontend; **no** altera CRUD ni catálogos.  
**Fuera:** PDF export, auth, BI externo, mapas GIS reales.

---

## 2. Entrega UX (glass, U-First)

Ruta hub **`/reportes`** + vistas:

| Vista | Decisión que apoya | Gráficos |
|---|---|---|
| **Tablero ejecutivo** | ¿Dónde está el fuego? | KPIs (rojos/amarillos/verdes, #actores, capacidad total); barras por tema; dona semáforo |
| **Calor territorial** | ¿Qué zona priorizar? | Barras por zona/colonia (intensidad × peso) |
| **Mapa de poder** | ¿Quién mueve gente? | Barras horizontales capacidad de movilización; tabla top actores |
| **Cuentas pendientes** | ¿Qué deudas cerrar? | Lista/barras de deuda histórica vs no; ranking |

Siempre: **Volver**, badge DEMO, link a Captura/Sala.

---

## 3. API

- `GET /api/reportes/ejecutivo` — KPIs + series semáforo + por tema  
- `GET /api/reportes/territorio` — agregados por zona/colonia  
- `GET /api/reportes/actores` — ranking movilización  
- `GET /api/reportes/deudas` — reivindicaciones con deuda_historica  

Cálculo en backend (HRU: umbrales/catálogos desde config).  
Charts en frontend con **SVG/CSS propio** (sin librería pesada) o Recharts si hace falta — preferencia: **componentes livianos propios** para no inflar deps.

---

## 4. Archivos

**Backend:** `modules/reportes/service.py`, `api/routes/reportes.py`, `main.py`  
**Frontend:** `modules/reportes/*` (hub + 4 vistas o 1 dashboard con secciones), `GlassNav`, `routes`, `api/client`

---

## 5. Criterios

- [ ] Gerente ve en &lt; 5 s semáforo global y top demandas  
- [ ] Datos salen de la misma info que Captura (si cargas algo nuevo, reportes cambian al refrescar)  
- [ ] Glass coherente; sin IDs técnicos  
- [ ] Build OK  

---

## Aprobación

- **`APRUEBO REPORTES`** — implemento  
- **`APRUEBO CON CAMBIOS:`** …  
- **`RECHAZO`**
