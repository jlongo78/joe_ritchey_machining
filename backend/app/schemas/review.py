"""
Review Schemas
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ReviewBase(BaseModel):
    """Base review schema."""
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = None


class ReviewCreate(ReviewBase):
    """Schema for creating a review."""
    product_id: int
    reviewer_name: Optional[str] = Field(None, max_length=100)
    reviewer_email: Optional[str] = Field(None, max_length=255)


class ReviewUpdate(BaseModel):
    """Schema for updating a review."""
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = None
    is_approved: Optional[bool] = None
    is_featured: Optional[bool] = None


class ReviewResponse(ReviewBase):
    """Schema for review response."""
    id: int
    product_id: int
    user_id: Optional[int] = None
    reviewer_name: Optional[str] = None
    is_verified_purchase: bool
    is_approved: bool
    is_featured: bool
    admin_response: Optional[str] = None
    admin_response_at: Optional[datetime] = None
    helpful_votes: int
    unhelpful_votes: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReviewAdminResponse(BaseModel):
    """Schema for admin response to a review."""
    admin_response: str
