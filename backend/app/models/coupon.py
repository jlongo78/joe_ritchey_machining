"""
Coupon and Promotion Models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Coupon(Base, TimestampMixin):
    """Coupon model for discounts and promotions."""

    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    discount_type = Column(String(20), nullable=False)  # percentage, fixed_amount, free_shipping
    discount_value = Column(Numeric(10, 2), nullable=False)
    minimum_order_amount = Column(Numeric(10, 2), nullable=True)
    maximum_discount_amount = Column(Numeric(10, 2), nullable=True)

    # Validity
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    usage_limit = Column(Integer, nullable=True)  # Total uses allowed
    usage_limit_per_user = Column(Integer, default=1, nullable=False)
    times_used = Column(Integer, default=0, nullable=False)

    # Restrictions
    applies_to = Column(String(50), default="all", nullable=False)  # all, categories, products, brands
    allowed_items_ids = Column(Text, nullable=True)  # Comma-separated IDs
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    usages = relationship("CouponUsage", back_populates="coupon", cascade="all, delete-orphan")

    @property
    def is_valid(self) -> bool:
        """Check if coupon is currently valid."""
        now = datetime.utcnow()
        if not self.is_active:
            return False
        if self.start_date and now < self.start_date:
            return False
        if self.end_date and now > self.end_date:
            return False
        if self.usage_limit and self.times_used >= self.usage_limit:
            return False
        return True

    def can_be_used_by(self, user_id: int) -> bool:
        """Check if coupon can be used by a specific user."""
        if not self.is_valid:
            return False
        user_usages = sum(1 for u in self.usages if u.user_id == user_id)
        return user_usages < self.usage_limit_per_user

    def calculate_discount(self, order_subtotal: float) -> float:
        """Calculate discount amount for an order."""
        if not self.is_valid:
            return 0.0

        if self.minimum_order_amount and order_subtotal < float(self.minimum_order_amount):
            return 0.0

        if self.discount_type == "percentage":
            discount = order_subtotal * (float(self.discount_value) / 100)
        elif self.discount_type == "fixed_amount":
            discount = float(self.discount_value)
        elif self.discount_type == "free_shipping":
            return 0.0  # This will be applied separately
        else:
            discount = 0.0

        # Apply maximum discount cap if set
        if self.maximum_discount_amount:
            discount = min(discount, float(self.maximum_discount_amount))

        return round(discount, 2)

    def __repr__(self):
        return f"<Coupon(id={self.id}, code={self.code}, type={self.discount_type})>"


class CouponUsage(Base):
    """Coupon usage history."""

    __tablename__ = "coupon_usages"

    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    discount_amount = Column(Numeric(10, 2), nullable=False)
    used_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    coupon = relationship("Coupon", back_populates="usages")
    user = relationship("User")
    order = relationship("Order")

    def __repr__(self):
        return f"<CouponUsage(id={self.id}, coupon_id={self.coupon_id}, user_id={self.user_id})>"
