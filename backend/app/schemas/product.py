"""
Product Schemas for E-commerce
"""

from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class ProductImageCreate(BaseModel):
    """Schema for creating a product image."""
    image_url: str = Field(..., max_length=500)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    alt_text: Optional[str] = Field(None, max_length=255)
    display_order: int = 0
    is_primary: bool = False


class ProductImageResponse(ProductImageCreate):
    """Schema for product image response."""
    id: int

    class Config:
        from_attributes = True


class ProductAttributeCreate(BaseModel):
    """Schema for creating a product attribute."""
    attribute_name: str = Field(..., max_length=100)
    attribute_value: str = Field(..., max_length=255)
    display_order: int = 0


class ProductAttributeResponse(ProductAttributeCreate):
    """Schema for product attribute response."""
    id: int

    class Config:
        from_attributes = True


class ProductVariantCreate(BaseModel):
    """Schema for creating a product variant."""
    sku: str = Field(..., max_length=100)
    name: Optional[str] = Field(None, max_length=255)
    variant_attributes: Optional[dict] = None  # {"color": "red", "size": "large"}
    price_adjustment: Decimal = Decimal("0.00")
    stock_quantity: int = 0
    is_active: bool = True


class ProductVariantResponse(ProductVariantCreate):
    """Schema for product variant response."""
    id: int
    effective_price: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    """Base product schema."""
    sku: str = Field(..., max_length=100)
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=255)
    short_description: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    brand_id: Optional[int] = None

    # Pricing
    base_cost: Decimal = Field(..., ge=0)
    retail_price: Decimal = Field(..., ge=0)
    sale_price: Optional[Decimal] = Field(None, ge=0)
    sale_start_date: Optional[datetime] = None
    sale_end_date: Optional[datetime] = None

    # Pricing Algorithm
    min_margin_percent: Decimal = Field(default=Decimal("15.00"), ge=0, le=100)
    max_margin_percent: Decimal = Field(default=Decimal("40.00"), ge=0, le=100)
    price_rounding: str = Field(default="nearest_99")
    competitor_match_enabled: bool = True

    # Physical
    weight: Optional[Decimal] = Field(None, ge=0)
    length: Optional[Decimal] = Field(None, ge=0)
    width: Optional[Decimal] = Field(None, ge=0)
    height: Optional[Decimal] = Field(None, ge=0)

    # Status
    is_active: bool = True
    is_featured: bool = False
    is_new: bool = False

    # SEO
    meta_title: Optional[str] = Field(None, max_length=200)
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = Field(None, max_length=500)


class ProductCreate(ProductBase):
    """Schema for creating a product."""
    category_ids: Optional[List[int]] = []
    images: Optional[List[ProductImageCreate]] = []
    attributes: Optional[List[ProductAttributeCreate]] = []
    variants: Optional[List[ProductVariantCreate]] = []


class ProductUpdate(BaseModel):
    """Schema for updating a product."""
    name: Optional[str] = Field(None, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    short_description: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    brand_id: Optional[int] = None
    base_cost: Optional[Decimal] = Field(None, ge=0)
    retail_price: Optional[Decimal] = Field(None, ge=0)
    sale_price: Optional[Decimal] = Field(None, ge=0)
    sale_start_date: Optional[datetime] = None
    sale_end_date: Optional[datetime] = None
    min_margin_percent: Optional[Decimal] = None
    max_margin_percent: Optional[Decimal] = None
    weight: Optional[Decimal] = None
    length: Optional[Decimal] = None
    width: Optional[Decimal] = None
    height: Optional[Decimal] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_new: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None


class ProductResponse(ProductBase):
    """Schema for product response."""
    id: int
    current_price: float
    is_on_sale: bool
    average_rating: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(ProductResponse):
    """Product response with related data."""
    images: List[ProductImageResponse] = []
    attributes: List[ProductAttributeResponse] = []
    variants: List[ProductVariantResponse] = []
    brand_name: Optional[str] = None
    category_names: List[str] = []
    stock_quantity: int = 0

    class Config:
        from_attributes = True


# Alias for detailed single product response
ProductDetailResponse = ProductListResponse


class ProductSearchParams(BaseModel):
    """Search parameters for products."""
    q: Optional[str] = Field(None, min_length=1, max_length=200)
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    in_stock: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_new: Optional[bool] = None
    is_on_sale: Optional[bool] = None
    year: Optional[int] = None
    make: Optional[str] = None
    model: Optional[str] = None
