"""
Inventory Management Models
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property

from app.db.base import Base, TimestampMixin


class InventoryCategory(Base):
    """Inventory category for shop parts/supplies."""

    __tablename__ = "inventory_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("inventory_categories.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    parent = relationship("InventoryCategory", remote_side=[id], backref="subcategories")
    items = relationship("Inventory", back_populates="category")

    def __repr__(self):
        return f"<InventoryCategory(id={self.id}, name={self.name})>"


class Inventory(Base, TimestampMixin):
    """Inventory item model for both e-commerce products and shop supplies."""

    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=True)

    # For shop inventory (not linked to e-commerce products)
    sku = Column(String(100), nullable=True, index=True)
    name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, ForeignKey("inventory_categories.id"), nullable=True)

    # Identification
    part_number = Column(String(100), nullable=True)
    manufacturer = Column(String(100), nullable=True)
    barcode = Column(String(100), nullable=True)

    # Pricing
    cost_price = Column(Numeric(10, 2), nullable=True)
    retail_price = Column(Numeric(10, 2), nullable=True)
    markup_percent = Column(Numeric(5, 2), nullable=True)

    # Stock levels
    quantity_on_hand = Column(Integer, default=0, nullable=False)
    quantity_reserved = Column(Integer, default=0, nullable=False)
    reorder_point = Column(Integer, default=10, nullable=False)
    reorder_quantity = Column(Integer, default=50, nullable=False)

    # Location
    warehouse_location = Column(String(50), nullable=True)
    storage_location = Column(String(100), nullable=True)
    bin_number = Column(String(50), nullable=True)

    # Tracking
    track_inventory = Column(Boolean, default=True, nullable=False)
    is_consumable = Column(Boolean, default=False, nullable=False)  # Shop supplies not billed

    # Supplier
    preferred_supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier_part_number = Column(String(100), nullable=True)

    # Physical
    unit_of_measure = Column(String(20), default="each", nullable=False)  # each, set, pair, box
    weight = Column(Numeric(10, 2), nullable=True)

    last_counted_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="inventory")
    variant = relationship("ProductVariant", back_populates="inventory")
    category = relationship("InventoryCategory", back_populates="items")
    preferred_supplier = relationship("Supplier")
    transactions = relationship("InventoryTransaction", back_populates="item", cascade="all, delete-orphan")

    @hybrid_property
    def quantity_available(self) -> int:
        """Calculate available quantity (on hand minus reserved)."""
        return self.quantity_on_hand - self.quantity_reserved

    @property
    def is_low_stock(self) -> bool:
        """Check if item is at or below reorder point."""
        return self.quantity_available <= self.reorder_point

    @property
    def display_name(self) -> str:
        """Get display name from product or direct name."""
        if self.product:
            return self.product.name
        return self.name or self.sku or f"Item #{self.id}"

    def __repr__(self):
        return f"<Inventory(id={self.id}, qty={self.quantity_on_hand})>"


class InventoryTransaction(Base):
    """Inventory transaction history."""

    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory.id"), nullable=False, index=True)
    # Also support direct product reference for e-commerce
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)

    transaction_type = Column(String(50), nullable=False)  # purchase, sale, adjustment, return, transfer, received, used, scrapped
    quantity = Column(Integer, nullable=False)  # Positive for in, negative for out

    # Reference
    reference_type = Column(String(50), nullable=True)  # order, purchase_order, job, adjustment
    reference_id = Column(Integer, nullable=True)

    # Cost tracking
    unit_cost = Column(Numeric(10, 2), nullable=True)
    total_cost = Column(Numeric(10, 2), nullable=True)

    notes = Column(Text, nullable=True)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    item = relationship("Inventory", back_populates="transactions")
    user = relationship("User")

    def __repr__(self):
        return f"<InventoryTransaction(id={self.id}, type={self.transaction_type}, qty={self.quantity})>"
