"""
Common Pydantic schemas used across the application.
"""

from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime


# Generic type for paginated responses
T = TypeVar('T')


class PaginationParams(BaseModel):
    """Pagination parameters for list endpoints."""
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(default=None, description="Field to sort by")
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$", description="Sort order")

    @property
    def skip(self) -> int:
        """Calculate offset for database query."""
        return (self.page - 1) * self.per_page

    @property
    def limit(self) -> int:
        """Get limit for database query."""
        return self.per_page


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""
    items: List[T]
    total: int
    page: int
    per_page: int
    pages: int

    @classmethod
    def create(cls, items: List[T], total: int, page: int, per_page: int):
        """Create a paginated response."""
        pages = (total + per_page - 1) // per_page if per_page > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            pages=pages
        )


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str
    success: bool = True


class IDResponse(BaseModel):
    """Response containing just an ID."""
    id: int


class SuccessResponse(BaseModel):
    """Generic success response."""
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Error response schema."""
    success: bool = False
    error: str
    error_code: Optional[str] = None
    details: Optional[Any] = None


class TimestampMixin(BaseModel):
    """Mixin for timestamp fields."""
    created_at: datetime
    updated_at: datetime


class SoftDeleteMixin(BaseModel):
    """Mixin for soft delete fields."""
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None


class AddressSchema(BaseModel):
    """Common address schema."""
    address_line1: str = Field(..., max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    postal_code: str = Field(..., max_length=20)
    country: str = Field(default="USA", max_length=100)


class DateRangeFilter(BaseModel):
    """Date range filter for queries."""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SearchFilter(BaseModel):
    """Search filter for queries."""
    q: Optional[str] = Field(None, min_length=1, max_length=200, description="Search query")
    filters: Optional[dict] = Field(None, description="Additional filters")
