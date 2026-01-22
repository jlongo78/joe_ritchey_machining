"""
Brand Schemas
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class BrandBase(BaseModel):
    """Base brand schema."""
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=100)
    logo_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    website: Optional[str] = Field(None, max_length=255)
    is_active: bool = True


class BrandCreate(BrandBase):
    """Schema for creating a brand."""
    pass


class BrandUpdate(BaseModel):
    """Schema for updating a brand."""
    name: Optional[str] = Field(None, max_length=100)
    slug: Optional[str] = Field(None, max_length=100)
    logo_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    website: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class BrandResponse(BrandBase):
    """Schema for brand response."""
    id: int
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
