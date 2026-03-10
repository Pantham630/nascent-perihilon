from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/project/{project_id}", response_model=List[schemas.TaskResponse])
def list_tasks(project_id: int, milestone_id: Optional[int] = None,
               status: Optional[str] = None, assignee_id: Optional[int] = None,
               db: Session = Depends(get_db)):
    return crud.get_tasks(db, project_id, milestone_id, status, assignee_id)


@router.get("/project/{project_id}/search", response_model=List[schemas.TaskResponse])
def search_tasks(project_id: int, q: str, db: Session = Depends(get_db)):
    return crud.search_tasks(db, project_id, q)


@router.post("/project/{project_id}", response_model=schemas.TaskResponse)
def create_task(project_id: int, task: schemas.TaskCreate,
                created_by: Optional[int] = Query(None), db: Session = Depends(get_db)):
    return crud.create_task(db, project_id, task, created_by)


@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    t = crud.get_task(db, task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    return t


@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task: schemas.TaskUpdate,
                updated_by: Optional[int] = Query(None), db: Session = Depends(get_db)):
    t = crud.update_task(db, task_id, task, updated_by)
    if not t:
        raise HTTPException(404, "Task not found")
    return t


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    t = crud.delete_task(db, task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    return {"ok": True}


@router.post("/{task_id}/comments", response_model=schemas.CommentResponse)
def add_comment(task_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db)):
    return crud.create_comment(db, task_id=task_id, comment=comment)


@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    crud.delete_comment(db, comment_id)
    return {"ok": True}


@router.post("/{task_id}/time", response_model=schemas.TimeEntryResponse)
def log_time(task_id: int, entry: schemas.TimeEntryCreate, db: Session = Depends(get_db)):
    return crud.log_time(db, task_id, entry)


@router.get("/user/{user_id}", response_model=List[schemas.TaskResponse])
def my_tasks(user_id: int, db: Session = Depends(get_db)):
    return crud.get_tasks_by_user(db, user_id)


@router.get("/project/{project_id}/overdue", response_model=List[schemas.TaskResponse])
def overdue_tasks(project_id: int, db: Session = Depends(get_db)):
    return crud.get_overdue_tasks(db, project_id)


@router.post("/{task_id}/approvals", response_model=schemas.ApprovalResponse)
def request_approval(task_id: int, approval: schemas.ApprovalCreate, db: Session = Depends(get_db)):
    return crud.create_approval(db, approval)


@router.patch("/{task_id}/approvals/{approval_id}", response_model=schemas.ApprovalResponse)
def respond_approval(task_id: int, approval_id: int, status: str, 
                     note: Optional[str] = None, approver_id: Optional[int] = Query(None),
                     db: Session = Depends(get_db)):
    return crud.update_approval(db, approval_id, status, note, approver_id)
