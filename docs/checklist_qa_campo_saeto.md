# Checklist QA — listo para pruebas de campo SAETO

**Versión:** 1.0 · 2026-08-01  
**Entorno de prueba:** _________________ (local / otro)  
**Ejecutado por:** _________________ **Fecha:** ________  

Marque `[x]` al pasar. Anote fallos en “Notas”.

---

## 0. Preparación

- [ ] Backend en `8001` (`uvicorn` desde `backend/` con `.venv`)  
- [ ] Frontend en `5173` (`npm run dev`)  
- [ ] Distintivo DEMO visible  
- [ ] (Opcional) Borrar `backend/data/runtime/encuestas.json` para bootstrap limpio  

---

## 1. Build y salud

- [ ] `npm run build` en `frontend/` sin error  
- [ ] `GET /api/health` → ok  
- [ ] `GET /api/encuestas/plantillas` → 3 plantillas (6 / 28 / 23 preguntas)  

---

## 2. QUÉ — Reivindicaciones y ciclo

- [ ] Listado Observatorio carga  
- [ ] Ficha `agua-barrio-arriba`: fase, peso, semáforo  
- [ ] Filtros / historial de fase (si aplica)  
- [ ] Reporte Ciclo vital abre con KPIs  

---

## 3. QUIÉN — Actores y roles

- [ ] Listado Actores con aviso “no es GIS”  
- [ ] Rol **Lector**: no aparece Actor demo Oriente-01  
- [ ] Rol **Analista sensible**: aparece Oriente-01; se ve interés reservado  
- [ ] Laura Méndez: estimada vs comprobada  
- [ ] Reporte Mapa de poder abre  

---

## 4. CÓMO — Coyuntura

- [ ] Listado/detalle coyuntura de agua-barrio-arriba  
- [ ] Se distinguen acción / respuesta / reacción / resultado  
- [ ] Reporte Bitácora coyuntura abre  

---

## 5. DISCURSO

- [ ] Listado y ficha con rúbricas de mesa  
- [ ] Niveles (Capa 2) visibles  
- [ ] Reporte Discurso de mesa abre  

---

## 6. Encuestas

- [ ] Tres plantillas en selector de Captura → Nueva  
- [ ] Guardar 1 respuesta rápida → aparece en listado  
- [ ] Archivo runtime `backend/data/runtime/encuestas.json` existe tras guardar  
- [ ] Copy visible: encuesta no crea reivindicaciones solas  
- [ ] Reporte Encuestas abre  

---

## 7. Cruce INEGI + percepción + encuesta

- [ ] Reporte Contexto INEGI: KPI Tripletes ≥ 1 (Barrio Arriba)  
- [ ] Tabla triplete con demanda, indicador, #encuestas y lectura  
- [ ] Lectura gerencial (recuadro) no vacía  

---

## 8. UX mesa

- [ ] En cada pantalla de prueba hay **Volver** o equivalente  
- [ ] Menú móvil (≤900px) Menú/Cerrar funciona  
- [ ] Hubs Captura y Reportes enlazan Encuestas e INEGI  

---

## 9. Ensayo operadores (opcional el mismo día)

- [ ] Capturista: 1 alta encuesta OK  
- [ ] Gerencia: Sala + 3 reportes + frase de decisión  
- [ ] Tiempo total anotado: ______ min  

---

## Resultado

| Campo | Valor |
|-------|--------|
| Resultado | Pendiente / Aprobado / Aprobado con observaciones |
| Firma / nombre | |
| Notas | |

---

## Fuera de alcance (no fallar el QA por esto)

SSO · GIS · PDF formal · API INEGI live · BD productivas · persistencia plena en Vercel
