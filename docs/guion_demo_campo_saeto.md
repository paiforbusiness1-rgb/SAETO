# Guion demo — pruebas de campo SAETO (Fase 0)

**Territorio ancla:** Barrio Arriba (Iztapalapa)  
**Duración sugerida:** 25–40 min  
**Datos:** seeds demo + capturas en runtime local  

> Distintivo **DEMO**. No representa personas ni registros oficiales.

---

## Hilo narrativo (una sola colonia)

| Pieza | Dónde verla |
|-------|-------------|
| Demanda histórica agua | Reivindicaciones → `agua-barrio-arriba` |
| Actor vecinal dual | Actores → Laura Méndez (estimado/comprobado) |
| Tipología sensible | Rol **Analista sensible** → Actor demo Oriente-01 |
| Cadena CÓMO | Coyuntura ligada a agua-barrio-arriba |
| Discurso | Pieza ligada al territorio/actor (módulo Discurso) |
| Encuestas | Varias en Barrio Arriba (rápida / percepción / diagnóstico) |
| INEGI | Indicador disponibilidad de agua en Barrio Arriba |
| Triplete | Reportes → Contexto INEGI |

---

## Recorrido paso a paso

### 1. Sala (QUÉ — Capa 1) — 3 min
1. Abrir **Sala de situación**.  
2. Leer resumen, semáforo y focos que escalan.  
3. Localizar demanda de agua / Barrio Arriba si aparece en top.

### 2. Observatorio (QUÉ) — 5 min
1. **Reivindicaciones** → filtrar o abrir `Agua · Barrio Arriba`.  
2. Revisar: tipo (histórica/actual), fase de ciclo, peso de opinión, deuda si aplica.  
3. Ver timeline de coyuntura en la ficha.

### 3. Actores (QUIÉN) — 5 min
1. **Actores** — leer el aviso: ranking, **no GIS**.  
2. Abrir Laura Méndez: movilización estimada vs comprobada, poder, interés declarado.  
3. Cambiar rol demo a **Lector**: no debe listar tipología violenta.  
4. Cambiar a **Analista sensible**: ver **Actor demo Oriente-01** (anonimizado), interés reservado y recursos sensibles.

### 4. Coyuntura (CÓMO) — 4 min
1. Abrir eventos de Barrio Arriba / agua.  
2. Seguir: tipo de acción → respuesta gobierno → reacción → resultado / impacto de ciclo.

### 5. Discurso — 4 min
1. Abrir una pieza: narrativas, argumentos, ideología, emociones, endo/exo, hipótesis de coalición.  
2. Desplegar Capa 2 (7 niveles) si aplica.

### 6. Encuestas — 5 min
1. **Captura → Encuestas** (o menú Encuestas).  
2. Filtrar plantilla; abrir una de Barrio Arriba.  
3. Recordar: **no crea reivindicaciones solas**.

### 7. Cruce decisión (N.B.) — 5 min
1. **Reportes → Contexto INEGI**.  
2. Leer recuadro dorado (lectura gerencial).  
3. Tabla **Triplete**: demanda + indicador + #encuestas en Barrio Arriba.  
4. Opcional: Reporte Encuestas + Cuentas pendientes.

### 8. Cierre gerencial — 2 min
Una frase de mesa, p. ej.: *“En Barrio Arriba el peso de opinión sobre agua choca con el indicador referencial y se refuerza con encuestas; verificar en campo antes de priorizar.”*

---

## Protocolo de ensayo con operadores (E)

| Rol | Tarea | Criterio de salida |
|-----|--------|-------------------|
| **Capturista** | Alta de 1 encuesta (cualquier plantilla) en Barrio Arriba + 1 nota en coyuntura o actor | Guardó sin callejón; hay **Volver** |
| **Gerencia** | Sala → 3 reportes (ejecutivo, INEGI, encuestas) → frase de decisión | ≤15 min; entiende DEMO |

**Entorno:** captura plena en **local** (disco escribible). En Vercel, Captura puede ser solo vitrina.

**Antes del ensayo:** si hace falta demo limpia de encuestas, borrar `backend/data/runtime/encuestas.json` (vuelve al seed).

---

## Expectativas explícitas

- **Mapa de actores / mapa de poder** = ranking por territorio, **no cartografía GIS**.  
- **Encuesta** alimenta percepción y reportes; **no** da de alta reivindicaciones automáticamente.  
- **INEGI** es referencial demo, no levantamiento SAETO.  
- Tipología violenta y reservados = solo roles sensibles.
