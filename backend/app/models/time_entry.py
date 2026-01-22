"""
Time Tracking Model
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship

from app.db.base import Base


class TimeEntry(Base):
    """Time entry model for employee time tracking."""

    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    task_id = Column(Integer, ForeignKey("job_tasks.id"), nullable=True)
    clock_in = Column(DateTime, nullable=False)
    clock_out = Column(DateTime, nullable=True)
    break_minutes = Column(Integer, default=0, nullable=False)
    total_hours = Column(Numeric(5, 2), nullable=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=True)
    entry_type = Column(String(20), default="regular", nullable=False)  # regular, overtime, holiday
    notes = Column(Text, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="time_entries")
    job = relationship("Job", back_populates="time_entries")
    task = relationship("JobTask", back_populates="time_entries")
    approver = relationship("User", foreign_keys=[approved_by])

    @property
    def is_clocked_in(self) -> bool:
        """Check if employee is currently clocked in."""
        return self.clock_out is None

    @property
    def duration_hours(self) -> float:
        """Calculate duration in hours."""
        if self.clock_out is None:
            return 0.0
        delta = self.clock_out - self.clock_in
        total_minutes = delta.total_seconds() / 60
        working_minutes = total_minutes - (self.break_minutes or 0)
        return round(working_minutes / 60, 2)

    def calculate_totals(self):
        """Calculate total hours and amount."""
        if self.clock_out:
            self.total_hours = self.duration_hours
            if self.hourly_rate:
                self.total_amount = round(float(self.total_hours) * float(self.hourly_rate), 2)

    def __repr__(self):
        return f"<TimeEntry(id={self.id}, employee_id={self.employee_id}, hours={self.total_hours})>"
