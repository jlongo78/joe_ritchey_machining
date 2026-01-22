"""
Quote Schemas
"""

from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field


class QuoteItemCreate(BaseModel):
    """Schema for creating a quote item."""
    item_type: str = Field(..., pattern="^(labor|part|fee|other)$")
    description: str = Field(..., max_length=500)
    quantity: Decimal = Field(default=Decimal("1"), gt=0)
    unit: str = Field(default="each", max_length=20)
    unit_price: Decimal = Field(..., ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    is_taxable: bool = True
    product_id: Optional[int] = None
    inventory_id: Optional[int] = None
    labor_rate_id: Optional[int] = None
    display_order: int = 0
    notes: Optional[str] = None


class QuoteItemUpdate(BaseModel):
    """Schema for updating a quote item."""
    item_type: Optional[str] = None
    description: Optional[str] = Field(None, max_length=500)
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    unit_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    is_taxable: Optional[bool] = None
    display_order: Optional[int] = None
    notes: Optional[str] = None


class QuoteItemResponse(BaseModel):
    """Schema for quote item response."""
    id: int
    quote_id: int
    item_type: str
    description: str
    quantity: Decimal
    unit: str
    unit_price: Decimal
    total_price: Decimal
    cost_price: Optional[Decimal] = None
    is_taxable: bool
    display_order: int
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class QuoteBase(BaseModel):
    """Base quote schema."""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    valid_until: Optional[date] = None
    estimated_start_date: Optional[date] = None
    estimated_completion_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = Field(None, ge=0)
    discount_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=1)
    terms_and_conditions: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None


class QuoteCreate(QuoteBase):
    """Schema for creating a quote."""
    customer_id: int
    vehicle_id: Optional[int] = None
    service_request_id: Optional[int] = None
    items: Optional[List[QuoteItemCreate]] = []


class QuoteUpdate(QuoteBase):
    """Schema for updating a quote."""
    pass


class QuoteResponse(BaseModel):
    """Schema for quote response."""
    id: int
    quote_number: str
    customer_id: int
    vehicle_id: Optional[int] = None
    service_request_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    subtotal: Decimal
    labor_total: Decimal
    parts_total: Decimal
    discount_amount: Decimal
    discount_percent: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    tax_amount: Decimal
    total: Decimal
    status: str
    valid_until: Optional[date] = None
    estimated_start_date: Optional[date] = None
    estimated_completion_date: Optional[date] = None
    estimated_hours: Optional[Decimal] = None
    approved_at: Optional[datetime] = None
    approved_by_name: Optional[str] = None
    job_id: Optional[int] = None
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuoteListResponse(QuoteResponse):
    """Quote response with items."""
    items: List[QuoteItemResponse] = []
    customer_name: str = ""
    vehicle_name: Optional[str] = None

    class Config:
        from_attributes = True


class QuoteApproval(BaseModel):
    """Schema for approving a quote."""
    approved_by_name: str = Field(..., max_length=100)
    notes: Optional[str] = None


class QuoteSend(BaseModel):
    """Schema for sending a quote."""
    recipient_email: Optional[str] = None
    message: Optional[str] = None
    include_pdf: bool = True


# Alias for detailed single quote response
QuoteDetailResponse = QuoteListResponse
