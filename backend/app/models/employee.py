"""
Employee and HR Models
"""

from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Employee(Base, TimestampMixin):
    """Employee model for staff management."""

    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_number = Column(String(20), unique=True, nullable=False, index=True)
    department = Column(String(50), nullable=True)  # machining, dyno, assembly, admin
    job_title = Column(String(100), nullable=True)
    hire_date = Column(Date, nullable=False)
    termination_date = Column(Date, nullable=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    salary = Column(Numeric(10, 2), nullable=True)
    pay_type = Column(String(20), default="hourly", nullable=False)  # hourly, salary
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    skills = Column(JSON, nullable=True)  # ["engine_building", "dyno_tuning", "cnc_machining"]
    certifications = Column(JSON, nullable=True)  # [{name, issued_date, expiry_date}]
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="employee")
    availability = relationship("EmployeeAvailability", back_populates="employee", cascade="all, delete-orphan")
    time_entries = relationship("TimeEntry", back_populates="employee")
    assigned_jobs = relationship("Job", back_populates="assigned_technician", foreign_keys="Job.assigned_technician_id")
    job_labor = relationship("JobLabor", back_populates="employee")
    schedule_events = relationship("ScheduleEvent", back_populates="employee")

    @property
    def full_name(self) -> str:
        """Get employee's full name from user."""
        if self.user:
            return self.user.full_name
        return self.employee_number

    @property
    def is_currently_employed(self) -> bool:
        """Check if employee is currently employed."""
        return self.is_active and self.termination_date is None

    def __repr__(self):
        return f"<Employee(id={self.id}, number={self.employee_number})>"


class EmployeeAvailability(Base):
    """Employee weekly availability schedule."""

    __tablename__ = "employee_availability"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Sunday, 6=Saturday
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="availability")

    @property
    def day_name(self) -> str:
        """Get day name from day_of_week."""
        days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        return days[self.day_of_week] if 0 <= self.day_of_week <= 6 else "Unknown"

    def __repr__(self):
        return f"<EmployeeAvailability(employee_id={self.employee_id}, day={self.day_name})>"
