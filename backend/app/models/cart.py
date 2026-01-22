"""
Shopping Cart Models for E-commerce
"""

from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Cart(Base, TimestampMixin):
    """Shopping cart model."""

    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id = Column(String(255), nullable=True, index=True)  # For guest carts
    status = Column(String(20), default="active", nullable=False)  # active, abandoned, converted
    subtotal = Column(Numeric(10, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0, nullable=False)
    total = Column(Numeric(10, 2), default=0, nullable=False)
    coupon_code = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

    @property
    def item_count(self) -> int:
        """Get total number of items in cart."""
        return sum(item.quantity for item in self.items)

    @property
    def is_expired(self) -> bool:
        """Check if cart has expired."""
        return self.expires_at is not None and datetime.utcnow() > self.expires_at

    @property
    def is_empty(self) -> bool:
        """Check if cart is empty."""
        return len(self.items) == 0

    def calculate_totals(self):
        """Recalculate cart totals."""
        self.subtotal = sum(float(item.total_price) for item in self.items)
        # Total will be calculated after applying discounts and tax
        self.total = float(self.subtotal) - float(self.discount_amount or 0) + float(self.tax_amount or 0)

    def set_expiry(self, days: int = 7):
        """Set cart expiration date."""
        self.expires_at = datetime.utcnow() + timedelta(days=days)

    def __repr__(self):
        return f"<Cart(id={self.id}, user_id={self.user_id}, items={self.item_count})>"


class CartItem(Base, TimestampMixin):
    """Shopping cart item model."""

    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")

    def calculate_total(self):
        """Calculate total price for this item."""
        self.total_price = float(self.unit_price) * self.quantity

    def __repr__(self):
        return f"<CartItem(id={self.id}, product_id={self.product_id}, qty={self.quantity})>"
