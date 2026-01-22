"""
Communication Models for Email/SMS/Notifications
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class CommunicationTemplate(Base, TimestampMixin):
    """Template for email and SMS communications."""

    __tablename__ = "communication_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    channel = Column(String(20), nullable=False)  # email, sms
    category = Column(String(50), nullable=True)  # quote, invoice, job, appointment, marketing

    # Content
    subject = Column(String(200), nullable=True)  # For email
    body = Column(Text, nullable=False)
    html_body = Column(Text, nullable=True)  # For rich email

    # Variables (for reference)
    available_variables = Column(JSON, nullable=True)  # ["customer_name", "job_number", etc.]

    is_active = Column(Boolean, default=True, nullable=False)
    is_system = Column(Boolean, default=False, nullable=False)  # System templates can't be deleted

    def __repr__(self):
        return f"<CommunicationTemplate(id={self.id}, name={self.name}, channel={self.channel})>"


class Communication(Base, TimestampMixin):
    """Communication log for emails and SMS sent."""

    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, index=True)
    channel = Column(String(20), nullable=False)  # email, sms
    direction = Column(String(10), default="outbound", nullable=False)  # outbound, inbound

    # Recipient
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    recipient_email = Column(String(255), nullable=True)
    recipient_phone = Column(String(20), nullable=True)
    recipient_name = Column(String(100), nullable=True)

    # Content
    template_id = Column(Integer, ForeignKey("communication_templates.id"), nullable=True)
    subject = Column(String(200), nullable=True)
    body = Column(Text, nullable=False)
    html_body = Column(Text, nullable=True)

    # Related Entities
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)

    # Status
    status = Column(String(20), default="pending", nullable=False)  # pending, sent, delivered, failed, bounced, opened
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    opened_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    # External IDs
    external_id = Column(String(255), nullable=True)  # SendGrid/Twilio message ID

    sent_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    customer = relationship("Customer")
    template = relationship("CommunicationTemplate")
    job = relationship("Job")
    quote = relationship("Quote")
    invoice = relationship("Invoice")
    order = relationship("Order")
    sender = relationship("User", foreign_keys=[sent_by])
    attachments = relationship("CommunicationAttachment", back_populates="communication", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Communication(id={self.id}, channel={self.channel}, status={self.status})>"


class CommunicationAttachment(Base):
    """Attachment for email communications."""

    __tablename__ = "communication_attachments"

    id = Column(Integer, primary_key=True, index=True)
    communication_id = Column(Integer, ForeignKey("communications.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)

    # Relationships
    communication = relationship("Communication", back_populates="attachments")

    def __repr__(self):
        return f"<CommunicationAttachment(id={self.id}, filename={self.filename})>"
