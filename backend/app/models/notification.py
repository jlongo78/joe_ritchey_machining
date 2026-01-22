"""
Notification Subscription Model
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base


class NotificationSubscription(Base):
    """User notification subscription preferences."""

    __tablename__ = "notification_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    email = Column(String(255), nullable=True)  # For non-user subscriptions
    phone = Column(String(20), nullable=True)  # For SMS subscriptions

    # Subscription types
    product_back_in_stock = Column(Boolean, default=False, nullable=False)
    product_price_drop = Column(Boolean, default=False, nullable=False)
    order_updates = Column(Boolean, default=True, nullable=False)
    marketing_emails = Column(Boolean, default=True, nullable=False)
    job_updates = Column(Boolean, default=True, nullable=False)  # For machining customers
    invoice_reminders = Column(Boolean, default=True, nullable=False)

    # Specific product/item subscriptions
    watched_items = Column(JSON, nullable=True)  # [{"product_id": 1, "type": "back_in_stock"}]

    # Preferences
    email_frequency = Column(String(20), default="immediate", nullable=False)  # immediate, daily, weekly
    sms_enabled = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<NotificationSubscription(id={self.id}, user_id={self.user_id})>"
