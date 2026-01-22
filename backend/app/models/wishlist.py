"""
Wishlist Model
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.db.base import Base


class Wishlist(Base):
    """Wishlist model."""

    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), default="Default", nullable=False)
    is_default = Column(Boolean, default=True, nullable=False)
    is_public = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User")
    items = relationship("WishlistItem", back_populates="wishlist", cascade="all, delete-orphan")

    @property
    def item_count(self) -> int:
        """Get number of items in wishlist."""
        return len(self.items)

    def __repr__(self):
        return f"<Wishlist(id={self.id}, user_id={self.user_id}, name={self.name})>"


from sqlalchemy import Boolean


class WishlistItem(Base):
    """Wishlist item model."""

    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    wishlist_id = Column(Integer, ForeignKey("wishlists.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    priority = Column(Integer, default=0, nullable=False)  # For sorting
    notes = Column(String(500), nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    wishlist = relationship("Wishlist", back_populates="items")
    product = relationship("Product")
    variant = relationship("ProductVariant")

    def __repr__(self):
        return f"<WishlistItem(id={self.id}, product_id={self.product_id})>"
