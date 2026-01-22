"""
Audit and System Notification Models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base


class AuditLog(Base):
    """Audit log for tracking changes to important records."""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # What was changed
    table_name = Column(String(100), nullable=False, index=True)
    record_id = Column(Integer, nullable=False)
    action = Column(String(20), nullable=False)  # create, update, delete

    # Change details
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    changes = Column(JSON, nullable=True)  # Summary of what changed

    # Context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, table={self.table_name}, action={self.action})>"


class SystemNotification(Base):
    """System notifications for users (not customer communications)."""

    __tablename__ = "system_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # Null for broadcast

    notification_type = Column(String(50), nullable=False)
    # low_stock, overdue_invoice, job_status_change, appointment_reminder, etc.

    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(20), default="normal", nullable=False)  # low, normal, high, urgent

    # Related Entity
    related_type = Column(String(50), nullable=True)  # job, invoice, order, etc.
    related_id = Column(Integer, nullable=True)
    action_url = Column(String(500), nullable=True)

    # Status
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    is_dismissed = Column(Boolean, default=False, nullable=False)
    dismissed_at = Column(DateTime, nullable=True)

    # Delivery
    email_sent = Column(Boolean, default=False, nullable=False)
    email_sent_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User")

    @property
    def is_expired(self) -> bool:
        """Check if notification has expired."""
        if self.expires_at is None:
            return False
        return datetime.utcnow() > self.expires_at

    def mark_read(self):
        """Mark notification as read."""
        self.is_read = True
        self.read_at = datetime.utcnow()

    def dismiss(self):
        """Dismiss notification."""
        self.is_dismissed = True
        self.dismissed_at = datetime.utcnow()

    def __repr__(self):
        return f"<SystemNotification(id={self.id}, type={self.notification_type})>"
