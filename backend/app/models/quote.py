"""
Quote Model for Machining Services
"""

from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Quote(Base, TimestampMixin):
    """Quote model for service estimates."""

    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    quote_number = Column(String(20), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("customer_vehicles.id"), nullable=True)
    service_request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=True)

    # Quote Details
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)

    # Pricing
    subtotal = Column(Numeric(10, 2), default=0, nullable=False)
    labor_total = Column(Numeric(10, 2), default=0, nullable=False)
    parts_total = Column(Numeric(10, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)
    discount_percent = Column(Numeric(5, 2), nullable=True)
    tax_rate = Column(Numeric(5, 4), nullable=True)
    tax_amount = Column(Numeric(10, 2), default=0, nullable=False)
    total = Column(Numeric(10, 2), default=0, nullable=False)

    # Status
    status = Column(String(30), default="draft", nullable=False, index=True)
    # draft, sent, viewed, approved, declined, expired, converted

    # Validity
    valid_until = Column(Date, nullable=True)
    estimated_start_date = Column(Date, nullable=True)
    estimated_completion_date = Column(Date, nullable=True)
    estimated_hours = Column(Numeric(6, 2), nullable=True)

    # Customer Response
    approved_at = Column(DateTime, nullable=True)
    approved_by_name = Column(String(100), nullable=True)
    decline_reason = Column(Text, nullable=True)

    # Conversion
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)

    # Communication
    sent_at = Column(DateTime, nullable=True)
    viewed_at = Column(DateTime, nullable=True)
    sent_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    terms_and_conditions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="quotes")
    vehicle = relationship("CustomerVehicle", back_populates="quotes")
    service_request = relationship("ServiceRequest", foreign_keys=[service_request_id])
    job = relationship("Job", foreign_keys=[job_id])
    items = relationship("QuoteItem", back_populates="quote", cascade="all, delete-orphan", order_by="QuoteItem.display_order")
    sender = relationship("User", foreign_keys=[sent_by])
    creator = relationship("User", foreign_keys=[created_by])

    @property
    def is_expired(self) -> bool:
        """Check if quote has expired."""
        if self.valid_until is None:
            return False
        return datetime.utcnow().date() > self.valid_until

    @property
    def can_be_approved(self) -> bool:
        """Check if quote can be approved."""
        return self.status == "sent" and not self.is_expired

    def calculate_totals(self):
        """Calculate quote totals from items."""
        self.labor_total = sum(
            float(item.total_price) for item in self.items if item.item_type == "labor"
        )
        self.parts_total = sum(
            float(item.total_price) for item in self.items if item.item_type == "part"
        )
        self.subtotal = self.labor_total + self.parts_total

        # Apply discount
        if self.discount_percent:
            self.discount_amount = float(self.subtotal) * (float(self.discount_percent) / 100)
        subtotal_after_discount = float(self.subtotal) - float(self.discount_amount or 0)

        # Calculate tax
        if self.tax_rate:
            self.tax_amount = subtotal_after_discount * float(self.tax_rate)
        else:
            self.tax_amount = 0

        self.total = subtotal_after_discount + float(self.tax_amount)

    def __repr__(self):
        return f"<Quote(id={self.id}, number={self.quote_number}, status={self.status})>"


class QuoteItem(Base):
    """Quote line item model."""

    __tablename__ = "quote_items"

    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False)
    item_type = Column(String(20), nullable=False)  # labor, part, fee, other

    # Item Details
    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(10, 2), default=1, nullable=False)
    unit = Column(String(20), default="each", nullable=False)  # each, hour, set

    # Pricing
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    cost_price = Column(Numeric(10, 2), nullable=True)  # For parts

    # Taxable
    is_taxable = Column(Boolean, default=True, nullable=False)

    # Optional References
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id"), nullable=True)
    labor_rate_id = Column(Integer, ForeignKey("labor_rates.id"), nullable=True)

    display_order = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    quote = relationship("Quote", back_populates="items")
    product = relationship("Product")
    inventory_item = relationship("Inventory")
    labor_rate = relationship("LaborRate")

    def calculate_total(self):
        """Calculate total price."""
        self.total_price = float(self.unit_price) * float(self.quantity)

    def __repr__(self):
        return f"<QuoteItem(id={self.id}, quote_id={self.quote_id}, type={self.item_type})>"
