from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import ai_engine, schemas

router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/project/{project_id}/risk", response_model=schemas.RiskAnalysis)
def get_project_risk(project_id: int, db: Session = Depends(get_db)):
    return ai_engine.get_risk_analysis(db, project_id)

@router.get("/project/{project_id}/health", response_model=schemas.ProjectHealth)
def get_project_health(project_id: int, db: Session = Depends(get_db)):
    return ai_engine.get_project_health_score(db, project_id)

@router.get("/project/{project_id}/suggestions", response_model=List[schemas.TaskSuggestion])
def get_task_suggestions(project_id: int, db: Session = Depends(get_db)):
    return ai_engine.suggest_tasks(db, project_id)

@router.get("/team/workload", response_model=List[schemas.WorkloadRisk])
def get_team_workload_risk(db: Session = Depends(get_db)):
    return ai_engine.get_workload_burnout_risk(db)

@router.get("/user/{user_id}/profile")
def get_user_ai_profile(user_id: int, db: Session = Depends(get_db)):
    profile = ai_engine.get_user_profile_ai(db, user_id)
    if not profile:
        raise HTTPException(404, "User not found")
    return profile
