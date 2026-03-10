import smtplib
import os
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Ticket

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", "")


def send_deadline_email(ticket: Ticket):
    """Send an email notification for a near-deadline ticket."""
    if not SMTP_HOST or not ticket.assignee_email:
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"⚠️ Deadline Approaching: [{ticket.priority.upper()}] {ticket.title}"
        msg["From"] = SMTP_FROM
        msg["To"] = ticket.assignee_email

        deadline_str = ticket.deadline.strftime("%Y-%m-%d %H:%M UTC") if ticket.deadline else "N/A"

        html = f"""
        <html><body style="font-family: Inter, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
            <h2 style="color: #ef4444; margin-bottom: 8px;">⚠️ Ticket Deadline Approaching</h2>
            <p style="color: #94a3b8; margin-bottom: 24px;">The following ticket is due within 24 hours.</p>

            <div style="background: #0f172a; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">{ticket.title}</div>
                <div style="color: #94a3b8; margin-bottom: 12px;">{ticket.description or 'No description'}</div>
                <div style="display: flex; gap: 12px;">
                    <span style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 700;">
                        {ticket.priority.upper()}
                    </span>
                    <span style="background: rgba(59,130,246,0.15); color: #3b82f6; padding: 4px 10px; border-radius: 4px; font-size: 12px;">
                        {ticket.status.replace('_', ' ').upper()}
                    </span>
                </div>
            </div>

            <div style="color: #f59e0b; font-weight: 600;">📅 Deadline: {deadline_str}</div>

            <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
                This notification was sent automatically by your Ticketing+ local server.
            </p>
        </div>
        </body></html>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            if SMTP_USER and SMTP_PASS:
                server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, ticket.assignee_email, msg.as_string())

        logger.info(f"Sent deadline notification to {ticket.assignee_email} for ticket #{ticket.id}")
    except Exception as e:
        logger.error(f"Failed to send email for ticket #{ticket.id}: {e}")


def check_deadlines():
    """Job function: find soon-due tickets and notify assignees."""
    if not SMTP_HOST:
        logger.debug("SMTP not configured, skipping deadline check.")
        return

    now = datetime.now(timezone.utc)
    window = now + timedelta(hours=24)

    db: Session = SessionLocal()
    try:
        near_deadline_tickets = db.query(Ticket).filter(
            Ticket.deadline != None,
            Ticket.deadline <= window,
            Ticket.deadline >= now,
            Ticket.status != "done",
            Ticket.assignee_email != None,
        ).all()

        for ticket in near_deadline_tickets:
            send_deadline_email(ticket)
    finally:
        db.close()


def start_scheduler():
    """Start the APScheduler background job."""
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(check_deadlines, "interval", hours=1, id="deadline_notifier")
    scheduler.start()
    logger.info("Deadline notification scheduler started (runs every hour).")
    return scheduler
