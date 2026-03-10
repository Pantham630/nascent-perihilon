from sqlalchemy.orm import Session
from sqlalchemy import text, func
from datetime import datetime, timedelta, timezone
from . import models, schemas


# ─────────────────────── Helpers ───────────────────────
def _log(db: Session, action: str, project_id=None, task_id=None, user_id=None, meta=None):
    db.add(models.ActivityLog(
        action=action, project_id=project_id, task_id=task_id,
        user_id=user_id, meta=meta
    ))


def _task_uid(db: Session) -> str:
    row = db.execute(text("SELECT id FROM tasks ORDER BY id DESC LIMIT 1")).fetchone()
    next_id = (row[0] + 1) if row else 1
    return f"TSK-{next_id:04d}"


# ─────────────────────── Seed Data ───────────────────────
def seed_users(db: Session):
    """Create default team members if none exist."""
    if db.query(models.User).count() > 0:
        return
    defaults = [
        {"name": "Alex Johnson", "email": "alex@company.com", "role": "admin"},
        {"name": "Sarah Chen", "email": "sarah@company.com", "role": "pm"},
        {"name": "Marco Rivera", "email": "marco@company.com", "role": "member"},
        {"name": "Priya Patel", "email": "priya@company.com", "role": "member"},
        {"name": "Tom Acme", "email": "tom@acme-client.com", "role": "client"},
    ]
    for u in defaults:
        db.add(models.User(**u))
    db.commit()


def seed_templates(db: Session):
    """Create starter project templates if none exist."""
    if db.query(models.Template).count() > 0:
        return
    t = models.Template(
        name="Standard Onboarding",
        description="Default customer onboarding workflow",
        config={
            "milestones": [
                {"title": "Kickoff", "tasks": ["Schedule kickoff call", "Send welcome email", "Collect requirements doc"]},
                {"title": "Setup", "tasks": ["Provision accounts", "Configure integrations", "Data migration"]},
                {"title": "Training", "tasks": ["User training session", "Share documentation", "Q&A session"]},
                {"title": "Go Live", "tasks": ["Final UAT", "Go-live sign-off", "Hypercare period"]},
            ]
        }
    )
    db.add(t)
    db.commit()


# ─────────────────────── Users ───────────────────────
def get_users(db: Session, skip=0, limit=100):
    return db.query(models.User).filter(models.User.active == True).offset(skip).limit(limit).all()


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        for k, v in user.model_dump(exclude_unset=True).items():
            setattr(db_user, k, v)
        db.commit()
        db.refresh(db_user)
    return db_user


# ─────────────────────── Templates ───────────────────────
def get_templates(db: Session):
    return db.query(models.Template).all()


def create_template(db: Session, tpl: schemas.TemplateCreate):
    db_tpl = models.Template(**tpl.model_dump())
    db.add(db_tpl)
    db.commit()
    db.refresh(db_tpl)
    return db_tpl


# ─────────────────────── Projects ───────────────────────
def get_projects(db: Session, status: str = None, skip=0, limit=100):
    q = db.query(models.Project)
    if status:
        q = q.filter(models.Project.status == status)
    return q.order_by(models.Project.created_at.desc()).offset(skip).limit(limit).all()


def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()


def get_project_summaries(db: Session, status: str = None):
    """Lightweight list with computed task counts."""
    projects = get_projects(db, status=status)
    summaries = []
    now = datetime.now(timezone.utc)
    for p in projects:
        total = db.query(models.Task).filter(models.Task.project_id == p.id).count()
        done = db.query(models.Task).filter(models.Task.project_id == p.id, models.Task.status == "done").count()
        overdue = db.query(models.Task).filter(
            models.Task.project_id == p.id,
            models.Task.due_date < now,
            models.Task.status != "done"
        ).count()
        member_count = db.query(models.ProjectMember).filter(models.ProjectMember.project_id == p.id).count()
        summaries.append({
            "id": p.id, "name": p.name, "description": p.description,
            "status": p.status, "health": p.health, "completion_pct": p.completion_pct,
            "client_name": p.client_name, "due_date": p.due_date, "created_at": p.created_at,
            "task_count": total, "done_count": done, "member_count": member_count, "overdue_tasks": overdue,
        })
    return summaries


def create_project(db: Session, project: schemas.ProjectCreate):
    data = project.model_dump()
    template_id = data.pop("template_id", None)
    db_project = models.Project(**data)
    if template_id:
        db_project.template_id = template_id
    db.add(db_project)
    db.flush()

    # If template selected, scaffold milestones+tasks
    if template_id:
        tpl = db.query(models.Template).filter(models.Template.id == template_id).first()
        if tpl and tpl.config:
            for idx, ms_cfg in enumerate(tpl.config.get("milestones", [])):
                ms = models.Milestone(
                    project_id=db_project.id, title=ms_cfg["title"],
                    order_idx=idx, status="pending"
                )
                db.add(ms)
                db.flush()
                for t_title in ms_cfg.get("tasks", []):
                    uid = _task_uid(db)
                    db.add(models.Task(
                        project_id=db_project.id, milestone_id=ms.id,
                        title=t_title, task_uid=uid
                    ))
                    db.flush()

    _log(db, f"🚀 Project created: {db_project.name}", project_id=db_project.id,
         user_id=project.created_by)
    db.commit()
    db.refresh(db_project)
    _recalc_project(db, db_project.id)
    return db_project


def update_project(db: Session, project_id: int, project: schemas.ProjectUpdate):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if db_project:
        for k, v in project.model_dump(exclude_unset=True).items():
            setattr(db_project, k, v)
        db.commit()
        db.refresh(db_project)
    return db_project


def delete_project(db: Session, project_id: int):
    p = db.query(models.Project).filter(models.Project.id == project_id).first()
    if p:
        db.delete(p)
        db.commit()
    return p


def add_project_member(db: Session, project_id: int, member: schemas.ProjectMemberCreate):
    existing = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == member.user_id
    ).first()
    if existing:
        existing.role = member.role
        db.commit()
        db.refresh(existing)
        return existing
    db_m = models.ProjectMember(project_id=project_id, **member.model_dump())
    db.add(db_m)
    user = get_user(db, member.user_id)
    _log(db, f"👤 {user.name if user else 'Someone'} added to project", project_id=project_id)
    db.commit()
    db.refresh(db_m)
    return db_m


def remove_project_member(db: Session, project_id: int, user_id: int):
    m = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user_id
    ).first()
    if m:
        user = get_user(db, user_id)
        _log(db, f"👤 {user.name if user else 'Member'} removed from project", project_id=project_id)
        db.delete(m)
        db.commit()


def get_dashboard_stats(db: Session):
    now = datetime.now(timezone.utc)
    total = db.query(models.Project).count()
    active = db.query(models.Project).filter(models.Project.status == "active").count()
    completed = db.query(models.Project).filter(models.Project.status == "completed").count()
    on_hold = db.query(models.Project).filter(models.Project.status == "on_hold").count()
    overdue_projects = db.query(models.Project).filter(
        models.Project.due_date < now, models.Project.status == "active"
    ).count()
    total_tasks = db.query(models.Task).count()
    done_tasks = db.query(models.Task).filter(models.Task.status == "done").count()
    blocked_tasks = db.query(models.Task).filter(models.Task.status == "blocked").count()
    overdue_tasks = db.query(models.Task).filter(
        models.Task.due_date < now, models.Task.status != "done"
    ).count()
    recent_activity = db.query(models.ActivityLog).order_by(
        models.ActivityLog.created_at.desc()
    ).limit(10).all()
    recent_projects = db.query(models.Project).order_by(
        models.Project.updated_at.desc()
    ).limit(5).all()
    return {
        "projects": {"total": total, "active": active, "completed": completed, "on_hold": on_hold, "overdue": overdue_projects},
        "tasks": {"total": total_tasks, "done": done_tasks, "blocked": blocked_tasks, "overdue": overdue_tasks},
        "recent_activity": recent_activity,
        "recent_projects": recent_projects,
    }


def _recalc_project(db: Session, project_id: int):
    """Recalculate project completion_pct and health."""
    now = datetime.now(timezone.utc)
    total = db.query(models.Task).filter(models.Task.project_id == project_id).count()
    done = db.query(models.Task).filter(models.Task.project_id == project_id, models.Task.status == "done").count()
    overdue = db.query(models.Task).filter(
        models.Task.project_id == project_id,
        models.Task.due_date < now,
        models.Task.status != "done"
    ).count()
    pct = round((done / total) * 100, 1) if total > 0 else 0.0

    p = db.query(models.Project).filter(models.Project.id == project_id).first()
    if p:
        old_health = p.health
        p.completion_pct = pct
        if overdue == 0:
            p.health = "green"
        elif overdue <= 2:
            p.health = "yellow"
        else:
            p.health = "red"
            
        if p.health != old_health:
             _log(db, f"💓 Project health: {old_health} → {p.health}", project_id=project_id,
                  meta={"type": "health_change", "old": old_health, "new": p.health})
        db.commit()


# ─────────────────────── Milestones ───────────────────────
def get_milestones(db: Session, project_id: int):
    return db.query(models.Milestone).filter(models.Milestone.project_id == project_id).order_by(models.Milestone.order_idx).all()


def create_milestone(db: Session, project_id: int, ms: schemas.MilestoneCreate):
    db_ms = models.Milestone(project_id=project_id, **ms.model_dump())
    db.add(db_ms)
    _log(db, f"📍 Milestone created: {ms.title}", project_id=project_id)
    db.commit()
    db.refresh(db_ms)
    return db_ms


def update_milestone(db: Session, ms_id: int, ms: schemas.MilestoneUpdate):
    db_ms = db.query(models.Milestone).filter(models.Milestone.id == ms_id).first()
    if db_ms:
        for k, v in ms.model_dump(exclude_unset=True).items():
            setattr(db_ms, k, v)
        db.commit()
        db.refresh(db_ms)
    return db_ms


def delete_milestone(db: Session, ms_id: int):
    db_ms = db.query(models.Milestone).filter(models.Milestone.id == ms_id).first()
    if db_ms:
        db.delete(db_ms)
        db.commit()
    return db_ms


# ─────────────────────── Tasks ───────────────────────
def get_tasks(db: Session, project_id: int, milestone_id: int = None, status: str = None, assignee_id: int = None):
    q = db.query(models.Task).filter(models.Task.project_id == project_id, models.Task.parent_task_id == None)
    if milestone_id:
        q = q.filter(models.Task.milestone_id == milestone_id)
    if status:
        q = q.filter(models.Task.status == status)
    if assignee_id:
        q = q.filter(models.Task.assignee_id == assignee_id)
    return q.order_by(models.Task.created_at.asc()).all()


def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()


def search_tasks(db: Session, project_id: int, query: str):
    if query.upper().startswith("TSK-"):
        t = db.query(models.Task).filter(models.Task.task_uid == query.upper()).first()
        return [t] if t else []
    q = text("title ILIKE :q OR description ILIKE :q")
    return db.query(models.Task).filter(
        models.Task.project_id == project_id
    ).filter(q.bindparams(q=f"%{query}%")).limit(50).all()


def create_task(db: Session, project_id: int, task: schemas.TaskCreate, created_by: int = None):
    uid = _task_uid(db)
    data = task.model_dump()
    db_task = models.Task(project_id=project_id, task_uid=uid, **data)
    db.add(db_task)
    db.flush()
    _log(db, f"✦ Task created: {task.title}", project_id=project_id, task_id=db_task.id, user_id=created_by)
    db.commit()
    db.refresh(db_task)
    _recalc_project(db, project_id)
    return db_task


def update_task(db: Session, task_id: int, task: schemas.TaskUpdate, updated_by: int = None):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        return None
    updates = task.model_dump(exclude_unset=True)
    logs = []

    STATUS_LABELS = {"todo": "To Do", "in_progress": "In Progress", "review": "Review", "done": "Done", "blocked": "Blocked"}
    if "status" in updates and updates["status"] != db_task.status:
        msg = f"🔄 Status: {STATUS_LABELS.get(db_task.status, db_task.status)} → {STATUS_LABELS.get(updates['status'], updates['status'])}"
        _log(db, msg, project_id=db_task.project_id, task_id=task_id, user_id=updated_by,
             meta={"type": "status_change", "old": db_task.status, "new": updates["status"]})
    if "assignee_id" in updates and updates["assignee_id"] != db_task.assignee_id:
        user = get_user(db, updates["assignee_id"]) if updates["assignee_id"] else None
        msg = f"👤 Assigned to {user.name if user else 'Nobody'}"
        _log(db, msg, project_id=db_task.project_id, task_id=task_id, user_id=updated_by,
             meta={"type": "assignment", "assignee_id": updates["assignee_id"], "assignee_name": user.name if user else None})
    if "priority" in updates and updates["priority"] != db_task.priority:
        msg = f"⚡ Priority: {db_task.priority} → {updates['priority']}"
        _log(db, msg, project_id=db_task.project_id, task_id=task_id, user_id=updated_by,
             meta={"type": "priority_change", "old": db_task.priority, "new": updates["priority"]})
    if "due_date" in updates and updates["due_date"] != db_task.due_date:
        _log(db, "📅 Due date updated", project_id=db_task.project_id, task_id=task_id, user_id=updated_by,
             meta={"type": "date_change", "new_date": str(updates["due_date"]) if updates["due_date"] else None})

    for k, v in updates.items():
        setattr(db_task, k, v)
    db.commit()
    db.refresh(db_task)
    _recalc_project(db, db_task.project_id)
    return db_task


def delete_task(db: Session, task_id: int):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task:
        project_id = db_task.project_id
        db.delete(db_task)
        db.commit()
        _recalc_project(db, project_id)
    return db_task


def get_overdue_tasks(db: Session, project_id: int = None):
    now = datetime.now(timezone.utc)
    q = db.query(models.Task).filter(models.Task.due_date < now, models.Task.status != "done")
    if project_id:
        q = q.filter(models.Task.project_id == project_id)
    return q.order_by(models.Task.due_date.asc()).all()


def get_tasks_by_user(db: Session, user_id: int):
    return db.query(models.Task).filter(
        models.Task.assignee_id == user_id,
        models.Task.status != "done"
    ).order_by(models.Task.due_date.asc().nullslast()).limit(50).all()


# ─────────────────────── Comments ───────────────────────
def create_comment(db: Session, task_id: int = None, thread_id: int = None, comment: schemas.CommentCreate = None):
    db_comment = models.Comment(
        task_id=task_id, thread_id=thread_id,
        body=comment.body,
        author_id=comment.author_id,
        author_name=comment.author_name
    )
    db.add(db_comment)
    if task_id:
        task = get_task(db, task_id)
        if task:
            _log(db, f"💬 Comment added", project_id=task.project_id, task_id=task_id, user_id=comment.author_id)
    db.commit()
    db.refresh(db_comment)
    return db_comment


def delete_comment(db: Session, comment_id: int):
    c = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if c:
        db.delete(c)
        db.commit()
    return c


# ─────────────────────── Threads ───────────────────────
def get_threads(db: Session, project_id: int):
    return db.query(models.Thread).filter(models.Thread.project_id == project_id).order_by(models.Thread.created_at.desc()).all()


def create_thread(db: Session, project_id: int, thread: schemas.ThreadCreate):
    db_thread = models.Thread(project_id=project_id, **thread.model_dump())
    db.add(db_thread)
    _log(db, f"💬 Discussion started: {thread.title}", project_id=project_id, user_id=thread.created_by)
    db.commit()
    db.refresh(db_thread)
    return db_thread


# ─────────────────────── Documents ───────────────────────
def get_documents(db: Session, project_id: int):
    return db.query(models.Document).filter(models.Document.project_id == project_id).order_by(models.Document.created_at.desc()).all()


def create_document(db: Session, project_id: int, filename: str, file_data: str,
                    mime_type: str, size_bytes: int, uploaded_by: int = None, is_client: bool = False):
    doc = models.Document(
        project_id=project_id, filename=filename, file_data=file_data,
        mime_type=mime_type, size_bytes=size_bytes, uploaded_by=uploaded_by,
        is_client_upload=is_client
    )
    db.add(doc)
    _log(db, f"📎 Document uploaded: {filename}", project_id=project_id, user_id=uploaded_by)
    db.commit()
    db.refresh(doc)
    return doc


def delete_document(db: Session, doc_id: int):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if doc:
        db.delete(doc)
        db.commit()
    return doc


# ─────────────────────── Time Entries ───────────────────────
def log_time(db: Session, task_id: int, entry: schemas.TimeEntryCreate):
    db_entry = models.TimeEntry(task_id=task_id, **entry.model_dump())
    db.add(db_entry)
    db_task = get_task(db, task_id)
    if db_task:
        db_task.logged_hours = (db_task.logged_hours or 0) + entry.hours
        _log(db, f"⏱ {entry.hours}h logged", project_id=db_task.project_id,
             task_id=task_id, user_id=entry.user_id)
    db.commit()
    db.refresh(db_entry)
    return db_entry


# ─────────────────────── Notifications ───────────────────────
def get_notifications(db: Session, user_id: int):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).order_by(models.Notification.created_at.desc()).limit(50).all()


def mark_notifications_read(db: Session, user_id: int):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id, models.Notification.read == False
    ).update({"read": True})
    db.commit()


# ─────────────────────── Activity ───────────────────────
def get_project_activity(db: Session, project_id: int, limit: int = 30):
    return db.query(models.ActivityLog).filter(
        models.ActivityLog.project_id == project_id
    ).order_by(models.ActivityLog.created_at.desc()).limit(limit).all()


# ─────────────────────── AI Engine ───────────────────────
def get_risk_analysis(db: Session, project_id: int):
    """Rule-based risk detection."""
    now = datetime.now(timezone.utc)
    tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
    risks = []

    for t in tasks:
        if t.status == "done":
            continue
        if t.due_date and t.due_date < now:
            risks.append({"task_id": t.id, "task_title": t.title, "level": "high",
                          "reason": "Task is overdue", "due_date": str(t.due_date)})
        elif t.due_date and t.due_date < now + timedelta(hours=48):
            risks.append({"task_id": t.id, "task_title": t.title, "level": "medium",
                          "reason": "Due within 48 hours", "due_date": str(t.due_date)})
        if t.status == "blocked":
            risks.append({"task_id": t.id, "task_title": t.title, "level": "high",
                          "reason": "Task is blocked"})
        if not t.assignee_id:
            risks.append({"task_id": t.id, "task_title": t.title, "level": "low",
                          "reason": "No assignee"})

    return {"project_id": project_id, "risk_count": len(risks), "risks": risks}


def get_workload_summary(db: Session):
    """Per-user task counts for workload balancing."""
    users = db.query(models.User).filter(models.User.active == True).all()
    result = []
    for u in users:
        total = db.query(models.Task).filter(
            models.Task.assignee_id == u.id, models.Task.status != "done"
        ).count()
        overdue = db.query(models.Task).filter(
            models.Task.assignee_id == u.id,
            models.Task.status != "done",
            models.Task.due_date < datetime.now(timezone.utc)
        ).count()
        high_priority = db.query(models.Task).filter(
            models.Task.assignee_id == u.id,
            models.Task.status != "done",
            models.Task.priority.in_(["high", "critical"])
        ).count()
        result.append({
            "user_id": u.id, "name": u.name, "email": u.email,
            "role": u.role, "avatar_url": u.avatar_url,
            "open_tasks": total, "overdue_tasks": overdue, "high_priority_tasks": high_priority,
            "workload": "high" if total >= 10 else "medium" if total >= 5 else "normal"
        })
    return result
def global_search(db: Session, query: str):
    """Search across projects, tasks, and users."""
    results = {"projects": [], "tasks": [], "people": []}
    if not query or len(query) < 2:
        return results

    # Search Projects
    p_query = text("name ILIKE :q OR description ILIKE :q")
    results["projects"] = db.query(models.Project).filter(
        p_query.bindparams(q=f"%{query}%")
    ).limit(5).all()

    # Search Tasks
    if query.upper().startswith("TSK-"):
        results["tasks"] = db.query(models.Task).filter(models.Task.task_uid == query.upper()).limit(5).all()
    else:
        t_query = text("title ILIKE :q")
        results["tasks"] = db.query(models.Task).filter(
            t_query.bindparams(q=f"%{query}%")
        ).limit(5).all()

    # Search Users
    u_query = text("name ILIKE :q OR email ILIKE :q")
    results["people"] = db.query(models.User).filter(
        models.User.active == True
    ).filter(u_query.bindparams(q=f"%{query}%")).limit(5).all()

    return results


# ─────────────────────── Approvals ───────────────────────
def create_approval(db: Session, approval: schemas.ApprovalCreate):
    db_approval = models.Approval(**approval.model_dump())
    db.add(db_approval)
    db.flush()
    task = get_task(db, approval.task_id)
    if task:
        _log(db, f"🛡 Approval requested", project_id=task.project_id, task_id=task.id, user_id=approval.requested_by)
        if approval.approver_id:
            db.add(models.Notification(
                user_id=approval.approver_id,
                type="approval",
                title="Approval Requested",
                body=f"Your sign-off is needed for: {task.title}",
                link=f"/projects/{task.project_id}"
            ))
    db.commit()
    db.refresh(db_approval)
    return db_approval


def update_approval(db: Session, approval_id: int, status: str, note: str = None, approver_id: int = None):
    db_approval = db.query(models.Approval).filter(models.Approval.id == approval_id).first()
    if db_approval:
        db_approval.status = status
        db_approval.note = note
        db_approval.approver_id = approver_id
        db.flush()
        task = get_task(db, db_approval.task_id)
        if task:
            _log(db, f"🛡 Approval {status}", project_id=task.project_id, task_id=task.id, user_id=approver_id)
            if db_approval.requested_by:
                db.add(models.Notification(
                    user_id=db_approval.requested_by,
                    type="approval",
                    title=f"Approval {status.capitalize()}",
                    body=f"Target: {task.title}",
                    link=f"/projects/{task.project_id}"
                ))
        db.commit()
        db.refresh(db_approval)
    return db_approval
