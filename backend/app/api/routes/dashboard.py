from fastapi import APIRouter

from app.modules.dashboard import service
from app.shared.schemas import BriefWrite

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/brief")
def brief():
    return service.get_brief()


@router.get("/brief/raw")
def brief_raw():
    return service.get_brief_raw()


@router.put("/brief")
def actualizar_brief(payload: BriefWrite):
    return service.update_brief(payload)
