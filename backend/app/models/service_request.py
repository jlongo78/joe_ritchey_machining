"""
Service Request Models for Machining Services
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class ServiceType(Base):
    """Service type catalog for machining services."""

    __tablename__ = "service_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # machining, dyno, assembly, custom
    description = Column(Text, nullable=True)
    base_price = Column(Numeric(10, 2), nullable=True)
    estimated_hours = Column(Numeric(5, 2), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    def __repr__(self):
        return f"<ServiceType(id={self.id}, name={self.name})>"


class ServiceRequest(Base, TimestampMixin):
    """Service request model for customer inquiries and appointment requests."""

    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_number = Column(String(20), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    vehicle_id = Column(Integer, ForeignKey("customer_vehicles.id"), nullable=True)

    # Contact Info (for non-customer requests)
    contact_name = Column(String(100), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)

    # Request Details
    service_category = Column(String(50), nullable=True)  # machining, dyno, assembly, custom
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    preferred_date = Column(DateTime, nullable=True)
    priority = Column(String(20), default="normal", nullable=False)  # low, normal, high, urgent

    # Vehicle Info (if not linked to customer vehicle)
    vehicle_year = Column(Integer, nullable=True)
    vehicle_make = Column(String(100), nullable=True)
    vehicle_model = Column(String(100), nullable=True)
    vehicle_engine = Column(String(100), nullable=True)

    # Status
    status = Column(String(30), default="new", nullable=False, index=True)
    # new, contacted, quote_sent, scheduled, in_progress, completed, closed, cancelled

    # Assignment
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Conversion
    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)

    # Source
    source = Column(String(50), default="web", nullable=False)  # web, phone, email, walk_in, referral

    notes = Column(Text, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="service_requests")
    vehicle = relationship("CustomerVehicle", back_populates="service_requests")
    assigned_user = relationship("User", foreign_keys=[assigned_to])
    quote = relationship("Quote", foreign_keys=[quote_id])
    job = relationship("Job", foreign_keys=[job_id])
    items = relationship("ServiceRequestItem", back_populates="request", cascade="all, delete-orphan")
    files = relationship("ServiceRequestFile", back_populates="request", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ServiceRequest(id={self.id}, number={self.request_number}, status={self.status})>"


class ServiceRequestItem(Base):
    """Individual service items within a request."""

    __tablename__ = "service_request_items"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False)
    service_type_id = Column(Integer, ForeignKey("service_types.id"), nullable=True)
    description = Column(String(500), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    request = relationship("ServiceRequest", back_populates="items")
    service_type = relationship("ServiceType")

    def __repr__(self):
        return f"<ServiceRequestItem(id={self.id}, request_id={self.request_id})>"


class ServiceRequestFile(Base):
    """Files attached to service requests."""

    __tablename__ = "service_request_files"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    description = Column(String(500), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    request = relationship("ServiceRequest", back_populates="files")
    uploader = relationship("User")

    def __repr__(self):
        return f"<ServiceRequestFile(id={self.id}, filename={self.filename})>"
