# SAETO Backend

```powershell
# desde la raíz del repo, con venv activo
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

API en **puerto 8001** (el front hace proxy `/api` → 8001).

Estructura modular: `api/routes` solo despacha; dominio en `modules/*/service.py`.
Seeds en `data/demo/`; catálogos en `config/`.
