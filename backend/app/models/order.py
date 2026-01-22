"""
Order Models for E-commerce
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Order(Base, TimestampMixin):
    """E-commerce order model."""

    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, confirmed, processing, shipped, delivered, cancelled, refunded
    payment_status = Column(String(50), default="pending", nullable=False)  # pending, authorized, paid, failed, refunded

    # Pricing
    subtotal = Column(Numeric(10, 2), nullable=False)
    shipping_amount = Column(Numeric(10, 2), default=0, nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)
    total = Column(Numeric(10, 2), nullable=False)

    # Shipping Details
    shipping_method = Column(String(100), nullable=True)
    shipping_carrier = Column(String(100), nullable=True)
    tracking_number = Column(String(255), nullable=True)
    estimated_delivery_date = Column(Date, nullable=True)
    actual_delivery_date = Column(Date, nullable=True)

    # Addresses (JSON stored at time of order)
    shipping_address = Column(JSON, nullable=False)
    billing_address = Column(JSON, nullable=False)

    # Additional Info
    customer_notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    coupon_code = Column(String(50), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)

    # Timestamps
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="order")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")

    @property
    def is_paid(self) -> bool:
        """Check if order is fully paid."""
        return self.payment_status == "paid"

    @property
    def can_cancel(self) -> bool:
        """Check if order can be cancelled."""
        return self.status in ["pending", "confirmed"]

    @property
    def can_refund(self) -> bool:
        """Check if order can be refunded."""
        return self.payment_status == "paid" and self.status not in ["refunded", "cancelled"]

    def __repr__(self):
        return f"<Order(id={self.id}, number={self.order_number}, status={self.status})>"


class OrderItem(Base):
    """Order item model."""

    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)

    # Snapshot of product info at time of order
    sku = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=True)  # Cost at time of order for profit tracking
    tax_amount = Column(Numeric(10, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)
    status = Column(String(50), default="pending", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")

    @property
    def profit(self) -> float:
        """Calculate profit for this item."""
        if self.unit_cost is None:
            return 0.0
        return (float(self.unit_price) - float(self.unit_cost)) * self.quantity

    def __repr__(self):
        return f"<OrderItem(id={self.id}, sku={self.sku}, qty={self.quantity})>"


class OrderStatusHistory(Base):
    """Order status change history."""

    __tablename__ = "order_status_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="status_history")
    user = relationship("User")

    def __repr__(self):
        return f"<OrderStatusHistory(id={self.id}, order_id={self.order_id}, status={self.status})>"
