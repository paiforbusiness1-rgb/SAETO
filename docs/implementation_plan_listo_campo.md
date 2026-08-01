# Plan APO — Listo para pruebas de campo (Fase 0)

**Estado:** IMPLEMENTADO  
**Aprobación:** «aprobada!» (2026-08-01)  
**Alcance:** cerrar la brecha entre “marco cliente implementado” y “probado / listo para ensayo de campo”.  
**Fuera de alcance (explícito):** SSO, GIS cartográfico, PDF formales, API INEGI live, BD reales, LLM/MCP/RAG.

---

## Objetivo

Declarar, con evidencia reproducible, que el marco **QUÉ / QUIÉN / DISCURSO / CÓMO** (más encuestas y reportes) está:

1. **Atendido a cabalidad** en prototipo (ya mayormente cierto).  
2. **Ilustrado** con seeds demo sensibles y cruces legibles.  
3. **Probado** con checklist QA + guion de mesa.  
4. **Puesto a disposición** de pruebas de campo (manual + entorno local operable).

---

## Inventario de huecos → entregables

| # | Hueco | Tipo APO | Entregable |
|---|--------|----------|------------|
| A | Guion demo cerrado | Doc + seeds de coherencia | `docs/guion_demo_campo_saeto.md` + ajustes mínimos de seeds para que el guion cierre |
| B | Tipología violencia poco ilustrada | Datos demo (seed) | Actor `generador_violencia` anonimizado + vínculo a 1 demanda/coyuntura |
| C | Cruce percepción–INEGI débil | Dominio leve + UI reporte | Misma colonia: encuesta + indicador + demanda; lectura gerencial fija; opcional bloque en Sala/Observatorio |
| D | Sin evidencia QA | Doc de prueba | `docs/checklist_qa_campo_saeto.md` (pasos ejecutables; resultado “pendiente/firmado”) |
| E | Ensayo operadores | Doc operativo | Sección en guion/manual: roles capturista vs gerencia; Vercel = vitrina vs local con disco |
| F | Expectativas (“Mapa”, encuesta≠demanda) | UI cosmética + manual | Copy en hubs/Mapa de actores + Manual § aclaraciones |

---

## Cadena de impacto (antes de tocar código)

### A — Guion demo

```
docs/guion_demo_campo_saeto.md
  → referencia seeds: territorio colonia X, reivindicación Y, actor Z,
    coyuntura C, discurso D, encuestas E1–E3, indicadores I1–I2
  → pantallas: Sala → Observatorio → Actores → Coyuntura → Discurso → Encuestas → Reportes
```

**Efectos:** solo documentación + posible reorden/ajuste de `notas` en seeds (sin cambiar contratos).

### B — Seed generador_violencia

```
backend/data/demo/actores.seed.json (+ opcional reivindicaciones/coyuntura)
  → enrich / ficha actor / reporte actores
  → GlassNav rol: campos sensibles ocultos a lector
```

**Efectos secundarios:** listados y reportes incluyen 1 ficha más; audit si se abre interés reservado.  
**No cambia:** schema ni catálogo `poder-recursos` (ya tiene el tipo).

### C — Cruce percepción–INEGI

```
UI/reporte ← reportes/service.reporte_contexto_inegi (+ quizá brief/encuestas)
  ← seeds: asegurar 1 colonia con (demanda peso alto + indicador + ≥1 encuesta)
  ← config umbrales heurísticos (solo si hace falta; preferir datos demo)
```

**Propuesta de comportamiento (Fase 0):**

1. Ampliar `reporte_contexto_inegi` (o sección hermanada) con fila explícita:  
   `colonia | indicador INEGI | peso_opinion demanda top | #respuestas encuesta | lectura`.  
2. Lectura gerencial **fija** cuando haya triplete (no solo heurística silenciosa).  
3. Disclaimer: no es índice oficial; es lectura de mesa.  
4. Opcional UX: en ficha Observatorio de esa colonia, enlace “Ver cruce INEGI / encuesta”.

**No introduce:** correlación estadística formal ni API INEGI.

### D — Checklist QA

Documento con bloques:

- Backend: health, plantillas encuestas, CRUD smoke por módulo clave.  
- Frontend: `npm run build` + rutas de los 9 reportes + captura.  
- Roles: lector no ve reservados; analista sí.  
- Persistencia: runtime encuestas escribe; reinicio = borrar runtime.  
- Casilla “Firmado por / fecha” para ensayo.

### E — Ensayo operadores

Incluido en guion § “Protocolo de ensayo (30–45 min)”:

1. Capturista: alta encuesta + coyuntura.  
2. Gerencia: Sala + 3 reportes + decisión verbal.  
3. Criterio de salida: sin callejón sin “Volver”; tiempos anotados.

### F — Expectativas

- `GlassNav` / hub Actores: subtítulo “ranking territorial, no GIS”.  
- Manual + Captura encuestas: “no crea reivindicaciones solas; la mesa decide el cruce”.  
- Reportes hub: una línea sobre contraste percepción/INEGI.

---

## Archivos previstos a tocar

| Área | Archivos |
|------|----------|
| Docs | `docs/guion_demo_campo_saeto.md`, `docs/checklist_qa_campo_saeto.md`, `docs/implementation_plan_listo_campo.md` (este), `MANUAL_DE_USUARIO SAETO.md` (sección breve) |
| Seeds | `actores.seed.json`, posiblemente `reivindicaciones`, `coyuntura`, `indicadores_contexto`, `encuestas.seed` (misma colonia) |
| Backend | `modules/reportes/service.py` (contexto-inegi / lectura), quizá schemas de respuesta si se amplía payload |
| Frontend | `ReporteContextoInegiPage.tsx`, copy hubs (`CapturaHub`, `ReportesHub`, Actores/Mapa), quizá Observatorio ficha |
| Nav | `GlassNav.tsx` o página Actores — solo copy |

**No tocar:** auth, mapas, deploy Vercel schema, plantillas encuesta íntegras (salvo 1–2 respuestas demo alineadas al guion).

---

## Orden de implementación

1. **A+B** — Guion + seed violencia + coherencia territorial de seeds.  
2. **C** — Enriquecer reporte cruce + UI.  
3. **F** — Copy expectativas.  
4. **D+E** — Checklist QA + protocolo ensayo en docs/manual.  
5. Ejecutar checklist una vez en local; anotar resultado en el checklist (o dejar “pendiente de firma cliente”).

---

## Criterios de aceptación

1. Guion de ≤2 páginas permite a un no-ingeniero recorrer QUÉ→QUIÉN→DISCURSO→CÓMO→encuestas→reportes en una colonia demo.  
2. Existe ≥1 actor `generador_violencia` demo; rol lector no ve intereses/recursos sensibles.  
3. En `/reportes/contexto-inegi` (o vista acordada) se ve **al menos un** triplete colonia–indicador–percepción/encuesta con lectura en lenguaje claro.  
4. Checklist QA existe y es ejecutable; build front verde.  
5. Manual aclara Mapa≠GIS y encuesta≠alta automática de demanda.  
6. Sin SSO/GIS/PDF/API INEGI live.

---

## Riesgos y mitigación

| Riesgo | Mitigación |
|--------|------------|
| Seed violencia mal leído en demo pública | Anonimizar nombre; `demo: true`; disclaimer; ocultación por rol |
| Ampliar reporte rompe UI | Extender payload aditivo; UI tolera campos nuevos |
| Runtime encuestas ensucia ensayo | Checklist: borrar `runtime/encuestas.json` antes del ensayo |
| Sobre-promesa “probado” | Checklist firmado por operador; no afirmar certificación institucional |

---

## Proporcionalidad APO

- **Dominio:** solo el cruce reporte INEGI/percepción/encuesta (C) y seeds (B/A).  
- **UI cosmética / docs:** F, D, E, partes de A — sin reglas de negocio nuevas embebidas.  
- Si al implementar C aparece efecto colateral en Observatorio/brief: **detener**, actualizar este plan, nueva aprobación.

---

## Pedido de aprobación

¿Apruebas este plan (**A–F** tal como está) para implementarlo en esa secuencia?
