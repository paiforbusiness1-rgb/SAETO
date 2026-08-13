# SAETO — Fase 0 (prototipo)

Sistema de Análisis Estratégico Territorial Oriente.

**Repo:** [paiforbusiness1-rgb/SAETO](https://github.com/paiforbusiness1-rgb/SAETO)

## Arranque local

### Backend

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
cd backend
uvicorn main:app --reload --port 8001
```

API: http://127.0.0.1:8001/api/health

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

UI: http://127.0.0.1:5173

## Deploy en Vercel (Services)

El `vercel.json` define dos servicios:

- **frontend** (Vite) en `/`
- **backend** (FastAPI) en `/api/*`

En Vercel: Import Git Repository → elige `paiforbusiness1-rgb/SAETO` → Root Directory `./` → Deploy.

Nota: en Vercel el filesystem es de solo lectura; la **Captura** que escribe JSON puede fallar o no persistir. La sala, reportes y lectura de demos sí funcionan.

## Qué incluye

Sala de situación, catálogos, captura, discurso, reportes gerenciales, inteligencia territorial (mapa real OSM), módulo IA Groq (lectura/clasificación/contexto), UI glassmorphism (datos DEMO).

## IA Groq (local)

1. Copia `backend/.env.example` → `backend/.env`
2. Define `GROQ_API_KEY=...`
3. Reinicia uvicorn
4. En la UI (rol Analista+): Panorama / Ficha reiv / Inteligencia → IA clasificar

Ver `docs/guion_demo_ia_publicos.md`.
