"""
Product API Endpoints
"""

from typing import Optional, List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db, get_current_user, get_current_active_user,
    get_staff_user, get_pagination, PaginationParams
)
from app.services.product_service import ProductService
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    ProductDetailResponse
)
from app.schemas.common import PaginatedResponse
from app.core.permissions import Permission
from app.api.deps import require_permission
from app.models.user import User


router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def list_products(
    pagination: PaginationParams = Depends(get_pagination),
    search: Optional[str] = Query(None, description="Search by name, SKU, or description"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    brand_id: Optional[int] = Query(None, description="Filter by brand"),
    min_price: Optional[Decimal] = Query(None, description="Minimum price"),
    max_price: Optional[Decimal] = Query(None, description="Maximum price"),
    in_stock: Optional[bool] = Query(None, description="Filter by stock availability"),
    is_featured: Optional[bool] = Query(None, description="Filter featured products"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    db: AsyncSession = Depends(get_db)
):
    """List products with filtering and pagination."""
    product_service = ProductService(db)

    products, total = await product_service.get_all(
        skip=pagination.skip,
        limit=pagination.limit,
        search=search,
        category_id=category_id,
        brand_id=brand_id,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock,
        is_featured=is_featured,
        sort_by=sort_by,
        sort_order=sort_order
    )

    return {
        "items": products,
        "total": total,
        "skip": pagination.skip,
        "limit": pagination.limit
    }


@router.get("/featured", response_model=List[ProductResponse])
async def get_featured_products(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Get featured products."""
    product_service = ProductService(db)
    return await product_service.get_featured_products(limit)


@router.get("/new", response_model=List[ProductResponse])
async def get_new_products(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Get new products."""
    product_service = ProductService(db)
    return await product_service.get_new_products(limit)


@router.get("/category/{category_id}", response_model=PaginatedResponse)
async def get_products_by_category(
    category_id: int,
    pagination: PaginationParams = Depends(get_pagination),
    db: AsyncSession = Depends(get_db)
):
    """Get products in a category."""
    product_service = ProductService(db)

    products, total = await product_service.get_products_by_category(
        category_id=category_id,
        skip=pagination.skip,
        limit=pagination.limit
    )

    return {
        "items": products,
        "total": total,
        "skip": pagination.skip,
        "limit": pagination.limit
    }


@router.get("/sku/{sku}", response_model=ProductDetailResponse)
async def get_product_by_sku(
    sku: str,
    db: AsyncSession = Depends(get_db)
):
    """Get product by SKU."""
    product_service = ProductService(db)
    product = await product_service.get_by_sku(sku)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return product


@router.get("/slug/{slug}", response_model=ProductDetailResponse)
async def get_product_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Get product by URL slug."""
    product_service = ProductService(db)
    product = await product_service.get_by_slug(slug)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return product


@router.get("/{product_id}", response_model=ProductDetailResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get product by ID."""
    product_service = ProductService(db)
    product = await product_service.get_by_id(product_id)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return product


# Admin endpoints

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new product (admin only)."""
    product_service = ProductService(db)

    try:
        product = await product_service.create(product_data)
        return product
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db)
):
    """Update a product (admin only)."""
    product_service = ProductService(db)

    try:
        product = await product_service.update(product_id, product_data)
        return product
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    current_user: User = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db)
):
    """Delete (deactivate) a product (admin only)."""
    product_service = ProductService(db)

    try:
        await product_service.delete(product_id)
        return {"message": "Product deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{product_id}/price")
async def update_product_price(
    product_id: int,
    cost: Optional[Decimal] = None,
    price: Optional[Decimal] = None,
    current_user: User = Depends(require_permission(Permission.MANAGE_PRODUCTS)),
    db: AsyncSession = Depends(get_db)
):
    """Update product pricing (admin only)."""
    product_service = ProductService(db)

    try:
        product = await product_service.update_price(
            product_id,
            new_cost=cost,
            new_retail_price=price
        )
        return {
            "message": "Price updated",
            "cost": float(product.base_cost) if product.base_cost else None,
            "price": float(product.retail_price) if product.retail_price else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
