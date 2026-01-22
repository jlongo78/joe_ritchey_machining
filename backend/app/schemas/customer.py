"""
Customer and CRM Schemas
"""

from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field


class CustomerContactBase(BaseModel):
    """Base customer contact schema."""
    first_name: str = Field(..., max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    title: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    mobile_phone: Optional[str] = Field(None, max_length=20)
    is_primary: bool = False
    notes: Optional[str] = None


class CustomerContactCreate(CustomerContactBase):
    """Schema for creating a customer contact."""
    pass


class CustomerContactResponse(CustomerContactBase):
    """Schema for customer contact response."""
    id: int
    customer_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerVehicleBase(BaseModel):
    """Base customer vehicle schema."""
    year: Optional[int] = Field(None, ge=1900, le=2100)
    make: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    submodel: Optional[str] = Field(None, max_length=100)
    engine: Optional[str] = Field(None, max_length=100)
    vin: Optional[str] = Field(None, max_length=17)
    license_plate: Optional[str] = Field(None, max_length=20)
    color: Optional[str] = Field(None, max_length=50)
    mileage: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None


class CustomerVehicleCreate(CustomerVehicleBase):
    """Schema for creating a customer vehicle."""
    pass


class CustomerVehicleResponse(CustomerVehicleBase):
    """Schema for customer vehicle response."""
    id: int
    customer_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerNoteCreate(BaseModel):
    """Schema for creating a customer note."""
    note_type: str = Field(default="general")
    subject: Optional[str] = Field(None, max_length=200)
    content: str


class CustomerNoteResponse(BaseModel):
    """Schema for customer note response."""
    id: int
    customer_id: int
    user_id: int
    note_type: str
    subject: Optional[str] = None
    content: str
    is_pinned: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerBase(BaseModel):
    """Base customer schema."""
    customer_type: str = Field(default="individual", pattern="^(individual|business|shop)$")
    company_name: Optional[str] = Field(None, max_length=200)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    mobile_phone: Optional[str] = Field(None, max_length=20)
    fax: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)

    # Address
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field("USA", max_length=100)

    # Business Info
    tax_id: Optional[str] = Field(None, max_length=50)
    payment_terms: str = Field(default="due_on_receipt")
    credit_limit: Optional[Decimal] = Field(None, ge=0)

    # Preferences
    preferred_contact_method: str = Field(default="email")
    marketing_opt_in: bool = True


class CustomerCreate(CustomerBase):
    """Schema for creating a customer."""
    referral_source: Optional[str] = Field(None, max_length=100)
    referred_by_customer_id: Optional[int] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class CustomerUpdate(BaseModel):
    """Schema for updating a customer."""
    customer_type: Optional[str] = Field(None, pattern="^(individual|business|shop)$")
    company_name: Optional[str] = Field(None, max_length=200)
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    mobile_phone: Optional[str] = Field(None, max_length=20)
    fax: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    tax_id: Optional[str] = Field(None, max_length=50)
    payment_terms: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    preferred_contact_method: Optional[str] = None
    marketing_opt_in: Optional[bool] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class CustomerResponse(CustomerBase):
    """Schema for customer response."""
    id: int
    customer_number: str
    user_id: Optional[int] = None
    is_active: bool
    total_revenue: Decimal
    total_jobs: int
    last_service_date: Optional[date] = None
    referral_source: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerListResponse(CustomerResponse):
    """Customer response with related data."""
    vehicles: List[CustomerVehicleResponse] = []
    contacts: List[CustomerContactResponse] = []

    class Config:
        from_attributes = True


# Alias for detailed single customer response
CustomerDetailResponse = CustomerListResponse
