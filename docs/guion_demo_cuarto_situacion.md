# Guion — Cuarto de situación (recorrido guiado)

**Objetivo:** meter **un** problema de agua al cuarto y salir con recomendaciones de mesa en ~8 minutos. Datos territoriales de demostración; la mesa no arma el relato entre menús.

## Arranque

1. Backend: `uvicorn main:app --reload --port 8001` desde `backend/`
2. Frontend: `npm run dev` en `frontend/`
3. Abrir http://127.0.0.1:5173
4. Rol en la barra: **Analista** (la IA es opcional; el recorrido cierra sin ella)

## Recorrido (~8 min)

1. Menú **Cuarto de situación** (o brief → tarjeta Agua Oriente).
2. Abrir **Agua y tandeo en Oriente**.
3. **El problema** — tandeo, semáforo, cuenta pendiente. No se leen IDs.
4. **Dónde está** — mapa de calor hídrico (Barrio Arriba y vecinas).
5. **A quién impacta** — población, viviendas, lista nominal agregada.
6. **Instalaciones** — tanque, pipas, pozo (marcadores dorados).
7. **Qué se decidió** — plantón, mesa, silencio, bloqueo: fechas y resultado.
8. **Entonces y ahora** — marzo 2024 vs agosto 2026.
9. **Contexto de analista** — plantilla lista. Opcional: Generar lectura IA.
10. **Decisión de mesa** — cuatro recomendaciones de cobertura (no patrullaje).
11. Cierre: **Descargar diagnóstico** (PDF del caso con mapas del recorte). El mismo flujo, con su información, sin rehacer la mesa. Probar **Basura Iztacalco** si hay tiempo.

## Qué no mostrar

War Room, voceros, pauta, promesas de campaña, electoral por sección.
