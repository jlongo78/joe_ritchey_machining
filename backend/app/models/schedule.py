"""
Scheduling Models for Shop Management
"""

from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class ShopBay(Base):
    """Shop bay / workspace model."""

    __tablename__ = "shop_bays"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    bay_type = Column(String(50), nullable=True)  # machining, dyno, assembly, general
    capacity = Column(Integer, default=1, nullable=False)  # Number of vehicles/projects
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    color = Column(String(7), nullable=True)  # Hex color for calendar display

    # Relationships
    jobs = relationship("Job", back_populates="shop_bay")
    events = relationship("ScheduleEvent", back_populates="bay")

    def __repr__(self):
        return f"<ShopBay(id={self.id}, name={self.name})>"


class ShopHours(Base):
    """Shop operating hours configuration."""

    __tablename__ = "shop_hours"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Sunday, 6=Saturday
    open_time = Column(Time, nullable=True)
    close_time = Column(Time, nullable=True)
    is_open = Column(Boolean, default=True, nullable=False)

    @property
    def day_name(self) -> str:
        """Get day name from day_of_week."""
        days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        return days[self.day_of_week] if 0 <= self.day_of_week <= 6 else "Unknown"

    def __repr__(self):
        return f"<ShopHours(day={self.day_name}, open={self.is_open})>"


class ShopClosure(Base):
    """Shop closure / holiday model."""

    __tablename__ = "shop_closures"

    id = Column(Integer, primary_key=True, index=True)
    closure_date = Column(Date, nullable=False, index=True)
    reason = Column(String(200), nullable=True)
    is_recurring_yearly = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<ShopClosure(date={self.closure_date}, reason={self.reason})>"


class ScheduleEvent(Base, TimestampMixin):
    """Calendar event model for scheduling."""

    __tablename__ = "schedule_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(String(50), nullable=False)  # job, appointment, meeting, time_off, other

    # Timing
    start_datetime = Column(DateTime, nullable=False, index=True)
    end_datetime = Column(DateTime, nullable=False)
    all_day = Column(Boolean, default=False, nullable=False)

    # Assignments
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    bay_id = Column(Integer, ForeignKey("shop_bays.id"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)

    # Status
    status = Column(String(20), default="scheduled", nullable=False)  # scheduled, confirmed, completed, cancelled
    color = Column(String(7), nullable=True)  # Hex color override

    # Reminders
    send_reminder = Column(Boolean, default=True, nullable=False)
    reminder_sent = Column(Boolean, default=False, nullable=False)
    reminder_sent_at = Column(DateTime, nullable=True)

    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="schedule_events")
    bay = relationship("ShopBay", back_populates="events")
    job = relationship("Job", back_populates="schedule_events")
    customer = relationship("Customer")
    creator = relationship("User", foreign_keys=[created_by])

    @property
    def duration_hours(self) -> float:
        """Calculate event duration in hours."""
        if self.all_day:
            return 8.0  # Assume 8-hour day
        delta = self.end_datetime - self.start_datetime
        return delta.total_seconds() / 3600

    def __repr__(self):
        return f"<ScheduleEvent(id={self.id}, title={self.title}, type={self.event_type})>"
