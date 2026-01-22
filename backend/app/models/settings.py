"""
Settings and Configuration Models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Setting(Base):
    """Key-value settings storage."""

    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    value_type = Column(String(20), default="string", nullable=False)  # string, int, float, bool, json
    category = Column(String(50), nullable=True)  # general, email, sms, payment, pricing, etc.
    description = Column(String(500), nullable=True)
    is_public = Column(Boolean, default=False, nullable=False)  # Can be exposed to frontend
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    updater = relationship("User")

    @property
    def typed_value(self):
        """Get value cast to its proper type."""
        if self.value is None:
            return None
        if self.value_type == "int":
            return int(self.value)
        elif self.value_type == "float":
            return float(self.value)
        elif self.value_type == "bool":
            return self.value.lower() in ("true", "1", "yes")
        elif self.value_type == "json":
            import json
            return json.loads(self.value)
        return self.value

    def __repr__(self):
        return f"<Setting(key={self.key}, value={self.value})>"


class TaxRate(Base, TimestampMixin):
    """Tax rate configuration."""

    __tablename__ = "tax_rates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rate = Column(Numeric(5, 4), nullable=False)  # e.g., 0.0825 for 8.25%
    description = Column(Text, nullable=True)
    applies_to = Column(String(50), default="all", nullable=False)  # all, parts, labor
    state = Column(String(50), nullable=True)
    county = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    @property
    def rate_percent(self) -> float:
        """Get rate as percentage."""
        return float(self.rate) * 100

    def __repr__(self):
        return f"<TaxRate(id={self.id}, name={self.name}, rate={self.rate_percent}%)>"


class LaborRate(Base, TimestampMixin):
    """Labor rate configuration."""

    __tablename__ = "labor_rates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    rate = Column(Numeric(10, 2), nullable=False)  # Hourly rate
    description = Column(Text, nullable=True)
    service_type = Column(String(50), nullable=True)  # machining, dyno, assembly, general
    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<LaborRate(id={self.id}, name={self.name}, rate=${self.rate}/hr)>"
