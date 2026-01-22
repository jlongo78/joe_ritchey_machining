"""
Payment Schemas
"""

from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class PaymentCreate(BaseModel):
    """Schema for creating a payment."""
    order_id: Optional[int] = None
    invoice_id: Optional[int] = None
    customer_id: Optional[int] = None
    payment_method: str = Field(..., pattern="^(credit_card|debit_card|cash|check|ach|wire|paypal|stripe)$")
    amount: Decimal = Field(..., gt=0)
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class PaymentProcessRequest(BaseModel):
    """Schema for processing a card payment (Stripe)."""
    order_id: Optional[int] = None
    invoice_id: Optional[int] = None
    payment_method_id: str  # Stripe payment method ID
    amount: Decimal = Field(..., gt=0)
    save_card: bool = False


class PaymentResponse(BaseModel):
    """Schema for payment response."""
    id: int
    order_id: Optional[int] = None
    invoice_id: Optional[int] = None
    customer_id: Optional[int] = None
    payment_method: str
    transaction_id: Optional[str] = None
    amount: Decimal
    currency: str
    status: str
    reference_number: Optional[str] = None
    card_last_four: Optional[str] = None
    card_type: Optional[str] = None
    payment_date: datetime
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RefundCreate(BaseModel):
    """Schema for creating a refund."""
    order_id: Optional[int] = None
    invoice_id: Optional[int] = None
    payment_id: Optional[int] = None
    amount: Decimal = Field(..., gt=0)
    reason: Optional[str] = None


class RefundResponse(BaseModel):
    """Schema for refund response."""
    id: int
    order_id: Optional[int] = None
    invoice_id: Optional[int] = None
    payment_id: Optional[int] = None
    amount: Decimal
    reason: Optional[str] = None
    status: str
    processed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
