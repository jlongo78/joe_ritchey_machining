"""
Category Model for Product Catalog
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Category(Base, TimestampMixin):
    """Product category model with hierarchical structure."""

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(String(500), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(Text, nullable=True)

    # Relationships
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    products = relationship("ProductCategory", back_populates="category")

    @property
    def full_path(self) -> str:
        """Get full category path including parents."""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return " > ".join(path)

    @property
    def depth(self) -> int:
        """Get category depth in hierarchy (0 = root)."""
        depth = 0
        parent = self.parent
        while parent:
            depth += 1
            parent = parent.parent
        return depth

    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name}, slug={self.slug})>"
