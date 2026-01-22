"""
Invoice Models for Billing
"""

from datetime import datetime, date, timedelta
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Invoice(Base, TimestampMixin):
    """Invoice model for billing customers."""

    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(20), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)

    # Invoice Details
    invoice_type = Column(String(30), default="service", nullable=False)  # service, product, deposit, progress
    reference_number = Column(String(100), nullable=True)

    # Dates
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)

    # Amounts
    subtotal = Column(Numeric(10, 2), default=0, nullable=False)
    labor_total = Column(Numeric(10, 2), default=0, nullable=False)
    parts_total = Column(Numeric(10, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)
    discount_percent = Column(Numeric(5, 2), nullable=True)
    tax_rate = Column(Numeric(5, 4), nullable=True)
    tax_amount = Column(Numeric(10, 2), default=0, nullable=False)
    total = Column(Numeric(10, 2), default=0, nullable=False)
    amount_paid = Column(Numeric(10, 2), default=0, nullable=False)
    balance_due = Column(Numeric(10, 2), default=0, nullable=False)

    # Status
    status = Column(String(20), default="draft", nullable=False, index=True)
    # draft, sent, viewed, partial, paid, overdue, void, cancelled

    # Communication
    sent_at = Column(DateTime, nullable=True)
    viewed_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    last_reminder_sent_at = Column(DateTime, nullable=True)
    reminder_count = Column(Integer, default=0, nullable=False)

    terms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    job = relationship("Job", foreign_keys=[job_id])
    order = relationship("Order")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan", order_by="InvoiceItem.display_order")
    payments = relationship("Payment", back_populates="invoice")
    refunds = relationship("Refund", back_populates="invoice")
    creator = relationship("User", foreign_keys=[created_by])

    @property
    def is_overdue(self) -> bool:
        """Check if invoice is overdue."""
        if self.status in ["paid", "void", "cancelled"]:
            return False
        return date.today() > self.due_date

    @property
    def days_overdue(self) -> int:
        """Calculate days overdue."""
        if not self.is_overdue:
            return 0
        return (date.today() - self.due_date).days

    @property
    def is_fully_paid(self) -> bool:
        """Check if invoice is fully paid."""
        return float(self.balance_due) <= 0

    def calculate_totals(self):
        """Calculate invoice totals from items."""
        self.labor_total = sum(
            float(item.total_price) for item in self.items if item.item_type == "labor"
        )
        self.parts_total = sum(
            float(item.total_price) for item in self.items if item.item_type == "part"
        )
        self.subtotal = sum(float(item.total_price) for item in self.items)

        # Apply discount
        if self.discount_percent:
            self.discount_amount = float(self.subtotal) * (float(self.discount_percent) / 100)
        subtotal_after_discount = float(self.subtotal) - float(self.discount_amount or 0)

        # Calculate tax (only on taxable items)
        if self.tax_rate:
            taxable_total = sum(
                float(item.total_price) for item in self.items if item.is_taxable
            )
            taxable_after_discount = taxable_total - (taxable_total / float(self.subtotal) * float(self.discount_amount or 0)) if float(self.subtotal) > 0 else 0
            self.tax_amount = taxable_after_discount * float(self.tax_rate)
        else:
            self.tax_amount = 0

        self.total = subtotal_after_discount + float(self.tax_amount)
        self.balance_due = float(self.total) - float(self.amount_paid)

        # Update status
        if float(self.balance_due) <= 0:
            self.status = "paid"
        elif float(self.amount_paid) > 0:
            self.status = "partial"
        elif self.is_overdue:
            self.status = "overdue"

    def __repr__(self):
        return f"<Invoice(id={self.id}, number={self.invoice_number}, status={self.status})>"


class InvoiceItem(Base):
    """Invoice line item model."""

    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    item_type = Column(String(20), nullable=False)  # labor, part, fee, discount, deposit, other

    # Item Details
    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(10, 2), default=1, nullable=False)
    unit = Column(String(20), default="each", nullable=False)  # each, hour, set

    # Pricing
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    cost_price = Column(Numeric(10, 2), nullable=True)

    # Tax
    is_taxable = Column(Boolean, default=True, nullable=False)

    # References
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    job_part_id = Column(Integer, ForeignKey("job_parts.id"), nullable=True)
    job_labor_id = Column(Integer, ForeignKey("job_labor.id"), nullable=True)

    display_order = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product")
    job_part = relationship("JobPart")
    job_labor = relationship("JobLabor")

    def calculate_total(self):
        """Calculate total price."""
        self.total_price = float(self.unit_price) * float(self.quantity)

    def __repr__(self):
        return f"<InvoiceItem(id={self.id}, invoice_id={self.invoice_id}, type={self.item_type})>"
