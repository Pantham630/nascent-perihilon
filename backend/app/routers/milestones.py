from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/milestones", tags=["milestones"])


@router.get("/project/{project_id}", response_model=List[schemas.MilestoneResponse])
def list_milestones(project_id: int, db: Session = Depends(get_db)):
    return crud.get_milestones(db, project_id)


@router.post("/project/{project_id}", response_model=schemas.MilestoneResponse)
def create_milestone(project_id: int, ms: schemas.MilestoneCreate, db: Session = Depends(get_db)):
    return crud.create_milestone(db, project_id, ms)


@router.put("/{ms_id}", response_model=schemas.MilestoneResponse)
def update_milestone(ms_id: int, ms: schemas.MilestoneUpdate, db: Session = Depends(get_db)):
    result = crud.update_milestone(db, ms_id, ms)
    if not result:
        raise HTTPException(404, "Milestone not found")
    return result


@router.delete("/{ms_id}")
def delete_milestone(ms_id: int, db: Session = Depends(get_db)):
    crud.delete_milestone(db, ms_id)
    return {"ok": True}
