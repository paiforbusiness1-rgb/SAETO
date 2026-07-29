# SAETO — Fase 0 (prototipo)

Sistema de Análisis Estratégico Territorial Oriente.

**Repo:** [paiforbusiness1-rgb/SAETO](https://github.com/paiforbusiness1-rgb/SAETO)

## Arranque rápido (< 5 minutos)

### 1. Backend (Python + venv)

```powershell
cd "c:\Analisi Estrategico Zona Oriente CDMX"
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd backend
uvicorn app.main:app --reload --port 8001
```

API: http://127.0.0.1:8001/api/health  
Docs: http://127.0.0.1:8001/docs

### 2. Frontend (React + Vite)

En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

UI: http://127.0.0.1:5173

## Publicación en Vercel (front)

`vercel.json` construye el frontend estático. El **backend FastAPI** no corre en Vercel; para producción hay que desplegar la API aparte (Railway, Render, Fly.io, etc.) y apuntar el front a esa URL.

## Qué demuestra

- Sala de situación (brief ejecutivo)
- Reivindicaciones con semáforo
- Mapa de actores
- Laboratorio de discurso (7 niveles)
- Catálogos y Captura (persistencia JSON local)
- Reportes visuales gerenciales
- UI glassmorphism · datos DEMO

## Nota

Los nombres y cifras son **ficticios** para la venta conceptual al subsecretario.
