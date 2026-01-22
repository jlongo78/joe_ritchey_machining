"""
Job Management Models for Machining Services
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Job(Base, TimestampMixin):
    """Work order / job model for machining services."""

    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_number = Column(String(20), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("customer_vehicles.id"), nullable=True)
    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=True)

    # Job Details
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    job_type = Column(String(50), default="machining", nullable=False)  # machining, dyno, assembly, custom

    # Scheduling
    scheduled_start = Column(DateTime, nullable=True)
    scheduled_end = Column(DateTime, nullable=True)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    due_date = Column(Date, nullable=True)

    # Priority
    priority = Column(String(20), default="normal", nullable=False)  # low, normal, high, urgent

    # Status
    status = Column(String(30), default="pending", nullable=False, index=True)
    # pending, scheduled, in_progress, on_hold, waiting_parts, waiting_approval, quality_check, completed, cancelled

    # Assignment
    assigned_technician_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    shop_bay_id = Column(Integer, ForeignKey("shop_bays.id"), nullable=True)

    # Pricing
    estimated_hours = Column(Numeric(6, 2), nullable=True)
    actual_hours = Column(Numeric(6, 2), nullable=True)
    labor_total = Column(Numeric(10, 2), default=0, nullable=False)
    parts_total = Column(Numeric(10, 2), default=0, nullable=False)
    subtotal = Column(Numeric(10, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0, nullable=False)
    total = Column(Numeric(10, 2), default=0, nullable=False)

    # Approval
    requires_approval = Column(Boolean, default=False, nullable=False)
    approval_status = Column(String(20), nullable=True)  # pending, approved, declined
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(String(100), nullable=True)
    approval_amount = Column(Numeric(10, 2), nullable=True)  # Amount approved for additional work

    # Invoicing
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    is_invoiced = Column(Boolean, default=False, nullable=False)

    # Progress
    percent_complete = Column(Integer, default=0, nullable=False)

    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="jobs")
    vehicle = relationship("CustomerVehicle", back_populates="jobs")
    quote = relationship("Quote", foreign_keys=[quote_id])
    assigned_technician = relationship("Employee", back_populates="assigned_jobs", foreign_keys=[assigned_technician_id])
    shop_bay = relationship("ShopBay", back_populates="jobs")
    invoice = relationship("Invoice", foreign_keys=[invoice_id])

    tasks = relationship("JobTask", back_populates="job", cascade="all, delete-orphan", order_by="JobTask.display_order")
    parts = relationship("JobPart", back_populates="job", cascade="all, delete-orphan")
    labor_entries = relationship("JobLabor", back_populates="job", cascade="all, delete-orphan")
    job_notes = relationship("JobNote", back_populates="job", cascade="all, delete-orphan", order_by="JobNote.created_at.desc()")
    files = relationship("JobFile", back_populates="job", cascade="all, delete-orphan")
    status_history = relationship("JobStatusHistory", back_populates="job", cascade="all, delete-orphan", order_by="JobStatusHistory.created_at.desc()")
    time_entries = relationship("TimeEntry", back_populates="job")
    schedule_events = relationship("ScheduleEvent", back_populates="job")

    creator = relationship("User", foreign_keys=[created_by])

    def calculate_totals(self):
        """Calculate job totals from parts and labor."""
        self.labor_total = sum(float(entry.total_amount or 0) for entry in self.labor_entries)
        self.parts_total = sum(float(part.total_price or 0) for part in self.parts if part.is_billable)
        self.subtotal = self.labor_total + self.parts_total
        subtotal_after_discount = float(self.subtotal) - float(self.discount_amount or 0)
        self.total = subtotal_after_discount + float(self.tax_amount or 0)

    @property
    def is_overdue(self) -> bool:
        """Check if job is overdue."""
        if self.due_date is None:
            return False
        if self.status in ["completed", "cancelled"]:
            return False
        return datetime.utcnow().date() > self.due_date

    def __repr__(self):
        return f"<Job(id={self.id}, number={self.job_number}, status={self.status})>"


class JobTask(Base, TimestampMixin):
    """Individual task within a job."""

    __tablename__ = "job_tasks"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(String(500), nullable=False)
    estimated_hours = Column(Numeric(5, 2), nullable=True)
    actual_hours = Column(Numeric(5, 2), nullable=True)
    status = Column(String(20), default="pending", nullable=False)  # pending, in_progress, completed, skipped
    assigned_to = Column(Integer, ForeignKey("employees.id"), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    job = relationship("Job", back_populates="tasks")
    assignee = relationship("Employee")
    time_entries = relationship("TimeEntry", back_populates="task")

    def __repr__(self):
        return f"<JobTask(id={self.id}, job_id={self.job_id}, status={self.status})>"


class JobPart(Base, TimestampMixin):
    """Part used in a job."""

    __tablename__ = "job_parts"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id"), nullable=True)

    # Part Details
    part_number = Column(String(100), nullable=True)
    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(10, 2), default=1, nullable=False)
    unit = Column(String(20), default="each", nullable=False)

    # Pricing
    cost_price = Column(Numeric(10, 2), nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=True)
    total_price = Column(Numeric(10, 2), nullable=True)
    markup_percent = Column(Numeric(5, 2), nullable=True)

    # Status
    status = Column(String(20), default="pending", nullable=False)  # pending, ordered, received, installed, returned
    is_billable = Column(Boolean, default=True, nullable=False)
    is_customer_supplied = Column(Boolean, default=False, nullable=False)

    notes = Column(Text, nullable=True)

    # Relationships
    job = relationship("Job", back_populates="parts")
    product = relationship("Product")
    inventory_item = relationship("Inventory")

    def calculate_total(self):
        """Calculate total price."""
        if self.unit_price:
            self.total_price = float(self.unit_price) * float(self.quantity)

    def __repr__(self):
        return f"<JobPart(id={self.id}, job_id={self.job_id})>"


class JobLabor(Base):
    """Labor entry for a job."""

    __tablename__ = "job_labor"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    labor_rate_id = Column(Integer, ForeignKey("labor_rates.id"), nullable=True)

    description = Column(String(500), nullable=True)
    hours = Column(Numeric(5, 2), nullable=False)
    hourly_rate = Column(Numeric(10, 2), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    work_date = Column(Date, nullable=False)
    is_billable = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="labor_entries")
    employee = relationship("Employee", back_populates="job_labor")
    labor_rate = relationship("LaborRate")

    def calculate_total(self):
        """Calculate total amount."""
        self.total_amount = float(self.hours) * float(self.hourly_rate)

    def __repr__(self):
        return f"<JobLabor(id={self.id}, job_id={self.job_id}, hours={self.hours})>"


class JobNote(Base):
    """Notes and activity log for a job."""

    __tablename__ = "job_notes"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note_type = Column(String(30), default="general", nullable=False)  # general, status_update, customer_communication, internal
    content = Column(Text, nullable=False)
    is_customer_visible = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="job_notes")
    user = relationship("User")

    def __repr__(self):
        return f"<JobNote(id={self.id}, job_id={self.job_id})>"


class JobFile(Base):
    """Files attached to jobs."""

    __tablename__ = "job_files"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    category = Column(String(50), default="general", nullable=False)  # general, before_photo, after_photo, dyno_sheet, invoice
    description = Column(String(500), nullable=True)
    is_customer_visible = Column(Boolean, default=False, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    job = relationship("Job", back_populates="files")
    uploader = relationship("User")

    def __repr__(self):
        return f"<JobFile(id={self.id}, job_id={self.job_id}, filename={self.filename})>"


class JobStatusHistory(Base):
    """Job status change history."""

    __tablename__ = "job_status_history"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), nullable=False)
    previous_status = Column(String(30), nullable=True)
    notes = Column(Text, nullable=True)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="status_history")
    user = relationship("User")

    def __repr__(self):
        return f"<JobStatusHistory(id={self.id}, job_id={self.job_id}, status={self.status})>"
