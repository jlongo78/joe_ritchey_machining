"""
Pricing Engine Schemas
"""

from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class PriceAdjustmentRuleCreate(BaseModel):
    """Schema for creating a price adjustment rule."""
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    rule_type: str = Field(..., pattern="^(margin_based|competitor_match|time_based|inventory_based)$")
    conditions: Optional[dict] = None
    priority: int = Field(default=0, ge=0)
    applies_to: str = Field(default="all", pattern="^(all|category|brand|product)$")
    scope_ids: Optional[List[int]] = None
    action_type: str = Field(..., pattern="^(set_margin|match_competitor|apply_discount)$")
    action_value: Optional[Decimal] = None
    action_config: Optional[dict] = None
    is_active: bool = True


class PriceAdjustmentRuleResponse(BaseModel):
    """Schema for price adjustment rule response."""
    id: int
    name: str
    description: Optional[str] = None
    rule_type: str
    conditions: Optional[dict] = None
    priority: int
    applies_to: str
    scope_ids: Optional[List[int]] = None
    action_type: str
    action_value: Optional[Decimal] = None
    action_config: Optional[dict] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PriceHistoryResponse(BaseModel):
    """Schema for price history response."""
    id: int
    product_id: int
    supplier_id: Optional[int] = None
    cost_price: Optional[Decimal] = None
    retail_price: Optional[Decimal] = None
    competitor_price: Optional[Decimal] = None
    source: str
    notes: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True


class PriceAdjustmentLogResponse(BaseModel):
    """Schema for price adjustment log response."""
    id: int
    product_id: int
    rule_id: Optional[int] = None
    old_price: Decimal
    new_price: Decimal
    old_cost: Optional[Decimal] = None
    new_cost: Optional[Decimal] = None
    reason: Optional[str] = None
    price_change: float
    price_change_percent: float
    status: str
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PriceSyncRequest(BaseModel):
    """Schema for triggering a price sync."""
    supplier_id: Optional[int] = None  # None = sync all
    product_ids: Optional[List[int]] = None  # None = sync all products


class PriceUpdateRequest(BaseModel):
    """Schema for manually updating a product price."""
    product_id: int
    new_cost: Optional[Decimal] = Field(None, ge=0)
    new_retail_price: Optional[Decimal] = Field(None, ge=0)
    reason: Optional[str] = None


class PricingAnalysis(BaseModel):
    """Schema for pricing analysis response."""
    product_id: int
    product_name: str
    current_cost: Decimal
    current_retail: Decimal
    current_margin_percent: float
    suggested_price: Optional[Decimal] = None
    competitor_prices: List[dict] = []
    price_history: List[PriceHistoryResponse] = []
    recommendations: List[str] = []


class BulkPriceUpdate(BaseModel):
    """Schema for bulk price updates."""
    adjustment_type: str = Field(..., pattern="^(percentage|fixed|set_margin)$")
    adjustment_value: Decimal
    applies_to: str = Field(default="all", pattern="^(all|category|brand|product_ids)$")
    scope_ids: Optional[List[int]] = None
    product_ids: Optional[List[int]] = None
    reason: str
    preview_only: bool = True  # If true, only return preview without applying


class SupplierSyncResult(BaseModel):
    """Schema for supplier price sync results."""
    supplier_id: int
    supplier_name: str
    products_updated: int
    products_skipped: int
    errors: List[str] = []
    synced_at: datetime


class MarginAnalysis(BaseModel):
    """Schema for margin analysis results."""
    total_products: int
    average_margin_percent: float
    below_target_count: int
    above_target_count: int
    products_needing_review: List[dict] = []
