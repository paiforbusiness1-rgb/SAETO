# Plan breve — Mapa real Leaflet (demo Oriente)

**Estado:** IMPLEMENTADO EN LOCAL (2026-08-13) — validar UI antes de GitHub/Vercel  
**Fecha:** 2026-08-13  
**Aprobación:** “adelante” (Leaflet gratis)

## Alcance
- Sustituir SVG demo por **Leaflet + OpenStreetMap** + GeoJSON de alcaldías Oriente.
- Choropleth por `CeldaCalor` (mismo API `/inteligencia/calor`).
- Marcadores de colonias demo con lat/lng.
- Atribución OSM obligatoria.
- Sin licencia comercial; sustituible después.

## Impacto
- `frontend`: leaflet/react-leaflet, geo assets, `MapaCalorTerritorial.tsx`, CSS.
- Backend: sin cambios.
- No-regresión: build + endpoint calor intacto.

## Despliegue
Probar en local → luego commit/push a GitHub → Vercel (pedido explícito).
