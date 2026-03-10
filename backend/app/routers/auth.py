from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas, auth_utils
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = auth_utils.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, email=login_data.email, password=login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth_utils.create_access_token(data={"user_id": user.id, "email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: schemas.UserResponse = Depends(get_current_user)):
    return current_user

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
