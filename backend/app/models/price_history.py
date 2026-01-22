"""
Price History and Pricing Engine Models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class PriceHistory(Base):
    """Historical price tracking for products."""

    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)

    # Prices
    cost_price = Column(Numeric(10, 2), nullable=True)
    retail_price = Column(Numeric(10, 2), nullable=True)
    competitor_price = Column(Numeric(10, 2), nullable=True)

    # Source
    source = Column(String(50), nullable=False)  # supplier_api, manual, competitor, automatic
    notes = Column(Text, nullable=True)

    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    product = relationship("Product", back_populates="price_history")
    supplier = relationship("Supplier")

    def __repr__(self):
        return f"<PriceHistory(id={self.id}, product_id={self.product_id})>"


class PriceAdjustmentRule(Base, TimestampMixin):
    """Rules for automatic price adjustments."""

    __tablename__ = "price_adjustment_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    # Rule Type
    rule_type = Column(String(50), nullable=False)  # margin_based, competitor_match, time_based, inventory_based

    # Conditions (JSON for flexibility)
    conditions = Column(JSON, nullable=True)
    # Example: {"min_margin": 15, "max_margin": 40, "competitor_match_percent": 5}

    # Priority (higher = processed first)
    priority = Column(Integer, default=0, nullable=False)

    # Scope
    applies_to = Column(String(50), default="all", nullable=False)  # all, category, brand, product
    scope_ids = Column(JSON, nullable=True)  # List of IDs if applies_to != 'all'

    # Actions
    action_type = Column(String(50), nullable=False)  # set_margin, match_competitor, apply_discount
    action_value = Column(Numeric(10, 2), nullable=True)
    action_config = Column(JSON, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<PriceAdjustmentRule(id={self.id}, name={self.name})>"


class PriceAdjustmentLog(Base):
    """Log of automatic price adjustments made."""

    __tablename__ = "price_adjustment_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    rule_id = Column(Integer, ForeignKey("price_adjustment_rules.id"), nullable=True)

    old_price = Column(Numeric(10, 2), nullable=False)
    new_price = Column(Numeric(10, 2), nullable=False)
    old_cost = Column(Numeric(10, 2), nullable=True)
    new_cost = Column(Numeric(10, 2), nullable=True)

    reason = Column(String(255), nullable=True)
    adjustment_details = Column(JSON, nullable=True)  # Full details of the adjustment

    status = Column(String(20), default="applied", nullable=False)  # applied, pending_approval, rejected
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product")
    rule = relationship("PriceAdjustmentRule")
    approver = relationship("User", foreign_keys=[approved_by])

    @property
    def price_change(self) -> float:
        """Calculate price change."""
        return float(self.new_price) - float(self.old_price)

    @property
    def price_change_percent(self) -> float:
        """Calculate percentage price change."""
        if float(self.old_price) == 0:
            return 0.0
        return (self.price_change / float(self.old_price)) * 100

    def __repr__(self):
        return f"<PriceAdjustmentLog(id={self.id}, product_id={self.product_id})>"


class CompetitorConfig(Base, TimestampMixin):
    """Configuration for competitor price monitoring."""

    __tablename__ = "competitor_config"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    website_url = Column(String(500), nullable=True)

    # Monitoring method
    monitor_type = Column(String(50), nullable=False)  # api, scraper, manual

    # API Configuration (if applicable)
    api_endpoint = Column(String(500), nullable=True)
    api_key_encrypted = Column(String(500), nullable=True)

    # Scraper Configuration (if applicable)
    scraper_config = Column(JSON, nullable=True)  # CSS selectors, etc.

    # Matching
    match_by = Column(String(50), default="sku", nullable=False)  # sku, upc, name

    # Scheduling
    sync_frequency_hours = Column(Integer, default=24, nullable=False)
    last_sync_at = Column(DateTime, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<CompetitorConfig(id={self.id}, name={self.name})>"
