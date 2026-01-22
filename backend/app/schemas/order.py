"""
Order Schemas
"""

from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field


class OrderItemResponse(BaseModel):
    """Schema for order item response."""
    id: int
    product_id: int
    variant_id: Optional[int] = None
    sku: str
    name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    status: str

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """Schema for creating an order."""
    shipping_address: dict
    billing_address: dict
    shipping_method: Optional[str] = None
    customer_notes: Optional[str] = None
    coupon_code: Optional[str] = None


class OrderUpdate(BaseModel):
    """Schema for updating an order."""
    status: Optional[str] = None
    shipping_method: Optional[str] = None
    shipping_carrier: Optional[str] = None
    tracking_number: Optional[str] = Field(None, max_length=255)
    estimated_delivery_date: Optional[date] = None
    internal_notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    """Schema for updating order status."""
    status: str = Field(..., pattern="^(pending|confirmed|processing|shipped|delivered|cancelled|refunded)$")
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    """Schema for order response."""
    id: int
    order_number: str
    user_id: Optional[int] = None
    status: str
    payment_status: str
    subtotal: Decimal
    shipping_amount: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total: Decimal
    shipping_method: Optional[str] = None
    shipping_carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery_date: Optional[date] = None
    shipping_address: dict
    billing_address: dict
    customer_notes: Optional[str] = None
    coupon_code: Optional[str] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderListResponse(OrderResponse):
    """Order response with items."""
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# Alias for detailed single order response
OrderDetailResponse = OrderListResponse
