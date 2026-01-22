"""
Vehicle Fitment Models for Product Compatibility
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class VehicleMake(Base):
    """Vehicle make model (e.g., Ford, Chevrolet, Honda)."""

    __tablename__ = "vehicle_makes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    logo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    models = relationship("VehicleModel", back_populates="make", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<VehicleMake(id={self.id}, name={self.name})>"


class VehicleModel(Base):
    """Vehicle model model (e.g., Mustang, Camaro, Civic)."""

    __tablename__ = "vehicle_models"

    id = Column(Integer, primary_key=True, index=True)
    make_id = Column(Integer, ForeignKey("vehicle_makes.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    make = relationship("VehicleMake", back_populates="models")
    years = relationship("VehicleYear", back_populates="model", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<VehicleModel(id={self.id}, name={self.name}, make_id={self.make_id})>"


class VehicleYear(Base):
    """Vehicle year model for specific year configurations."""

    __tablename__ = "vehicle_years"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("vehicle_models.id", ondelete="CASCADE"), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    submodel = Column(String(100), nullable=True)  # GT, Base, Sport, etc.
    engine = Column(String(100), nullable=True)
    transmission = Column(String(50), nullable=True)  # Manual, Automatic
    drive_type = Column(String(50), nullable=True)  # RWD, FWD, AWD

    # Relationships
    model = relationship("VehicleModel", back_populates="years")
    fitments = relationship("ProductFitment", back_populates="vehicle_year")

    @property
    def display_name(self) -> str:
        """Get full vehicle name."""
        parts = [str(self.year)]
        if self.model and self.model.make:
            parts.append(self.model.make.name)
        if self.model:
            parts.append(self.model.name)
        if self.submodel:
            parts.append(self.submodel)
        return " ".join(parts)

    def __repr__(self):
        return f"<VehicleYear(id={self.id}, year={self.year}, model_id={self.model_id})>"


class ProductFitment(Base):
    """Product fitment mapping - which products fit which vehicles."""

    __tablename__ = "product_fitments"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_year_id = Column(Integer, ForeignKey("vehicle_years.id", ondelete="CASCADE"), nullable=False, index=True)
    fitment_notes = Column(String(500), nullable=True)  # Special instructions or compatibility notes
    is_universal = Column(Boolean, default=False, nullable=False)  # Universal fit
    requires_modification = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="fitments")
    vehicle_year = relationship("VehicleYear", back_populates="fitments")

    def __repr__(self):
        return f"<ProductFitment(id={self.id}, product_id={self.product_id}, vehicle_year_id={self.vehicle_year_id})>"
