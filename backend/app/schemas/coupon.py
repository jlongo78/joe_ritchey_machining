"""
Coupon Schemas
"""

from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class CouponBase(BaseModel):
    """Base coupon schema."""
    code: str = Field(..., max_length=50)
    description: Optional[str] = None
    discount_type: str = Field(..., pattern="^(percentage|fixed_amount|free_shipping)$")
    discount_value: Decimal = Field(..., ge=0)
    minimum_order_amount: Optional[Decimal] = Field(None, ge=0)
    maximum_discount_amount: Optional[Decimal] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    usage_limit: Optional[int] = Field(None, ge=1)
    usage_limit_per_user: int = Field(default=1, ge=1)
    applies_to: str = Field(default="all", pattern="^(all|categories|products|brands)$")
    allowed_items_ids: Optional[str] = None


class CouponCreate(CouponBase):
    """Schema for creating a coupon."""
    pass


class CouponUpdate(BaseModel):
    """Schema for updating a coupon."""
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    minimum_order_amount: Optional[Decimal] = None
    maximum_discount_amount: Optional[Decimal] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    usage_limit: Optional[int] = None
    usage_limit_per_user: Optional[int] = None
    applies_to: Optional[str] = None
    allowed_items_ids: Optional[str] = None
    is_active: Optional[bool] = None


class CouponResponse(CouponBase):
    """Schema for coupon response."""
    id: int
    times_used: int
    is_active: bool
    is_valid: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CouponValidation(BaseModel):
    """Schema for validating a coupon."""
    coupon_code: str
    order_subtotal: Decimal


class CouponValidationResponse(BaseModel):
    """Schema for coupon validation response."""
    is_valid: bool
    discount_amount: Decimal = Decimal("0.00")
    message: Optional[str] = None
    coupon: Optional[CouponResponse] = None
