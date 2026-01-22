"""
Product Review Model
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Review(Base):
    """Product review model."""

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)

    rating = Column(Integer, nullable=False)  # 1-5
    title = Column(String(200), nullable=True)
    content = Column(Text, nullable=True)
    reviewer_name = Column(String(100), nullable=True)  # For display
    reviewer_email = Column(String(255), nullable=True)

    # Status
    is_verified_purchase = Column(Boolean, default=False, nullable=False)
    is_approved = Column(Boolean, default=False, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)

    # Admin response
    admin_response = Column(Text, nullable=True)
    admin_response_at = Column(DateTime, nullable=True)

    helpful_votes = Column(Integer, default=0, nullable=False)
    unhelpful_votes = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="reviews")
    user = relationship("User")
    order = relationship("Order")

    @property
    def helpfulness_score(self) -> float:
        """Calculate helpfulness score."""
        total = self.helpful_votes + self.unhelpful_votes
        if total == 0:
            return 0.0
        return self.helpful_votes / total

    def __repr__(self):
        return f"<Review(id={self.id}, product_id={self.product_id}, rating={self.rating})>"
