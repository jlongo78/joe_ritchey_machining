"""
Schedule Schemas
"""

from typing import Optional
from datetime import datetime, time
from pydantic import BaseModel, Field


class ShopBayCreate(BaseModel):
    """Schema for creating a shop bay."""
    name: str = Field(..., max_length=50)
    description: Optional[str] = None
    bay_type: Optional[str] = Field(None, max_length=50)
    capacity: int = Field(default=1, ge=1)
    display_order: int = 0
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class ShopBayResponse(BaseModel):
    """Schema for shop bay response."""
    id: int
    name: str
    description: Optional[str] = None
    bay_type: Optional[str] = None
    capacity: int
    is_active: bool
    display_order: int
    color: Optional[str] = None

    class Config:
        from_attributes = True


class ShopHoursCreate(BaseModel):
    """Schema for creating shop hours."""
    day_of_week: int = Field(..., ge=0, le=6)
    open_time: Optional[time] = None
    close_time: Optional[time] = None
    is_open: bool = True


class ShopHoursResponse(BaseModel):
    """Schema for shop hours response."""
    id: int
    day_of_week: int
    day_name: str
    open_time: Optional[time] = None
    close_time: Optional[time] = None
    is_open: bool

    class Config:
        from_attributes = True


class ScheduleEventCreate(BaseModel):
    """Schema for creating a schedule event."""
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    event_type: str = Field(..., pattern="^(job|appointment|meeting|time_off|other)$")
    start_datetime: datetime
    end_datetime: datetime
    all_day: bool = False
    employee_id: Optional[int] = None
    bay_id: Optional[int] = None
    job_id: Optional[int] = None
    customer_id: Optional[int] = None
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    send_reminder: bool = True
    notes: Optional[str] = None


class ScheduleEventUpdate(BaseModel):
    """Schema for updating a schedule event."""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    all_day: Optional[bool] = None
    employee_id: Optional[int] = None
    bay_id: Optional[int] = None
    job_id: Optional[int] = None
    customer_id: Optional[int] = None
    status: Optional[str] = Field(None, pattern="^(scheduled|confirmed|completed|cancelled)$")
    color: Optional[str] = None
    send_reminder: Optional[bool] = None
    notes: Optional[str] = None


class ScheduleEventResponse(BaseModel):
    """Schema for schedule event response."""
    id: int
    title: str
    description: Optional[str] = None
    event_type: str
    start_datetime: datetime
    end_datetime: datetime
    all_day: bool
    employee_id: Optional[int] = None
    bay_id: Optional[int] = None
    job_id: Optional[int] = None
    customer_id: Optional[int] = None
    status: str
    color: Optional[str] = None
    send_reminder: bool
    reminder_sent: bool
    notes: Optional[str] = None
    duration_hours: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScheduleFilter(BaseModel):
    """Schema for filtering schedule events."""
    start_date: datetime
    end_date: datetime
    employee_id: Optional[int] = None
    bay_id: Optional[int] = None
    event_type: Optional[str] = None
    status: Optional[str] = None
