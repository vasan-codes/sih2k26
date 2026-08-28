from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.models import ModelRegistryEntry
from app.db.session import get_db
from app.schemas.schemas import ModelRegistryOut

router = APIRouter(prefix="/api", tags=["models"])


@router.get("/models", response_model=list[ModelRegistryOut])
def api_list_models(db: Session = Depends(get_db)):
    return db.query(ModelRegistryEntry).order_by(ModelRegistryEntry.task).all()
