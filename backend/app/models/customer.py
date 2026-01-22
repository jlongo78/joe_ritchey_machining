"""
Customer and CRM Models
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Customer(Base, TimestampMixin):
    """Customer model for CRM and business operations."""

    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    customer_number = Column(String(20), unique=True, nullable=False, index=True)
    customer_type = Column(String(20), default="individual", nullable=False)  # individual, business, shop

    # Contact Information
    company_name = Column(String(200), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    mobile_phone = Column(String(20), nullable=True)
    fax = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)

    # Address
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), default="USA", nullable=True)

    # Business Info
    tax_id = Column(String(50), nullable=True)
    payment_terms = Column(String(50), default="due_on_receipt", nullable=False)  # due_on_receipt, net_15, net_30, net_45, net_60
    credit_limit = Column(Numeric(10, 2), nullable=True)

    # Preferences
    preferred_contact_method = Column(String(20), default="email", nullable=False)  # email, phone, sms
    marketing_opt_in = Column(Boolean, default=True, nullable=False)

    # Analytics
    total_revenue = Column(Numeric(12, 2), default=0, nullable=False)
    total_jobs = Column(Integer, default=0, nullable=False)
    last_service_date = Column(Date, nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)  # ["vip", "fleet", "racer"]

    # Source tracking
    referral_source = Column(String(100), nullable=True)
    referred_by_customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="customer")
    contacts = relationship("CustomerContact", back_populates="customer", cascade="all, delete-orphan")
    vehicles = relationship("CustomerVehicle", back_populates="customer", cascade="all, delete-orphan")
    customer_notes = relationship("CustomerNote", back_populates="customer", cascade="all, delete-orphan")
    referred_by = relationship("Customer", remote_side=[id], foreign_keys=[referred_by_customer_id])

    # Related business objects
    service_requests = relationship("ServiceRequest", back_populates="customer")
    quotes = relationship("Quote", back_populates="customer")
    jobs = relationship("Job", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")

    @property
    def display_name(self) -> str:
        """Get display name for the customer."""
        if self.company_name:
            return self.company_name
        elif self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        return self.customer_number

    @property
    def full_address(self) -> str:
        """Get formatted full address."""
        parts = []
        if self.address_line1:
            parts.append(self.address_line1)
        if self.address_line2:
            parts.append(self.address_line2)
        city_state_zip = []
        if self.city:
            city_state_zip.append(self.city)
        if self.state:
            city_state_zip.append(self.state)
        if self.postal_code:
            city_state_zip.append(self.postal_code)
        if city_state_zip:
            parts.append(", ".join(city_state_zip))
        return "\n".join(parts)

    def __repr__(self):
        return f"<Customer(id={self.id}, number={self.customer_number}, name={self.display_name})>"


class CustomerContact(Base, TimestampMixin):
    """Additional contacts for a customer (business customers may have multiple)."""

    __tablename__ = "customer_contacts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    title = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    mobile_phone = Column(String(20), nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="contacts")

    @property
    def full_name(self) -> str:
        """Get contact's full name."""
        if self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name

    def __repr__(self):
        return f"<CustomerContact(id={self.id}, name={self.full_name})>"


class CustomerVehicle(Base, TimestampMixin):
    """Vehicle information for a customer."""

    __tablename__ = "customer_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=True)
    make = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    submodel = Column(String(100), nullable=True)
    engine = Column(String(100), nullable=True)
    vin = Column(String(17), nullable=True)
    license_plate = Column(String(20), nullable=True)
    color = Column(String(50), nullable=True)
    mileage = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="vehicles")
    service_requests = relationship("ServiceRequest", back_populates="vehicle")
    quotes = relationship("Quote", back_populates="vehicle")
    jobs = relationship("Job", back_populates="vehicle")
    dyno_sessions = relationship("DynoSession", back_populates="vehicle")

    @property
    def display_name(self) -> str:
        """Get vehicle display name."""
        parts = []
        if self.year:
            parts.append(str(self.year))
        if self.make:
            parts.append(self.make)
        if self.model:
            parts.append(self.model)
        if self.submodel:
            parts.append(self.submodel)
        return " ".join(parts) if parts else "Unknown Vehicle"

    def __repr__(self):
        return f"<CustomerVehicle(id={self.id}, name={self.display_name})>"


class CustomerNote(Base):
    """Notes and activity log for a customer."""

    __tablename__ = "customer_notes"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note_type = Column(String(50), default="general", nullable=False)  # general, call, meeting, email, issue
    subject = Column(String(200), nullable=True)
    content = Column(Text, nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="customer_notes")
    user = relationship("User")

    def __repr__(self):
        return f"<CustomerNote(id={self.id}, customer_id={self.customer_id}, type={self.note_type})>"
