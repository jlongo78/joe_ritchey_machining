"""
Product Service - Business logic for product catalog operations
"""

from typing import Optional, List
from decimal import Decimal
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductImage, ProductAttribute, ProductVariant, ProductCategory
from app.models.category import Category
from app.models.brand import Brand
from app.models.inventory import Inventory
from app.schemas.product import ProductCreate, ProductUpdate
from app.core.exceptions import NotFoundError, DuplicateEntryError


class ProductService:
    """Service class for product operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, product_id: int) -> Optional[Product]:
        """Get product by ID with related data."""
        result = await self.db.execute(
            select(Product)
            .options(
                selectinload(Product.images),
                selectinload(Product.attributes),
                selectinload(Product.variants),
                selectinload(Product.categories).selectinload(ProductCategory.category),
                selectinload(Product.brand),
                selectinload(Product.inventory),
                selectinload(Product.reviews)
            )
            .where(Product.id == product_id)
        )
        return result.scalar_one_or_none()

    async def get_by_sku(self, sku: str) -> Optional[Product]:
        """Get product by SKU."""
        result = await self.db.execute(
            select(Product).where(Product.sku == sku)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[Product]:
        """Get product by slug."""
        result = await self.db.execute(
            select(Product)
            .options(
                selectinload(Product.images),
                selectinload(Product.attributes),
                selectinload(Product.variants),
                selectinload(Product.brand),
                selectinload(Product.reviews)
            )
            .where(Product.slug == slug, Product.is_active == True)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        brand_id: Optional[int] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        in_stock: Optional[bool] = None,
        is_active: Optional[bool] = True,
        is_featured: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[Product], int]:
        """Get all products with pagination, search, and filters."""
        query = select(Product).options(
            selectinload(Product.images),
            selectinload(Product.brand),
            selectinload(Product.inventory)
        )

        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Product.sku.ilike(search_term),
                    Product.name.ilike(search_term),
                    Product.short_description.ilike(search_term)
                )
            )

        if category_id:
            query = query.join(ProductCategory).where(ProductCategory.category_id == category_id)

        if brand_id:
            query = query.where(Product.brand_id == brand_id)

        if min_price is not None:
            query = query.where(Product.retail_price >= min_price)

        if max_price is not None:
            query = query.where(Product.retail_price <= max_price)

        if is_active is not None:
            query = query.where(Product.is_active == is_active)

        if is_featured is not None:
            query = query.where(Product.is_featured == is_featured)

        # Get total count
        count_query = select(func.count(func.distinct(Product.id))).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        # Apply sorting
        sort_column = getattr(Product, sort_by, Product.created_at)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Get paginated results
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        products = result.unique().scalars().all()

        # Filter by stock if needed (after loading)
        if in_stock is not None:
            products = [
                p for p in products
                if (p.inventory and p.inventory.quantity_available > 0) == in_stock
            ]

        return list(products), total_count

    async def create(self, product_data: ProductCreate) -> Product:
        """Create a new product."""
        # Check for duplicate SKU
        existing = await self.get_by_sku(product_data.sku)
        if existing:
            raise DuplicateEntryError("SKU", product_data.sku)

        # Check for duplicate slug
        slug_result = await self.db.execute(
            select(Product).where(Product.slug == product_data.slug)
        )
        if slug_result.scalar_one_or_none():
            raise DuplicateEntryError("slug", product_data.slug)

        # Extract nested data
        images_data = product_data.images or []
        attributes_data = product_data.attributes or []
        variants_data = product_data.variants or []
        category_ids = product_data.category_ids or []

        # Create product
        product_dict = product_data.model_dump(
            exclude={"images", "attributes", "variants", "category_ids"}
        )
        product = Product(**product_dict)
        self.db.add(product)
        await self.db.flush()

        # Add images
        for i, img_data in enumerate(images_data):
            image = ProductImage(
                product_id=product.id,
                **img_data.model_dump(),
                display_order=img_data.display_order or i
            )
            self.db.add(image)

        # Add attributes
        for i, attr_data in enumerate(attributes_data):
            attribute = ProductAttribute(
                product_id=product.id,
                **attr_data.model_dump(),
                display_order=attr_data.display_order or i
            )
            self.db.add(attribute)

        # Add variants
        for var_data in variants_data:
            variant = ProductVariant(
                product_id=product.id,
                **var_data.model_dump()
            )
            self.db.add(variant)

        # Add category associations
        for i, cat_id in enumerate(category_ids):
            assoc = ProductCategory(
                product_id=product.id,
                category_id=cat_id,
                is_primary=(i == 0)
            )
            self.db.add(assoc)

        # Create inventory record
        inventory = Inventory(
            product_id=product.id,
            quantity_on_hand=0,
            quantity_reserved=0
        )
        self.db.add(inventory)

        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def update(self, product_id: int, product_data: ProductUpdate) -> Product:
        """Update a product."""
        product = await self.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product")

        # Check for duplicate slug if changing
        if product_data.slug and product_data.slug != product.slug:
            slug_result = await self.db.execute(
                select(Product).where(
                    Product.slug == product_data.slug,
                    Product.id != product_id
                )
            )
            if slug_result.scalar_one_or_none():
                raise DuplicateEntryError("slug", product_data.slug)

        # Update fields
        update_data = product_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)

        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def delete(self, product_id: int) -> bool:
        """Soft delete a product."""
        product = await self.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product")

        product.is_active = False
        await self.db.flush()
        return True

    async def update_price(
        self,
        product_id: int,
        new_cost: Optional[Decimal] = None,
        new_retail_price: Optional[Decimal] = None
    ) -> Product:
        """Update product pricing."""
        product = await self.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product")

        if new_cost is not None:
            product.base_cost = new_cost
        if new_retail_price is not None:
            product.retail_price = new_retail_price

        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def get_featured_products(self, limit: int = 10) -> List[Product]:
        """Get featured products."""
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.images), selectinload(Product.brand))
            .where(Product.is_active == True, Product.is_featured == True)
            .order_by(Product.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_new_products(self, limit: int = 10) -> List[Product]:
        """Get new products."""
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.images), selectinload(Product.brand))
            .where(Product.is_active == True, Product.is_new == True)
            .order_by(Product.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_products_by_category(
        self,
        category_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[Product], int]:
        """Get products in a category (including subcategories)."""
        # Get category and all subcategory IDs
        category_ids = await self._get_category_tree_ids(category_id)

        query = select(Product).join(ProductCategory).where(
            ProductCategory.category_id.in_(category_ids),
            Product.is_active == True
        )

        count_query = select(func.count(func.distinct(Product.id))).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        query = query.options(
            selectinload(Product.images),
            selectinload(Product.brand)
        ).offset(skip).limit(limit)

        result = await self.db.execute(query)
        products = result.unique().scalars().all()

        return list(products), total_count

    async def _get_category_tree_ids(self, category_id: int) -> List[int]:
        """Get a category ID and all its descendant IDs."""
        ids = [category_id]

        # Get direct children
        result = await self.db.execute(
            select(Category.id).where(Category.parent_id == category_id)
        )
        children = result.scalars().all()

        for child_id in children:
            ids.extend(await self._get_category_tree_ids(child_id))

        return ids
