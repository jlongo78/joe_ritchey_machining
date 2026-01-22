"""
Cart Schemas
"""

from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class CartItemCreate(BaseModel):
    """Schema for adding an item to cart."""
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1)
    notes: Optional[str] = None


class CartItemUpdate(BaseModel):
    """Schema for updating a cart item."""
    quantity: int = Field(..., ge=1)
    notes: Optional[str] = None


class CartItemResponse(BaseModel):
    """Schema for cart item response."""
    id: int
    product_id: int
    variant_id: Optional[int] = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    notes: Optional[str] = None
    product_name: str = ""
    product_sku: str = ""
    product_image: Optional[str] = None
    in_stock: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    """Schema for cart response."""
    id: int
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    status: str
    items: List[CartItemResponse] = []
    item_count: int
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total: Decimal
    coupon_code: Optional[str] = None
    notes: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CartAddItem(BaseModel):
    """Schema for adding item to cart."""
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1)


class CartUpdateItem(BaseModel):
    """Schema for updating cart item quantity."""
    quantity: int = Field(..., ge=0)  # 0 to remove


class CartApplyCoupon(BaseModel):
    """Schema for applying a coupon to cart."""
    coupon_code: str = Field(..., max_length=50)


# Aliases for endpoint compatibility
CartItemAdd = CartAddItem
# CartItemUpdate already exists above
