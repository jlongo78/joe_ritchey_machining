"""
Equipment Models for Shop Equipment Management
"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Equipment(Base, TimestampMixin):
    """Shop equipment model."""

    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    equipment_type = Column(String(50), nullable=False)  # dyno, cnc, lathe, mill, lift, welder, other
    manufacturer = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)
    location = Column(String(100), nullable=True)

    # Purchase Info
    purchase_date = Column(Date, nullable=True)
    purchase_price = Column(Numeric(12, 2), nullable=True)
    vendor = Column(String(200), nullable=True)
    warranty_expiration = Column(Date, nullable=True)

    # Status
    status = Column(String(20), default="operational", nullable=False)  # operational, maintenance, repair, retired
    is_active = Column(Boolean, default=True, nullable=False)

    # Maintenance
    last_maintenance_date = Column(Date, nullable=True)
    next_maintenance_date = Column(Date, nullable=True)
    maintenance_interval_days = Column(Integer, nullable=True)
    maintenance_notes = Column(Text, nullable=True)

    # Specifications
    specifications = Column(JSON, nullable=True)  # Flexible specs storage

    notes = Column(Text, nullable=True)

    # Relationships
    maintenance_logs = relationship("EquipmentMaintenance", back_populates="equipment", cascade="all, delete-orphan")

    @property
    def is_maintenance_due(self) -> bool:
        """Check if maintenance is due."""
        if self.next_maintenance_date is None:
            return False
        return date.today() >= self.next_maintenance_date

    def __repr__(self):
        return f"<Equipment(id={self.id}, name={self.name}, type={self.equipment_type})>"


class EquipmentMaintenance(Base):
    """Equipment maintenance log."""

    __tablename__ = "equipment_maintenance"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False, index=True)
    maintenance_type = Column(String(50), nullable=False)  # routine, repair, calibration, inspection
    description = Column(Text, nullable=False)
    maintenance_date = Column(Date, nullable=False)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    external_vendor = Column(String(200), nullable=True)
    cost = Column(Numeric(10, 2), nullable=True)
    parts_replaced = Column(Text, nullable=True)
    next_scheduled = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    equipment = relationship("Equipment", back_populates="maintenance_logs")
    technician = relationship("User", foreign_keys=[performed_by])

    def __repr__(self):
        return f"<EquipmentMaintenance(id={self.id}, equipment_id={self.equipment_id}, type={self.maintenance_type})>"
