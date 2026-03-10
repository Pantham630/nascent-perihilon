from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app import crud, schemas
from app.database import get_db

router = APIRouter(
    prefix="/tickets",
    tags=["tickets"],
    responses={404: {"description": "Not found"}},
)

# --- SEARCH ---
@router.get("/search", response_model=List[schemas.TicketResponse])
def search_tickets(q: str, db: Session = Depends(get_db)):
    if not q:
        return []
    return crud.search_tickets(db, query=q)

# --- URGENT ---
@router.get("/urgent", response_model=List[schemas.TicketResponse])
def get_urgent_tickets(db: Session = Depends(get_db)):
    """Returns tickets with deadline within 48 hours that are not done."""
    return crud.get_urgent_tickets(db)

# --- DASHBOARD ---
@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)

# --- CRUD ---
@router.post("/", response_model=schemas.TicketResponse)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    return crud.create_ticket(db=db, ticket=ticket)

@router.get("/", response_model=List[schemas.TicketResponse])
def read_tickets(
    skip: int = 0, limit: int = 200,
    deadline_before: Optional[datetime] = None,
    deadline_after: Optional[datetime] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return crud.get_tickets(db, skip=skip, limit=limit,
                            deadline_before=deadline_before, deadline_after=deadline_after,
                            priority=priority, status=status)

@router.get("/{ticket_id}", response_model=schemas.TicketResponse)
def read_ticket(ticket_id: int, db: Session = Depends(get_db)):
    db_ticket = crud.get_ticket(db, ticket_id=ticket_id)
    if db_ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return db_ticket

@router.put("/{ticket_id}", response_model=schemas.TicketResponse)
def update_ticket(ticket_id: int, ticket: schemas.TicketUpdate, db: Session = Depends(get_db)):
    db_ticket = crud.update_ticket(db, ticket_id=ticket_id, ticket=ticket)
    if db_ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return db_ticket

@router.delete("/{ticket_id}")
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    db_ticket = crud.delete_ticket(db, ticket_id=ticket_id)
    if db_ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"message": "Ticket deleted successfully"}

# --- TODOS ---
@router.post("/{ticket_id}/todos/", response_model=schemas.TodoResponse)
def create_todo_for_ticket(ticket_id: int, todo: schemas.TodoCreate, db: Session = Depends(get_db)):
    db_ticket = crud.get_ticket(db, ticket_id=ticket_id)
    if db_ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return crud.create_todo(db=db, ticket_id=ticket_id, todo=todo)

@router.put("/todos/{todo_id}")
def update_todo(todo_id: int, is_completed: bool, db: Session = Depends(get_db)):
    db_todo = crud.update_todo(db, todo_id=todo_id, is_completed=is_completed)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo

@router.delete("/todos/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = crud.delete_todo(db, todo_id=todo_id)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"message": "Todo deleted successfully"}

# --- COMMENTS ---
@router.post("/{ticket_id}/comments/", response_model=schemas.CommentResponse)
def add_comment(ticket_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db)):
    db_ticket = crud.get_ticket(db, ticket_id=ticket_id)
    if db_ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return crud.create_comment(db=db, ticket_id=ticket_id, comment=comment)

@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    result = crud.delete_comment(db, comment_id=comment_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted"}
