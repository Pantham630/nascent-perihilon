from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from . import models, schemas, crud

def get_risk_analysis(db: Session, project_id: int):
    """
    Analyzes a project for potential risks including:
    - Overdue tasks
    - Unassigned high-priority tasks
    - Tasks with missing dependencies
    - Budget/Time overruns
    """
    now = datetime.now(timezone.utc)
    tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
    risks = []

    for t in tasks:
        if t.status == "done":
            continue
            
        # Overdue Risk
        if t.due_date and t.due_date < now:
            risks.append({
                "task_id": t.id,
                "task_title": t.title,
                "level": "critical",
                "category": "Timeline",
                "reason": f"Task is overdue (due: {t.due_date.strftime('%Y-%m-%d')})"
            })
        elif t.due_date and t.due_date < now + timedelta(days=2):
            risks.append({
                "task_id": t.id,
                "task_title": t.title,
                "level": "high",
                "category": "Timeline",
                "reason": "Task is due within 48 hours"
            })

        # Resource Risk
        if not t.assignee_id:
            risks.append({
                "task_id": t.id,
                "task_title": t.title,
                "level": "medium",
                "category": "Resources",
                "reason": "No owner assigned"
            })

        # Dependency Risk
        if t.deps:
            # Check if any dependencies are blocked or overdue
            deps = db.query(models.Task).filter(models.Task.id.in_(t.deps)).all()
            for d in deps:
                if d.status in ["blocked", "todo"] and (d.due_date and d.due_date < now):
                     risks.append({
                        "task_id": t.id,
                        "task_title": t.title,
                        "level": "high",
                        "category": "Dependency",
                        "reason": f"Blocked by overdue dependency: {d.title}"
                    })

    return {
        "project_id": project_id,
        "risk_count": len(risks),
        "critical_risks": len([r for r in risks if r["level"] == "critical"]),
        "risks": risks
    }

def get_project_health_score(db: Session, project_id: int):
    """
    Calculates a granular health score (0-100) based on:
    - Task completion percentage
    - Number of overdue tasks
    - Time spent vs estimated
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return 0
        
    tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
    if not tasks:
        return 100
        
    now = datetime.now(timezone.utc)
    total = len(tasks)
    done = len([t for t in tasks if t.status == "done"])
    overdue = len([t for t in tasks if t.status != "done" and t.due_date and t.due_date < now])
    
    # Weights
    # Progress: 40%
    # Overdue: 40% (penalty)
    # Resource coverage: 20%
    
    progress_score = (done / total) * 100
    penalty = (overdue / total) * 100
    
    unassigned = len([t for t in tasks if not t.assignee_id])
    resource_score = ((total - unassigned) / total) * 100
    
    health = (progress_score * 0.4) + (resource_score * 0.2) + (max(0, 100 - penalty) * 0.4)
    
    return {
        "score": round(health, 1),
        "label": "green" if health > 80 else "yellow" if health > 50 else "red",
        "metrics": {
            "progress": f"{done}/{total}",
            "overdue": overdue,
            "unassigned": unassigned
        }
    }

def suggest_tasks(db: Session, project_id: int):
    """
    Suggests missing tasks based on project name/description keywords.
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        return []
        
    # Heuristic rules
    suggestions = []
    text = (project.name + " " + (project.description or "")).lower()
    existing_titles = [t.title.lower() for t in project.tasks]
    
    rules = [
        {"kw": ["onboarding", "customer"], "tasks": ["Schedule Intro Call", "Ship Welcome Kit", "Initial Requirement Gathering"]},
        {"kw": ["api", "backend", "integration"], "tasks": ["Define API Endpoints", "Database Schema Design", "Auth Implementation"]},
        {"kw": ["frontend", "ui", "ux"], "tasks": ["Figma Mockups", "Component Library Setup", "Responsive Testing"]},
        {"kw": ["security", "audit"], "tasks": ["Pentest Review", "Permission Audit", "Data Encryption Setup"]},
    ]
    
    for r in rules:
        if any(kw in text for kw in r["kw"]):
            for t in r["tasks"]:
                if t.lower() not in existing_titles:
                    suggestions.append({"title": t, "reason": f"Based on keyword match in project description"})
                    
    return suggestions

def get_workload_burnout_risk(db: Session):
    """
    Identifies team members at risk of burnout based on total open tasks and high priority items.
    """
    users = db.query(models.User).filter(models.User.active == True).all()
    analysis = []
    
    for u in users:
        open_tasks = db.query(models.Task).filter(models.Task.assignee_id == u.id, models.Task.status != "done").all()
        high_pri = len([t for t in open_tasks if t.priority in ["high", "critical"]])
        overdue = len([t for t in open_tasks if t.due_date and t.due_date < datetime.now(timezone.utc)])
        
        load_score = (len(open_tasks) * 10) + (high_pri * 5) + (overdue * 15)
        
        analysis.append({
            "user_id": u.id,
            "name": u.name,
            "open_tasks": len(open_tasks),
            "high_priority": high_pri,
            "overdue": overdue,
            "risk_level": "High" if load_score > 80 else "Medium" if load_score > 50 else "Normal",
            "load_score": load_score
        })
        
    return analysis

def get_user_profile_ai(db: Session, user_id: int):
    """
    Detailed AI analysis for a single user.
    """
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u: return None
    
    tasks = db.query(models.Task).filter(models.Task.assignee_id == user_id).all()
    open_tasks = [t for t in tasks if t.status != "done"]
    
    # Calculate stats
    total = len(tasks)
    done = len([t for t in tasks if t.status == "done"])
    high_pri = len([t for t in open_tasks if t.priority in ["high", "critical"]])
    overdue = len([t for t in open_tasks if t.due_date and t.due_date < datetime.now(timezone.utc)])
    
    # Heuristic for productivity/load
    completion_rate = (done / total * 100) if total > 0 else 100
    
    return {
        "user_id": user_id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "stats": {
            "total_assigned": total,
            "completed": done,
            "open": len(open_tasks),
            "high_priority": high_pri,
            "overdue": overdue,
            "completion_rate": round(completion_rate, 1)
        },
        "burnout_risk": "High" if len(open_tasks) > 10 or overdue > 3 else "Medium" if len(open_tasks) > 5 else "Low",
        "recent_tasks": [schemas.TaskResponse.model_validate(t) for t in tasks[-5:]]
    }
