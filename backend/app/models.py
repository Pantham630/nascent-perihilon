from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, DateTime,
    Boolean, Float, Index, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


# ─────────────────────── Users ───────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(String(50), default="member")  # admin | pm | member | client
    avatar_url = Column(String(500), nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project_memberships = relationship("ProjectMember", back_populates="user")
    assigned_tasks = relationship("Task", foreign_keys="Task.assignee_id", back_populates="assignee")
    time_entries = relationship("TimeEntry", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    comments = relationship("Comment", back_populates="author")
    activity_logs = relationship("ActivityLog", back_populates="actor")


# ─────────────────────── Project Templates ───────────────────────
class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    config = Column(JSON, nullable=True)  # {milestones: [{title, tasks:[...]}]}
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="template")


# ─────────────────────── Projects ───────────────────────
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="active", index=True)  # active|on_hold|completed|cancelled
    health = Column(String(20), default="green")               # green|yellow|red
    client_name = Column(String(255), nullable=True)
    client_email = Column(String(255), nullable=True)
    template_id = Column(Integer, ForeignKey("templates.id", ondelete="SET NULL"), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    completion_pct = Column(Float, default=0.0)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    template = relationship("Template", back_populates="projects")
    creator = relationship("User", foreign_keys=[created_by])
    milestones = relationship("Milestone", back_populates="project", cascade="all, delete-orphan", order_by="Milestone.order_idx")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="project", cascade="all, delete-orphan", order_by="ActivityLog.created_at.desc()")
    threads = relationship("Thread", back_populates="project", cascade="all, delete-orphan")


# ─────────────────────── Project Members ───────────────────────
class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    role = Column(String(50), default="member")  # pm | member | client

    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_memberships")


# ─────────────────────── Milestones ───────────────────────
class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="pending")  # pending | in_progress | completed
    order_idx = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="milestones")
    tasks = relationship("Task", back_populates="milestone")


# ─────────────────────── Tasks ───────────────────────
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_uid = Column(String(20), unique=True, nullable=True, index=True)  # TSK-0001
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    milestone_id = Column(Integer, ForeignKey("milestones.id", ondelete="SET NULL"), nullable=True)
    parent_task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="todo", index=True)   # todo|in_progress|review|done|blocked
    priority = Column(String(50), default="medium", index=True)  # low|medium|high|critical
    assignee_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    estimated_hours = Column(Float, nullable=True)
    logged_hours = Column(Float, default=0.0)
    tags = Column(Text, nullable=True)   # JSON list
    deps = Column(JSON, nullable=True)   # list of task_ids this task depends on
    approval_required = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="tasks")
    milestone = relationship("Milestone", back_populates="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tasks")
    subtasks = relationship("Task", foreign_keys=[parent_task_id], back_populates="parent_task")
    parent_task = relationship("Task", foreign_keys=[parent_task_id], back_populates="subtasks", remote_side="Task.id")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan", order_by="Comment.created_at.asc()")
    time_entries = relationship("TimeEntry", back_populates="task", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="task", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="task", cascade="all, delete-orphan")


# ─────────────────────── Comments ───────────────────────
class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    thread_id = Column(Integer, ForeignKey("threads.id", ondelete="CASCADE"), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author_name = Column(String(255), nullable=True)  # fallback if no user
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    task = relationship("Task", back_populates="comments")
    thread = relationship("Thread", back_populates="comments")
    author = relationship("User", back_populates="comments")


# ─────────────────────── Approvals ───────────────────────
class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"))
    requested_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approver_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="pending")  # pending | approved | rejected
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    task = relationship("Task", back_populates="approvals")
    requestor = relationship("User", foreign_keys=[requested_by])
    approver = relationship("User", foreign_keys=[approver_id])


# ─────────────────────── Discussion Threads ───────────────────────
class Thread(Base):
    __tablename__ = "threads"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="threads")
    comments = relationship("Comment", back_populates="thread", cascade="all, delete-orphan", order_by="Comment.created_at.asc()")
    creator = relationship("User", foreign_keys=[created_by])


# ─────────────────────── Documents ───────────────────────
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    uploaded_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(500), nullable=False)
    file_data = Column(Text, nullable=True)  # base64 or relative path
    mime_type = Column(String(100), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    is_client_upload = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploaded_by])


# ─────────────────────── Time Entries ───────────────────────
class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    hours = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    note = Column(String(255), nullable=True)

    task = relationship("Task", back_populates="time_entries")
    user = relationship("User", back_populates="time_entries")


# ─────────────────────── Activity Log ───────────────────────
class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(500), nullable=False)
    meta = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="activity_logs")
    task = relationship("Task", back_populates="activity_logs")
    actor = relationship("User", back_populates="activity_logs")


# ─────────────────────── Notifications ───────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(String(50), nullable=False)  # task_assigned|comment|mention|approval
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    link = Column(String(500), nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")


# ─────────────────── Indexes ───────────────────────
Index("idx_task_project", Task.project_id)
Index("idx_task_milestone", Task.milestone_id)
Index("idx_task_assignee", Task.assignee_id)
Index("idx_task_status", Task.status)
Index("idx_project_status", Project.status)
Index("idx_activity_project", ActivityLog.project_id)
Index("idx_notification_user", Notification.user_id)
