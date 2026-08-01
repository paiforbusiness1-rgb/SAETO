from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    actores,
    catalogos,
    coyuntura,
    dashboard,
    discurso,
    meta,
    observatorio,
    reportes,
)

app = FastAPI(
    title="SAETO API",
    description="Sistema de Análisis Estratégico Territorial Oriente — captura + reportes",
    version="0.4.0",
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
app.include_router(reportes.router)
