# SAETO — Especificaciones P3 · Inteligencia y seguridad territorial operativa

**Estado:** BORRADOR APO — espera aprobación explícita antes de codificar  
**Fecha:** 2026-08-13  
**Insumo de contraste:** `C:\SAETO-main\data_fase_2` (León, Puebla, Aguascalientes, Yucatán)  
**Complementa:** `SAETO_SPECS_P0_P2.md` (no lo reemplaza)  
**Principio de resignificación:** SAETO no es C4 policial ni plataforma de despacho 066. Es la **máquina de inteligencia territorial** de la mesa político-operativa Oriente CDMX.

---

## 0. Lectura de los archivos de referencia → SAETO

| Capacidad en referencia | Resignificación SAETO (Oriente) | Módulo dueño |
|---|---|---|
| Panorama delictivo (León / Yucatán) | **Panorama situacional** por alcaldía/colonia: contexto + demandas + coyuntura + actores | `inteligencia` → consume `observatorio` / `actores` / `coyuntura` |
| Tablas de incidencia por periodo | **Serie temporal de focos** (reivindicaciones / eventos / percepción) | `observatorio` + `reportes` |
| Colonias calientes | **Mapa de calor territorial** con umbrales HRU | `inteligencia` + `dashboard` |
| Mapa de calor sobre red carretera (Puebla) | **Corredores críticos** (ejes, límites, tramos) + capas duales | `inteligencia` |
| Análisis camino-tramo (Aguascalientes) | **Análisis por corredor / tramo** | `inteligencia` |
| Simbología Baja→Muy alta | **Intensidad territorial** en config (no hardcode) | `catalogos` |
| Puesto de mando / pantallas Registro–Reporteador | **Sala operativa ampliada** (Capa 1): Registro · Análisis · Reporte · Priorización | `dashboard` |
| Sectorización / zonas de patrullaje | **Sectorización analítica** y priorización de cobertura de mesa | `inteligencia` |
| Indicadores de éxito / evaluación diaria | **Ritmo de mesa**: KPIs de seguimiento y bitácora de evaluación | `dashboard` + `coyuntura` |
| Fichas de operadores / zonas de operación | **Ficha de inteligencia de actor** (campos sensibles, rol ≥ analista_sensible) | `actores` + `seguridad` |
| Encuestas / participación ciudadana | Ya existe módulo `encuestas` — se **cruza** al calor y al panorama | `encuestas` |

---

## 1. Mapa de entregables P3

| ID | Prioridad | Nombre | Pregunta de mesa que responde |
|---|---|---|---|
| **E6** | P3-A | Panorama situacional Oriente | ¿Cómo se lee hoy Iztapalapa / colonia X en una sola pantalla? |
| **E7** | P3-A | Mapa de calor territorial | ¿Dónde está el calor y con qué capa lo medimos? |
| **E8** | P3-B | Corredores y tramos críticos | ¿Qué ejes concentran conflicto, movilización o agravio? |
| **E9** | P3-B | Sala operativa (ciclo de mando analítico) | ¿Qué miramos hoy, qué se registró y qué priorizamos? |
| **E10** | P3-C | Sectorización y cobertura de mesa | ¿Dónde poner atención analítica / verificación de campo? |
| **E11** | P3-C | Ficha de inteligencia de actor (sensible) | ¿Quién opera, dónde y con qué red (con control de rol)? |

**Dependencias**

- E6 y E7 se apoyan en P0–P2 ya entregados (ciclo, coyuntura, movilización, encuestas, INEGI).  
- E8 necesita catálogo de corredores (nuevo config).  
- E9 orquesta E6–E8 en UX de sala (sin fusionar dominios).  
- E10 consume scores de E7.  
- E11 amplía `actores` con campos sensibles (misma línea de E5).

---

## 2. E6 — Panorama situacional Oriente

### Objetivo
Una vista **tipo “panorama León”** pero en lenguaje SAETO: territorio + semáforo + ciclo + top reivindicaciones + eventos coyuntura recientes + actores clave + contexto INEGI + pulso de encuestas.

### Actores de uso
Analista, gerencia (lectura), capturista (solo enlaces a captura).

### Contrato de lectura `PanoramaTerritorial`

| Campo | Origen |
|---|---|
| `territorio_slug` / `colonia_slug` | filtro |
| `periodo` | `desde`–`hasta` (default: ventana config) |
| `resumen_ejecutivo` | texto generado por reglas (plantilla, **sin LLM obligatorio**) |
| `conteo_semaforo` | reivindicaciones |
| `conteo_ciclo` / `escalando` | E1 |
| `top_reivindicaciones[]` | observatorio |
| `eventos_recientes[]` | coyuntura |
| `actores_clave[]` | actores (movilización dual) |
| `indicadores_contexto[]` | E5b |
| `pulso_encuestas` | agregados encuestas del territorio |
| `intensidad` | score E7 del territorio |
| `demo` | bool |

### Reglas
- Solo agregación; **no** duplicar hechos en un seed aparte de panorama.  
- Plantilla de resumen en `config/panorama-plantillas.json` (HRU).  
- Si faltan datos de una capa, la sección muestra vacío accionable (“Sin eventos — Ir a captura”), nunca callejón sin salida.

### UI
- Ruta: `/inteligencia/panorama` (+ filtro alcaldía/colonia/periodo).  
- Acceso desde Dashboard: CTA “Abrir panorama”.  
- Export lectura: reutilizar patrón de reportes (PDF/print opcional Fase posterior).

### Criterios de aceptación E6
- [ ] Filtrar por zona y colonia demo.  
- [ ] Una pantalla con las 6 capas (demandas, ciclo, coyuntura, actores, INEGI, encuestas).  
- [ ] Resumen ejecutivo desde plantilla config, no hardcode JSX.  
- [ ] Enlaces Volver / Recalcular / Ir a captura.

---

## 3. E7 — Mapa de calor territorial

### Objetivo
Sustituir la intuición por **intensidad comparable** por colonia/zona, con capas seleccionables (como fuero federal/común en Puebla, resignificado).

### Capas (`config/calor-capas.json`)

| Capa slug | Señal | Peso default (config) |
|---|---|---|
| `reivindicaciones` | # demandas abiertas + grado_escalamiento | configurable |
| `coyuntura` | # eventos en ventana + tipos sensibles | configurable |
| `movilizacion` | suma capacidad display de actores anclados | configurable |
| `percepcion` | score encuestas recientes | configurable |
| `compuesta` | suma ponderada de capas activas | — |

### Bandas de intensidad (`config/umbrales-calor.json`)

| Banda | Rango ejemplo (ajustable) |
|---|---|
| `baja` | 0–24 |
| `media` | 25–49 |
| `alta` | 50–74 |
| `muy_alta` | 75+ |

### Entidad de salida `CeldaCalor`

| Campo | Tipo |
|---|---|
| `territorio_slug` | string |
| `colonia_slug` | string \| null |
| `capa` | enum capas |
| `score` | number |
| `banda` | enum bandas |
| `desglose` | objeto de aportes |
| `periodo` | desde–hasta |

### UI (decisión 2026-08-13)
- **En la demo P3 sí se muestran mapas** (no solo tabla/ranking): choropleth visual de alcaldías/colonias Oriente.  
- Implementación demo: **SVG / GeoJSON propio o simplificado** embebido en el frontend (sin comprar licencia GIS aún).  
- Complemento: lista “Top 10 calientes” + leyenda + toggle de capas.  
- Click en zona/colonia → panorama de esa celda.  
- **GIS comercial / licenciamiento** (ArcGIS, Mapbox, Google, etc.): **fuera de P3**; se decide tras autorización de arranque de proyecto real (Fase 1+). El mapa demo debe poder sustituirse después por un proveedor sin reescribir la lógica de scores (contrato `CeldaCalor` estable).

### Criterios de aceptación E7
- [ ] Cambiar capa recalcula bandas desde config.  
- [ ] Lista “Top 10 colonias calientes” coherente con scores.  
- [ ] Seeds demo producen al menos 3 colonias en bandas distintas.  
- [ ] Sin literales de umbral en frontend.

---

## 4. E8 — Corredores y tramos críticos

### Objetivo
Análogo a red carretera Puebla + asaltos a carga León + análisis camino-tramo Aguascalientes: **ejes territoriales** donde se concentran movilización, bloqueos, agravios o disputa de liderazgo.

### Catálogo `config/corredores.json`

```json
{
  "corredores": [
    {
      "slug": "eje-ermita-iztapalapa",
      "nombre": "Eje Ermita–Iztapalapa",
      "tipo": "eje_vial",
      "alcaldias": ["iztapalapa"],
      "tramos": [
        { "slug": "tramo-centro", "nombre": "Tramo centro", "colonias": ["barrio-arriba"] }
      ]
    }
  ]
}
```

### Vinculación
- `evento_coyuntura.corredor_slug` / `tramo_slug` (opcionales).  
- `reivindicacion.corredores[]` opcional (multi).  
- Lectura: ranking de corredores por eventos + demandas en ventana.

### UI
- `/inteligencia/corredores` listado + detalle tramo.  
- Reporte: “Corredores bajo presión”.

### Criterios de aceptación E8
- [ ] CRUD de vínculo en captura coyuntura (select de catálogo).  
- [ ] Ranking de corredores con conteos.  
- [ ] Catálogo editable vía `catalogos` (o JSON config + lectura API).

---

## 5. E9 — Sala operativa (ciclo de mando analítico)

### Objetivo
Traducir el “Programa Integral / Puesto de mando” de Aguascalientes a **ritmo de mesa SAETO**, sin despacho policial.

### Cuatro paneles de sala (Capa 1)

| Panel | Equivalente referencia | Contenido SAETO |
|---|---|---|
| **Registro** | Pantallas de registro | Accesos a captura (actores, reivs, coyuntura, encuestas) + últimos registros |
| **Análisis** | Análisis / mapas | Calor + panorama + corredores (widgets) |
| **Reporteador** | Reporteador | Atajos a reportes gerenciales existentes + nuevos P3 |
| **Priorización** | Vigilancia a puntos | Top sectores E10 + acciones sugeridas de mesa |

### Ritmo de evaluación (`config/ritmo-mesa.json`)

- Ventanas: `diaria` | `semanal`  
- Checklist de mesa (no hardcode): revisar escalando, calor muy_alta, corredores top, actores en_revision.  
- Entidad ligera `evaluacion_mesa` (append-only): fecha, rol, notas, focos_revisados[].

### Criterios de aceptación E9
- [ ] Dashboard expone 4 paneles con navegación U-First.  
- [ ] “Recalcular” refresca agregados.  
- [ ] Registrar evaluación de mesa (demo/runtime JSON).  
- [ ] No introduce comandos técnicos ni IDs visibles.

---

## 6. E10 — Sectorización y cobertura de mesa

### Objetivo
Distritación analítica: tamaño/prioridad de sectores según frecuencia de focos (no patrullaje).

### Salida `SectorCobertura`

| Campo | Regla |
|---|---|
| `sector_slug` | derivado de colonia o agrupación config |
| `prioridad` | 1–5 desde score calor compuesto |
| `motivo` | texto plantilla (top señales) |
| `recomendacion` | enum config: `verificar_campo` \| `seguimiento_diario` \| `monitoreo` \| `latencia` |
| `actores_a_revisar[]` | slugs (ocultos en UI; se muestran nombres) |

### Criterios de aceptación E10
- [ ] Lista de sectores ordenada por prioridad.  
- [ ] Recomendaciones desde catálogo, no inventadas en UI.  
- [ ] Enlace a panorama del sector.

---

## 7. E11 — Ficha de inteligencia de actor (sensible)

### Objetivo
Profundizar fichas tipo León (zona de operación, alias, red) **solo** bajo rol sensible.

### Campos nuevos (actores)

| Campo | Visibilidad |
|---|---|
| `alias[]` | mesa+ |
| `zona_operacion[]` (colonias/corredores) | mesa+ |
| `red_afiliacion` | sensible si `tipo_actor=generador_violencia` |
| `nivel_riesgo` | enum config; sensible |
| `cuenta_pendiente_seguridad` | texto corto; sensible |
| `fuente_inteligencia` | enum: `campo` \| `bd_gobierno` \| `medios` \| `otra` |

### Reglas
- Misma política E5: omitir sensibles sin rol; audit log de lectura.  
- Demo pública: seeds anonimizados / sin red real.  
- No mezclar PII ciudadana de encuestas + ficha sensible en el mismo payload hacia herramientas externas (regla UX/seguridad).

### Criterios de aceptación E11
- [ ] Campos visibles según rol demo.  
- [ ] Audit append-only al abrir ficha sensible.  
- [ ] Panorama/calor pueden usar `nivel_riesgo` agregado sin filtrar PII.

---

## 8. Requisitos no funcionales (P3)

- **Fase:** P3-A puede ser prototipo/demo (seeds). P3-B/C con escritura runtime siguen patrón JSON actual.  
- **HRU:** umbrales, capas, corredores, plantillas y recomendaciones en `config/`.  
- **Anti-God-Object:** módulo nuevo `inteligencia` solo **compone**; no posee master data ni >600 líneas monolíticas (partir `panorama` / `calor` / `corredores` / `cobertura`).  
- **Cero regresiones:** no romper P0–P2; chequeos de health + brief + reportes existentes.  
- **U-First:** selects, semáforo/bandas legibles, siempre Volver / Recalcular / Editar.  
- **Sin LLM/MCP/RAG** salvo decisión explícita posterior.  
- **Mapa en demo:** obligatorio (SVG/GeoJSON propio). **Licencia GIS comercial:** diferida a arranque real.

---

## 9. Fuera de alcance (explícito)

- Despacho de emergencias, IPH policial, radio C4, patrullaje real.  
- Integración en vivo con Plataforma México / SESNSP.  
- Predicción ML de violencia o coaliciones.  
- Auth SSO institucional (sigue gate de rol demo hasta acuerdo).  
- Compra/licenciamiento GIS comercial (se evalúa en arranque real; el demo usa mapa propio sustituible).  
- Ingesta masiva automática de carpetas `data_fase_2` como hechos Oriente (son **referencia metodológica**, no datos del territorio).

---

## 10. Criterio de “máquina de inteligencia” (definición de hecho)

SAETO P3 se considera logrado cuando un usuario de mesa puede, en <3 minutos y sin IDs técnicos:

1. Ver **dónde** está el calor (E7),  
2. Abrir el **panorama** de ese lugar (E6),  
3. Identificar **corredor/actor** asociado (E8/E11),  
4. Registrar o consultar la **evaluación de mesa** del día (E9),  
5. Obtener **recomendación de cobertura** (E10),  

…y todo eso alimentado por catálogos/seeds, con capas Capa 1 / Capa 2 respetadas.

---

*Fin SPECS P3 · Inteligencia territorial · SAETO*
