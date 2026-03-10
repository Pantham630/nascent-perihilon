from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)


@router.get("/search", response_model=schemas.GlobalSearchResponse)
def global_search(q: str, db: Session = Depends(get_db)):
    return crud.global_search(db, q)


@router.get("/", response_model=List[schemas.ProjectSummary])
def list_projects(status: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_project_summaries(db, status=status)


@router.post("/", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return crud.create_project(db, project)


@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    p = crud.get_project(db, project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    return p


@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: int, project: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    p = crud.update_project(db, project_id, project)
    if not p:
        raise HTTPException(404, "Project not found")
    return p


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    p = crud.delete_project(db, project_id)
    if not p:
        raise HTTPException(404, "Project not found")
    return {"ok": True}


@router.post("/{project_id}/members", response_model=schemas.ProjectMemberResponse)
def add_member(project_id: int, member: schemas.ProjectMemberCreate, db: Session = Depends(get_db)):
    return crud.add_project_member(db, project_id, member)


@router.delete("/{project_id}/members/{user_id}")
def remove_member(project_id: int, user_id: int, db: Session = Depends(get_db)):
    crud.remove_project_member(db, project_id, user_id)
    return {"ok": True}



@router.get("/{project_id}/activity", response_model=List[schemas.ActivityLogResponse])
def project_activity(project_id: int, limit: int = 30, db: Session = Depends(get_db)):
    return crud.get_project_activity(db, project_id, limit)


# ─── Documents ───────────────────────────────────
@router.get("/{project_id}/documents", response_model=List[schemas.DocumentResponse])
def list_docs(project_id: int, db: Session = Depends(get_db)):
    return crud.get_documents(db, project_id)


@router.post("/{project_id}/documents")
async def upload_doc(project_id: int, db: Session = Depends(get_db),
                     filename: str = Query(...), mime_type: str = Query("application/octet-stream"),
                     uploaded_by: Optional[int] = Query(None), is_client: bool = Query(False)):
    doc = crud.create_document(db, project_id, filename=filename, file_data="",
                               mime_type=mime_type, size_bytes=0,
                               uploaded_by=uploaded_by, is_client=is_client)
    return doc


@router.delete("/{project_id}/documents/{doc_id}")
def delete_doc(project_id: int, doc_id: int, db: Session = Depends(get_db)):
    crud.delete_document(db, doc_id)
    return {"ok": True}


# ─── Threads ─────────────────────────────────────
@router.get("/{project_id}/threads", response_model=List[schemas.ThreadResponse])
def list_threads(project_id: int, db: Session = Depends(get_db)):
    return crud.get_threads(db, project_id)


@router.post("/{project_id}/threads", response_model=schemas.ThreadResponse)
def create_thread(project_id: int, thread: schemas.ThreadCreate, db: Session = Depends(get_db)):
    return crud.create_thread(db, project_id, thread)


@router.post("/{project_id}/threads/{thread_id}/comments", response_model=schemas.CommentResponse)
def add_thread_comment(project_id: int, thread_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db)):
    return crud.create_comment(db, thread_id=thread_id, comment=comment)
