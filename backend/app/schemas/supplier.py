"""
Supplier Schemas
"""

from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, EmailStr


class SupplierBase(BaseModel):
    """Base supplier schema."""
    name: str = Field(..., max_length=200)
    code: str = Field(..., max_length=50)
    contact_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    fax: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    payment_terms: Optional[str] = Field(None, max_length=100)
    account_number: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=50)
    lead_time_days: int = Field(default=7, ge=0)
    minimum_order_amount: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    """Schema for creating a supplier."""
    pass


class SupplierUpdate(BaseModel):
    """Schema for updating a supplier."""
    name: Optional[str] = Field(None, max_length=200)
    contact_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    fax: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    payment_terms: Optional[str] = Field(None, max_length=100)
    account_number: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=50)
    lead_time_days: Optional[int] = None
    minimum_order_amount: Optional[Decimal] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierResponse(SupplierBase):
    """Schema for supplier response."""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SupplierAPIConfigCreate(BaseModel):
    """Schema for creating supplier API configuration."""
    api_type: str = Field(..., pattern="^(rest|soap|ftp|scraper)$")
    base_url: Optional[str] = Field(None, max_length=500)
    auth_type: Optional[str] = Field(None, pattern="^(api_key|oauth2|basic)$")
    api_key: Optional[str] = None  # Will be encrypted
    api_secret: Optional[str] = None  # Will be encrypted
    additional_config: Optional[dict] = None
    rate_limit_per_minute: int = Field(default=60, ge=1)


class SupplierAPIConfigResponse(BaseModel):
    """Schema for supplier API config response."""
    id: int
    supplier_id: int
    api_type: str
    base_url: Optional[str] = None
    auth_type: Optional[str] = None
    rate_limit_per_minute: int
    last_sync_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductSupplierCreate(BaseModel):
    """Schema for linking a product to a supplier."""
    supplier_id: int
    supplier_sku: Optional[str] = Field(None, max_length=100)
    supplier_url: Optional[str] = Field(None, max_length=500)
    cost_price: Decimal = Field(..., ge=0)
    minimum_order_quantity: int = Field(default=1, ge=1)
    is_preferred: bool = False
    lead_time_days: Optional[int] = Field(None, ge=0)


class ProductSupplierResponse(BaseModel):
    """Schema for product supplier response."""
    id: int
    product_id: int
    supplier_id: int
    supplier_sku: Optional[str] = None
    supplier_url: Optional[str] = None
    cost_price: Decimal
    last_cost_price: Optional[Decimal] = None
    minimum_order_quantity: int
    is_preferred: bool
    lead_time_days: Optional[int] = None
    last_checked_at: Optional[datetime] = None
    last_price_change_at: Optional[datetime] = None
    price_changed: bool
    price_change_percent: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
