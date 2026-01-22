"""
Payment and Refund Models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Payment(Base, TimestampMixin):
    """Payment model for orders and invoices."""

    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)

    payment_method = Column(String(50), nullable=False)  # credit_card, debit_card, cash, check, ach, wire, paypal, stripe
    transaction_id = Column(String(255), nullable=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    status = Column(String(50), nullable=False)  # pending, completed, failed, refunded
    gateway_response = Column(JSON, nullable=True)

    # Reference for manual payments
    reference_number = Column(String(100), nullable=True)  # Check number, etc.

    # Card Details (if applicable)
    card_last_four = Column(String(4), nullable=True)
    card_type = Column(String(20), nullable=True)

    payment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    received_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    order = relationship("Order", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")
    customer = relationship("Customer")
    receiver = relationship("User", foreign_keys=[received_by])
    refunds = relationship("Refund", back_populates="payment")

    @property
    def is_successful(self) -> bool:
        """Check if payment was successful."""
        return self.status == "completed"

    def __repr__(self):
        return f"<Payment(id={self.id}, amount={self.amount}, status={self.status})>"


class Refund(Base):
    """Refund model."""

    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)

    amount = Column(Numeric(10, 2), nullable=False)
    reason = Column(Text, nullable=True)
    refund_method = Column(String(30), nullable=True)
    reference_number = Column(String(100), nullable=True)
    status = Column(String(50), default="pending", nullable=False)  # pending, approved, processed, rejected

    processed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="refunds")
    invoice = relationship("Invoice", back_populates="refunds")
    payment = relationship("Payment", back_populates="refunds")
    processor = relationship("User", foreign_keys=[processed_by])

    @property
    def is_processed(self) -> bool:
        """Check if refund has been processed."""
        return self.status == "processed"

    def __repr__(self):
        return f"<Refund(id={self.id}, amount={self.amount}, status={self.status})>"
