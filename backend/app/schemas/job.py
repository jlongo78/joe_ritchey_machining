"""
Job Schemas
"""

from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field


class JobTaskCreate(BaseModel):
    """Schema for creating a job task."""
    description: str = Field(..., max_length=500)
    estimated_hours: Optional[Decimal] = Field(None, ge=0)
    assigned_to: Optional[int] = None
    display_order: int = 0
    notes: Optional[str] = None


class JobTaskUpdate(BaseModel):
    """Schema for updating a job task."""
    description: Optional[str] = Field(None, max_length=500)
    estimated_hours: Optional[Decimal] = None
    actual_hours: Optional[Decimal] = None
    status: Optional[str] = Field(None, pattern="^(pending|in_progress|completed|skipped)$")
    assigned_to: Optional[int] = None
    display_order: Optional[int] = None
    notes: Optional[str] = None


class JobTaskResponse(BaseModel):
    """Schema for job task response."""
    id: int
    job_id: int
    description: str
    estimated_hours: Optional[Decimal] = None
    actual_hours: Optional[Decimal] = None
    status: str
    assigned_to: Optional[int] = None
    completed_at: Optional[datetime] = None
    display_order: int
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobPartCreate(BaseModel):
    """Schema for adding a part to a job."""
    product_id: Optional[int] = None
    inventory_id: Optional[int] = None
    part_number: Optional[str] = Field(None, max_length=100)
    description: str = Field(..., max_length=500)
    quantity: Decimal = Field(default=Decimal("1"), gt=0)
    unit: str = Field(default="each", max_length=20)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    markup_percent: Optional[Decimal] = Field(None, ge=0)
    is_billable: bool = True
    is_customer_supplied: bool = False
    notes: Optional[str] = None


class JobPartUpdate(BaseModel):
    """Schema for updating a job part."""
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    status: Optional[str] = Field(None, pattern="^(pending|ordered|received|installed|returned)$")
    is_billable: Optional[bool] = None
    notes: Optional[str] = None


class JobPartResponse(BaseModel):
    """Schema for job part response."""
    id: int
    job_id: int
    product_id: Optional[int] = None
    inventory_id: Optional[int] = None
    part_number: Optional[str] = None
    description: str
    quantity: Decimal
    unit: str
    cost_price: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    total_price: Optional[Decimal] = None
    markup_percent: Optional[Decimal] = None
    status: str
    is_billable: bool
    is_customer_supplied: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobLaborCreate(BaseModel):
    """Schema for adding labor to a job."""
    employee_id: Optional[int] = None
    labor_rate_id: Optional[int] = None
    description: Optional[str] = Field(None, max_length=500)
    hours: Decimal = Field(..., gt=0)
    hourly_rate: Decimal = Field(..., ge=0)
    work_date: date
    is_billable: bool = True
    notes: Optional[str] = None


class JobLaborResponse(BaseModel):
    """Schema for job labor response."""
    id: int
    job_id: int
    employee_id: Optional[int] = None
    description: Optional[str] = None
    hours: Decimal
    hourly_rate: Decimal
    total_amount: Decimal
    work_date: date
    is_billable: bool
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class JobNoteCreate(BaseModel):
    """Schema for creating a job note."""
    note_type: str = Field(default="general", pattern="^(general|status_update|customer_communication|internal)$")
    content: str
    is_customer_visible: bool = False


class JobNoteResponse(BaseModel):
    """Schema for job note response."""
    id: int
    job_id: int
    user_id: int
    note_type: str
    content: str
    is_customer_visible: bool
    created_at: datetime

    class Config:
        from_attributes = True


class JobBase(BaseModel):
    """Base job schema."""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    job_type: str = Field(default="machining", pattern="^(machining|dyno|assembly|custom)$")
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    due_date: Optional[date] = None
    priority: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")
    estimated_hours: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = None
    internal_notes: Optional[str] = None


class JobCreate(JobBase):
    """Schema for creating a job."""
    customer_id: int
    vehicle_id: Optional[int] = None
    quote_id: Optional[int] = None
    assigned_technician_id: Optional[int] = None
    shop_bay_id: Optional[int] = None
    tasks: Optional[List[JobTaskCreate]] = []
    parts: Optional[List[JobPartCreate]] = []


class JobUpdate(JobBase):
    """Schema for updating a job."""
    status: Optional[str] = None
    assigned_technician_id: Optional[int] = None
    shop_bay_id: Optional[int] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    actual_hours: Optional[Decimal] = None
    percent_complete: Optional[int] = Field(None, ge=0, le=100)


class JobStatusUpdate(BaseModel):
    """Schema for updating job status."""
    status: str
    notes: Optional[str] = None


class JobResponse(BaseModel):
    """Schema for job response."""
    id: int
    job_number: str
    customer_id: int
    vehicle_id: Optional[int] = None
    quote_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    job_type: str
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    due_date: Optional[date] = None
    priority: str
    status: str
    assigned_technician_id: Optional[int] = None
    shop_bay_id: Optional[int] = None
    estimated_hours: Optional[Decimal] = None
    actual_hours: Optional[Decimal] = None
    labor_total: Decimal
    parts_total: Decimal
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total: Decimal
    percent_complete: int
    invoice_id: Optional[int] = None
    is_invoiced: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobListResponse(JobResponse):
    """Job response with related data."""
    customer_name: str = ""
    vehicle_name: Optional[str] = None
    technician_name: Optional[str] = None
    tasks: List[JobTaskResponse] = []
    parts: List[JobPartResponse] = []
    labor_entries: List[JobLaborResponse] = []

    class Config:
        from_attributes = True


# Alias for detailed single job response
JobDetailResponse = JobListResponse
