"""
Supplier Management Models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Supplier(Base, TimestampMixin):
    """Supplier model for vendor management."""

    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    contact_name = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    fax = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)

    # Address
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)

    # Terms
    payment_terms = Column(String(100), nullable=True)
    account_number = Column(String(100), nullable=True)
    tax_id = Column(String(50), nullable=True)
    lead_time_days = Column(Integer, default=7, nullable=False)
    minimum_order_amount = Column(Numeric(10, 2), nullable=True)

    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    api_config = relationship("SupplierAPIConfig", back_populates="supplier", uselist=False, cascade="all, delete-orphan")
    products = relationship("ProductSupplier", back_populates="supplier", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Supplier(id={self.id}, name={self.name}, code={self.code})>"


class SupplierAPIConfig(Base, TimestampMixin):
    """Supplier API configuration for automated price syncing."""

    __tablename__ = "supplier_api_config"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), unique=True, nullable=False)
    api_type = Column(String(50), nullable=False)  # rest, soap, ftp, scraper
    base_url = Column(String(500), nullable=True)
    auth_type = Column(String(50), nullable=True)  # api_key, oauth2, basic
    api_key_encrypted = Column(String(500), nullable=True)
    api_secret_encrypted = Column(String(500), nullable=True)
    additional_config = Column(JSON, nullable=True)  # Extra configuration parameters
    rate_limit_per_minute = Column(Integer, default=60, nullable=False)
    last_sync_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    supplier = relationship("Supplier", back_populates="api_config")

    def __repr__(self):
        return f"<SupplierAPIConfig(id={self.id}, supplier_id={self.supplier_id}, type={self.api_type})>"


class ProductSupplier(Base, TimestampMixin):
    """Product-Supplier relationship with pricing."""

    __tablename__ = "product_suppliers"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_sku = Column(String(100), nullable=True)
    supplier_url = Column(String(500), nullable=True)
    cost_price = Column(Numeric(10, 2), nullable=False)
    last_cost_price = Column(Numeric(10, 2), nullable=True)
    minimum_order_quantity = Column(Integer, default=1, nullable=False)
    is_preferred = Column(Boolean, default=False, nullable=False)
    lead_time_days = Column(Integer, nullable=True)
    last_checked_at = Column(DateTime, nullable=True)
    last_price_change_at = Column(DateTime, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="suppliers")
    supplier = relationship("Supplier", back_populates="products")

    @property
    def price_changed(self) -> bool:
        """Check if price has changed since last check."""
        return self.last_cost_price is not None and self.cost_price != self.last_cost_price

    @property
    def price_change_percent(self) -> float:
        """Calculate percentage price change."""
        if not self.last_cost_price or float(self.last_cost_price) == 0:
            return 0.0
        return ((float(self.cost_price) - float(self.last_cost_price)) / float(self.last_cost_price)) * 100

    def __repr__(self):
        return f"<ProductSupplier(id={self.id}, product_id={self.product_id}, supplier_id={self.supplier_id})>"
