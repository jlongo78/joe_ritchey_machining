"""
Inventory Schemas
"""

from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class InventoryBase(BaseModel):
    """Base inventory schema."""
    sku: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    category_id: Optional[int] = None
    part_number: Optional[str] = Field(None, max_length=100)
    manufacturer: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=100)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    retail_price: Optional[Decimal] = Field(None, ge=0)
    markup_percent: Optional[Decimal] = Field(None, ge=0)
    reorder_point: int = Field(default=10, ge=0)
    reorder_quantity: int = Field(default=50, ge=1)
    warehouse_location: Optional[str] = Field(None, max_length=50)
    storage_location: Optional[str] = Field(None, max_length=100)
    bin_number: Optional[str] = Field(None, max_length=50)
    track_inventory: bool = True
    is_consumable: bool = False
    preferred_supplier_id: Optional[int] = None
    supplier_part_number: Optional[str] = Field(None, max_length=100)
    unit_of_measure: str = Field(default="each", max_length=20)
    weight: Optional[Decimal] = Field(None, ge=0)


class InventoryCreate(InventoryBase):
    """Schema for creating an inventory item."""
    product_id: Optional[int] = None
    variant_id: Optional[int] = None
    quantity_on_hand: int = Field(default=0, ge=0)


class InventoryUpdate(BaseModel):
    """Schema for updating an inventory item."""
    sku: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    category_id: Optional[int] = None
    part_number: Optional[str] = Field(None, max_length=100)
    manufacturer: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=100)
    cost_price: Optional[Decimal] = None
    retail_price: Optional[Decimal] = None
    markup_percent: Optional[Decimal] = None
    reorder_point: Optional[int] = None
    reorder_quantity: Optional[int] = None
    warehouse_location: Optional[str] = None
    storage_location: Optional[str] = None
    bin_number: Optional[str] = None
    track_inventory: Optional[bool] = None
    is_consumable: Optional[bool] = None
    preferred_supplier_id: Optional[int] = None
    supplier_part_number: Optional[str] = None
    unit_of_measure: Optional[str] = None
    weight: Optional[Decimal] = None
    is_active: Optional[bool] = None


class InventoryResponse(InventoryBase):
    """Schema for inventory response."""
    id: int
    product_id: Optional[int] = None
    variant_id: Optional[int] = None
    quantity_on_hand: int
    quantity_reserved: int
    quantity_available: int
    is_low_stock: bool
    is_active: bool
    last_counted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    display_name: str

    class Config:
        from_attributes = True


class InventoryTransactionCreate(BaseModel):
    """Schema for creating an inventory transaction."""
    transaction_type: str = Field(..., pattern="^(purchase|sale|adjustment|return|transfer|received|used|scrapped)$")
    quantity: int
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    unit_cost: Optional[Decimal] = None
    notes: Optional[str] = None


class InventoryTransactionResponse(BaseModel):
    """Schema for inventory transaction response."""
    id: int
    item_id: int
    transaction_type: str
    quantity: int
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    unit_cost: Optional[Decimal] = None
    total_cost: Optional[Decimal] = None
    notes: Optional[str] = None
    performed_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryAdjustment(BaseModel):
    """Schema for inventory adjustment."""
    adjustment_type: str = Field(..., pattern="^(count|add|remove|damage|loss)$")
    quantity: int
    reason: Optional[str] = None
    notes: Optional[str] = None


class StockReceive(BaseModel):
    """Schema for receiving stock."""
    quantity: int = Field(..., gt=0)
    unit_cost: Optional[Decimal] = Field(None, ge=0)
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None
