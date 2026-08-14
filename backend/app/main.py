from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    actores,
    catalogos,
    consumibles,
    coyuntura,
    cuarto,
    dashboard,
    discurso,
    encuestas,
    ia,
    inteligencia,
    meta,
    observatorio,
    reportes,
)

# Carga opcional de backend/.env para GROQ_API_KEY en local
try:
    from pathlib import Path

    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
except Exception:
    pass

app = FastAPI(
    title="SAETO API",
    description="Sistema de Análisis Estratégico Territorial Oriente — captura + reportes + inteligencia + IA + consumibles + cuarto de situación",
    version="0.8.1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meta.router)
app.include_router(catalogos.router)
app.include_router(dashboard.router)
app.include_router(observatorio.router)
app.include_router(actores.router)
app.include_router(discurso.router)
app.include_router(coyuntura.router)
app.include_router(encuestas.router)
app.include_router(inteligencia.router)
app.include_router(ia.router)
app.include_router(consumibles.router)
app.include_router(cuarto.router)
app.include_router(reportes.router)
