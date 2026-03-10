from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/users", response_model=List[schemas.UserResponse])
def list_users(db: Session = Depends(get_db)):
    return crud.get_users(db)


@router.post("/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)


@router.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    u = crud.get_user(db, user_id)
    if not u:
        raise HTTPException(404, "User not found")
    return u


@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, user: schemas.UserUpdate, db: Session = Depends(get_db)):
    u = crud.update_user(db, user_id, user)
    if not u:
        raise HTTPException(404, "User not found")
    return u


@router.get("/workload")
def workload(db: Session = Depends(get_db)):
    return crud.get_workload_summary(db)


@router.get("/templates", response_model=List[schemas.TemplateResponse])
def list_templates(db: Session = Depends(get_db)):
    return crud.get_templates(db)


@router.post("/templates", response_model=schemas.TemplateResponse)
def create_template(tpl: schemas.TemplateCreate, db: Session = Depends(get_db)):
    return crud.create_template(db, tpl)
