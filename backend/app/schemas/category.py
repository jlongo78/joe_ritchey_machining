"""
Category Schemas
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    """Base category schema."""
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)
    description: Optional[str] = None
    parent_id: Optional[int] = None
    image_url: Optional[str] = Field(None, max_length=500)
    display_order: int = 0
    is_active: bool = True
    meta_title: Optional[str] = Field(None, max_length=200)
    meta_description: Optional[str] = None


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""
    name: Optional[str] = Field(None, max_length=100)
    slug: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    parent_id: Optional[int] = None
    image_url: Optional[str] = Field(None, max_length=500)
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    meta_title: Optional[str] = Field(None, max_length=200)
    meta_description: Optional[str] = None


class CategoryResponse(CategoryBase):
    """Schema for category response."""
    id: int
    full_path: str
    depth: int
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategoryTreeResponse(CategoryResponse):
    """Category response with subcategories."""
    subcategories: List['CategoryTreeResponse'] = []

    class Config:
        from_attributes = True


# Allow recursive model
CategoryTreeResponse.model_rebuild()
