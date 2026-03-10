from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/{user_id}", response_model=List[schemas.NotificationResponse])
def get_notifications(user_id: int, db: Session = Depends(get_db)):
    return crud.get_notifications(db, user_id)


@router.post("/{user_id}/read-all")
def mark_all_read(user_id: int, db: Session = Depends(get_db)):
    crud.mark_notifications_read(db, user_id)
    return {"ok": True}
