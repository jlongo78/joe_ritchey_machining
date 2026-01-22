"""
Invoice Schemas
"""

from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field


class InvoiceItemCreate(BaseModel):
    """Schema for creating an invoice item."""
    item_type: str = Field(..., pattern="^(labor|part|fee|discount|deposit|other)$")
    description: str = Field(..., max_length=500)
    quantity: Decimal = Field(default=Decimal("1"), gt=0)
    unit: str = Field(default="each", max_length=20)
    unit_price: Decimal = Field(..., ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    is_taxable: bool = True
    product_id: Optional[int] = None
    job_part_id: Optional[int] = None
    job_labor_id: Optional[int] = None
    display_order: int = 0
    notes: Optional[str] = None


class InvoiceItemResponse(BaseModel):
    """Schema for invoice item response."""
    id: int
    invoice_id: int
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


class InvoiceBase(BaseModel):
    """Base invoice schema."""
    invoice_type: str = Field(default="service", pattern="^(service|product|deposit|progress)$")
    reference_number: Optional[str] = Field(None, max_length=100)
    invoice_date: date
    due_date: date
    discount_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    tax_rate: Optional[Decimal] = Field(None, ge=0, le=1)
    terms: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    """Schema for creating an invoice."""
    customer_id: int
    job_id: Optional[int] = None
    order_id: Optional[int] = None
    items: Optional[List[InvoiceItemCreate]] = []


class InvoiceUpdate(BaseModel):
    """Schema for updating an invoice."""
    invoice_type: Optional[str] = None
    reference_number: Optional[str] = None
    due_date: Optional[date] = None
    discount_percent: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    status: Optional[str] = None


class InvoiceResponse(BaseModel):
    """Schema for invoice response."""
    id: int
    invoice_number: str
    customer_id: int
    job_id: Optional[int] = None
    order_id: Optional[int] = None
    invoice_type: str
    reference_number: Optional[str] = None
    invoice_date: date
    due_date: date
    subtotal: Decimal
    labor_total: Decimal
    parts_total: Decimal
    discount_amount: Decimal
    discount_percent: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    tax_amount: Decimal
    total: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    status: str
    sent_at: Optional[datetime] = None
    viewed_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    is_overdue: bool
    days_overdue: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvoiceListResponse(InvoiceResponse):
    """Invoice response with items."""
    items: List[InvoiceItemResponse] = []
    customer_name: str = ""

    class Config:
        from_attributes = True


class InvoiceSend(BaseModel):
    """Schema for sending an invoice."""
    recipient_email: Optional[str] = None
    message: Optional[str] = None
    include_pdf: bool = True


# Alias for detailed single invoice response
InvoiceDetailResponse = InvoiceListResponse


class PaymentRecord(BaseModel):
    """Schema for recording a payment against an invoice."""
    amount: Decimal = Field(..., gt=0)
    payment_method: str = Field(..., pattern="^(cash|check|credit_card|debit_card|bank_transfer|other)$")
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
