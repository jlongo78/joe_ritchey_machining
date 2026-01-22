"""
Product and Catalog Models for E-commerce
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base, TimestampMixin


class Product(Base, TimestampMixin):
    """Product model for e-commerce catalog."""

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    short_description = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.id", ondelete="SET NULL"), nullable=True)

    # Pricing
    base_cost = Column(Numeric(10, 2), nullable=False)
    retail_price = Column(Numeric(10, 2), nullable=False)
    sale_price = Column(Numeric(10, 2), nullable=True)
    sale_start_date = Column(DateTime, nullable=True)
    sale_end_date = Column(DateTime, nullable=True)

    # Pricing Algorithm Settings
    min_margin_percent = Column(Numeric(5, 2), default=15.00, nullable=False)
    max_margin_percent = Column(Numeric(5, 2), default=40.00, nullable=False)
    price_rounding = Column(String(20), default="nearest_99", nullable=False)  # nearest_99, nearest_95, none
    competitor_match_enabled = Column(Boolean, default=True, nullable=False)

    # Physical Properties
    weight = Column(Numeric(10, 2), nullable=True)  # in pounds
    length = Column(Numeric(10, 2), nullable=True)  # in inches
    width = Column(Numeric(10, 2), nullable=True)
    height = Column(Numeric(10, 2), nullable=True)

    # Vehicle Compatibility (legacy, prefer product_fitment)
    year_start = Column(Integer, nullable=True)
    year_end = Column(Integer, nullable=True)
    make = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    submodel = Column(String(100), nullable=True)
    engine = Column(String(100), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_new = Column(Boolean, default=False, nullable=False)

    # SEO
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(Text, nullable=True)
    meta_keywords = Column(String(500), nullable=True)

    # Relationships
    brand = relationship("Brand", back_populates="products")
    categories = relationship("ProductCategory", back_populates="product", cascade="all, delete-orphan")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.display_order")
    attributes = relationship("ProductAttribute", back_populates="product", cascade="all, delete-orphan")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="product", uselist=False)
    suppliers = relationship("ProductSupplier", back_populates="product", cascade="all, delete-orphan")
    price_history = relationship("PriceHistory", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    fitments = relationship("ProductFitment", back_populates="product", cascade="all, delete-orphan")

    @property
    def current_price(self) -> float:
        """Get current selling price (sale price if active, otherwise retail)."""
        now = datetime.utcnow()
        if (self.sale_price and
            self.sale_start_date and self.sale_start_date <= now and
            self.sale_end_date and self.sale_end_date >= now):
            return float(self.sale_price)
        return float(self.retail_price)

    @property
    def is_on_sale(self) -> bool:
        """Check if product is currently on sale."""
        now = datetime.utcnow()
        return (self.sale_price is not None and
                self.sale_start_date and self.sale_start_date <= now and
                self.sale_end_date and self.sale_end_date >= now)

    @property
    def primary_image(self):
        """Get the primary product image."""
        for img in self.images:
            if img.is_primary:
                return img
        return self.images[0] if self.images else None

    @property
    def average_rating(self) -> float:
        """Calculate average rating from reviews."""
        approved_reviews = [r for r in self.reviews if r.is_approved]
        if not approved_reviews:
            return 0.0
        return sum(r.rating for r in approved_reviews) / len(approved_reviews)

    def __repr__(self):
        return f"<Product(id={self.id}, sku={self.sku}, name={self.name})>"


class ProductCategory(Base):
    """Association table between products and categories."""

    __tablename__ = "product_categories"

    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True)
    is_primary = Column(Boolean, default=False, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="categories")
    category = relationship("Category", back_populates="products")

    def __repr__(self):
        return f"<ProductCategory(product_id={self.product_id}, category_id={self.category_id})>"


class ProductImage(Base):
    """Product image model."""

    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    alt_text = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="images")

    def __repr__(self):
        return f"<ProductImage(id={self.id}, product_id={self.product_id})>"


class ProductAttribute(Base):
    """Product attribute model for specifications."""

    __tablename__ = "product_attributes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    attribute_name = Column(String(100), nullable=False)
    attribute_value = Column(String(255), nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="attributes")

    def __repr__(self):
        return f"<ProductAttribute(id={self.id}, name={self.attribute_name})>"


class ProductVariant(Base, TimestampMixin):
    """Product variant model for different options (size, color, etc.)."""

    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    variant_attributes = Column(JSON, nullable=True)  # {"color": "red", "size": "large"}
    price_adjustment = Column(Numeric(10, 2), default=0, nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="variants")
    inventory = relationship("Inventory", back_populates="variant", uselist=False)

    @property
    def effective_price(self) -> float:
        """Get effective price including adjustment."""
        base = float(self.product.current_price) if self.product else 0
        return base + float(self.price_adjustment or 0)

    def __repr__(self):
        return f"<ProductVariant(id={self.id}, sku={self.sku})>"
