from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime


# ─────────────────────── Users ───────────────────────
class UserBase(BaseModel):
    name: str
    email: str
    role: str = "member"
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None
    active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None


# ─────────────────────── Templates ───────────────────────
class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    config: Optional[Any] = None


class TemplateCreate(TemplateBase):
    pass


class TemplateResponse(TemplateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────── Comments ───────────────────────
class CommentCreate(BaseModel):
    body: str
    author_name: Optional[str] = "Team Member"
    author_id: Optional[int] = None
    thread_id: Optional[int] = None


class CommentResponse(BaseModel):
    id: int
    task_id: Optional[int] = None
    thread_id: Optional[int] = None
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    body: str
    created_at: datetime
    author: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ─────────────────────── Time Entries ───────────────────────
class TimeEntryCreate(BaseModel):
    hours: float
    note: Optional[str] = None
    user_id: Optional[int] = None


class TimeEntryResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    hours: float
    date: datetime
    note: Optional[str] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ─────────────────────── Activity Logs ───────────────────────
class ActivityLogResponse(BaseModel):
    id: int
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    user_id: Optional[int] = None
    action: str
    meta: Optional[Any] = None
    created_at: datetime
    actor: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ─────────────────────── Tasks ───────────────────────
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    milestone_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    assignee_id: Optional[int] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    tags: Optional[str] = None
    deps: Optional[List[int]] = None
    approval_required: bool = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    milestone_id: Optional[int] = None
    assignee_id: Optional[int] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    logged_hours: Optional[float] = None
    tags: Optional[str] = None
    deps: Optional[List[int]] = None
    approval_required: Optional[bool] = None


class TaskResponse(TaskBase):
    id: int
    task_uid: Optional[str] = None
    project_id: int
    logged_hours: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    assignee: Optional[UserResponse] = None
    comments: List[CommentResponse] = []
    time_entries: List[TimeEntryResponse] = []
    subtasks: List["TaskResponse"] = []
    approvals: List["ApprovalResponse"] = []

    class Config:
        from_attributes = True

# ─────────────────────── Milestones ───────────────────────
class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str = "pending"
    order_idx: int = 0


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    order_idx: Optional[int] = None


class MilestoneResponse(MilestoneBase):
    id: int
    project_id: int
    created_at: datetime
    tasks: List[TaskResponse] = []

    class Config:
        from_attributes = True


# ─────────────────────── Project Members ───────────────────────
class ProjectMemberCreate(BaseModel):
    user_id: int
    role: str = "member"


class ProjectMemberResponse(BaseModel):
    id: int
    project_id: int
    user_id: int
    role: str
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ─────────────────────── Documents ───────────────────────
class DocumentResponse(BaseModel):
    id: int
    project_id: int
    uploaded_by: Optional[int] = None
    filename: str
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None
    is_client_upload: bool
    created_at: datetime
    uploader: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ─────────────────────── Threads ───────────────────────
class ThreadCreate(BaseModel):
    title: str
    body: Optional[str] = None
    created_by: Optional[int] = None


class ThreadResponse(BaseModel):
    id: int
    project_id: int
    title: str
    body: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    comments: List[CommentResponse] = []
    creator: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ─────────────────────── Approvals ───────────────────────
class ApprovalCreate(BaseModel):
    task_id: int
    requested_by: Optional[int] = None
    approver_id: Optional[int] = None
    note: Optional[str] = None


class ApprovalResponse(BaseModel):
    id: int
    task_id: int
    requested_by: Optional[int] = None
    approver_id: Optional[int] = None
    status: str
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    requestor: Optional[UserResponse] = None
    approver: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ─────────────────────── Notifications ───────────────────────
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    body: Optional[str] = None
    link: Optional[str] = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────── Projects ───────────────────────
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "active"
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    template_id: Optional[int] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None


class ProjectCreate(ProjectBase):
    created_by: Optional[int] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    health: Optional[str] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    completion_pct: Optional[float] = None


class ProjectResponse(ProjectBase):
    id: int
    health: str
    completion_pct: float
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    milestones: List[MilestoneResponse] = []
    members: List[ProjectMemberResponse] = []
    creator: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class ProjectSummary(BaseModel):
    """Lightweight project card for list views."""
    id: int
    name: str
    description: Optional[str] = None
    status: str
    health: str
    completion_pct: float
    client_name: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime
    task_count: int = 0
    done_count: int = 0
    member_count: int = 0
    overdue_tasks: int = 0

    class Config:
        from_attributes = True
class GlobalSearchResponse(BaseModel):
    projects: List[ProjectSummary]
    tasks: List[TaskResponse]
    people: List[UserResponse]


# ─────────────────────── AI / Analytics ───────────────────────
class RiskItem(BaseModel):
    task_id: Optional[int] = None
    task_title: Optional[str] = None
    level: str
    category: str
    reason: str

class RiskAnalysis(BaseModel):
    project_id: int
    risk_count: int
    critical_risks: int
    risks: List[RiskItem]

class ProjectHealth(BaseModel):
    score: float
    label: str
    metrics: Any

class TaskSuggestion(BaseModel):
    title: str
    reason: str

class WorkloadRisk(BaseModel):
    user_id: int
    name: str
    open_tasks: int
    high_priority: int
    overdue: int
    risk_level: str
    load_score: float

TaskResponse.model_rebuild()
