# Guion demo — Datos públicos + IA Groq → puente a datos privados

**Objetivo:** mostrar que SAETO ya consume hechos públicos/demo y que el mismo botón IA servirá sobre BD privada.

## Arranque local

1. Backend:
   ```powershell
   cd backend
   copy .env.example .env
   # pegar GROQ_API_KEY=gsk_...
   ..\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8001
   ```
2. Frontend: `cd frontend; npm run dev`
3. Rol demo: **Analista** (o superior) en la barra.

## Guion (8–10 min)

1. **Sala** → Inteligencia → Mapa de calor (OSM real).  
2. Clic colonia caliente → **Panorama** → “Generar lectura IA”.  
3. Abrir reivindicación (agua Barrio Arriba) → **IA · Contexto de decisión**.  
4. Inteligencia → **IA · Clasificar texto** (pegar nota de prensa inventada/pública).  
5. Cierre: “Hoy hechos públicos/demo; mañana el mismo flujo con su BD, sin rehacer la mesa.”

## Qué no promete la demo

- No clasifica automáticamente toda su BD aún.  
- No envía intereses reservados ni PII de encuestas a Groq.  
- No sustituye verificación de campo.
