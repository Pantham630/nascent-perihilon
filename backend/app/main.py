from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import projects, milestones, tasks, auth, notifications, ai
from . import crud
from .database import SessionLocal

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LaunchPad API",
    description="Project Delivery & Client Onboarding Platform",
    version="3.0.0"
)

origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(milestones.router)
app.include_router(tasks.router)
app.include_router(notifications.router)
app.include_router(ai.router)


@app.on_event("startup")
def on_startup():
    """Seed default users and templates on first run."""
    db = SessionLocal()
    try:
        crud.seed_users(db)
        crud.seed_templates(db)
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"message": "LaunchPad API v3.0 — Project Delivery Platform"}


@app.get("/health")
def health():
    return {"status": "ok"}
