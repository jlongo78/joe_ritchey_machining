"""
Dyno Session Models for Performance Testing
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class DynoSession(Base, TimestampMixin):
    """Dyno testing session model."""

    __tablename__ = "dyno_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_number = Column(String(20), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("customer_vehicles.id"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)

    # Session Info
    session_date = Column(DateTime, nullable=False)
    session_type = Column(String(50), nullable=False)  # baseline, tune, before_after, diagnostic
    operator_id = Column(Integer, ForeignKey("employees.id"), nullable=True)

    # Vehicle Overrides (if not using linked vehicle)
    vehicle_year = Column(Integer, nullable=True)
    vehicle_make = Column(String(100), nullable=True)
    vehicle_model = Column(String(100), nullable=True)
    vehicle_engine = Column(String(100), nullable=True)

    # Environment Conditions
    ambient_temp_f = Column(Numeric(5, 2), nullable=True)
    humidity_percent = Column(Numeric(5, 2), nullable=True)
    barometric_pressure = Column(Numeric(6, 2), nullable=True)  # inHg
    correction_factor = Column(Numeric(5, 3), nullable=True)

    # Summary Results
    peak_hp = Column(Numeric(7, 2), nullable=True)
    peak_hp_rpm = Column(Integer, nullable=True)
    peak_torque = Column(Numeric(7, 2), nullable=True)
    peak_torque_rpm = Column(Integer, nullable=True)
    corrected_hp = Column(Numeric(7, 2), nullable=True)
    corrected_torque = Column(Numeric(7, 2), nullable=True)

    # Status
    status = Column(String(20), default="scheduled", nullable=False)  # scheduled, in_progress, completed, cancelled

    notes = Column(Text, nullable=True)
    customer_visible_notes = Column(Text, nullable=True)

    # Relationships
    customer = relationship("Customer")
    vehicle = relationship("CustomerVehicle", back_populates="dyno_sessions")
    job = relationship("Job")
    operator = relationship("Employee")
    runs = relationship("DynoRun", back_populates="session", cascade="all, delete-orphan", order_by="DynoRun.run_number")

    @property
    def run_count(self) -> int:
        """Get number of runs in session."""
        return len(self.runs)

    def __repr__(self):
        return f"<DynoSession(id={self.id}, number={self.session_number})>"


class DynoRun(Base):
    """Individual dyno run within a session."""

    __tablename__ = "dyno_runs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("dyno_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    run_number = Column(Integer, nullable=False)
    run_type = Column(String(50), nullable=True)  # baseline, modified, comparison

    # Timing
    run_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Results
    peak_hp = Column(Numeric(7, 2), nullable=True)
    peak_hp_rpm = Column(Integer, nullable=True)
    peak_torque = Column(Numeric(7, 2), nullable=True)
    peak_torque_rpm = Column(Integer, nullable=True)
    corrected_hp = Column(Numeric(7, 2), nullable=True)
    corrected_torque = Column(Numeric(7, 2), nullable=True)

    # Raw Data
    data_points = Column(JSON, nullable=True)  # Array of {rpm, hp, torque, afr, boost, etc.}

    # Conditions
    ambient_temp_f = Column(Numeric(5, 2), nullable=True)
    correction_factor = Column(Numeric(5, 3), nullable=True)
    boost_psi = Column(Numeric(5, 2), nullable=True)
    afr_avg = Column(Numeric(5, 2), nullable=True)

    # Configuration
    tune_file = Column(String(255), nullable=True)
    configuration_notes = Column(Text, nullable=True)  # What was changed for this run

    # Flags
    is_best_run = Column(Boolean, default=False, nullable=False)
    is_valid = Column(Boolean, default=True, nullable=False)

    notes = Column(Text, nullable=True)

    # Relationships
    session = relationship("DynoSession", back_populates="runs")

    def __repr__(self):
        return f"<DynoRun(id={self.id}, session_id={self.session_id}, run={self.run_number})>"
