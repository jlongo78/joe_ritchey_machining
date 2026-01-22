"""
Inventory API Endpoints
"""

from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db, get_current_active_user, get_staff_user,
    get_pagination, PaginationParams
)
from app.services.inventory_service import InventoryService
from app.schemas.inventory import (
    InventoryCreate, InventoryUpdate, InventoryResponse,
    InventoryAdjustment, StockReceive
)
from app.schemas.common import PaginatedResponse
from app.core.permissions import Permission
from app.api.deps import require_permission
from app.models.user import User


router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def list_inventory(
    pagination: PaginationParams = Depends(get_pagination),
    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    low_stock_only: bool = Query(False),
    is_active: bool = Query(True),
    current_user: User = Depends(require_permission(Permission.VIEW_INVENTORY)),
    db: AsyncSession = Depends(get_db)
):
    """List inventory items with filters."""
    inventory_service = InventoryService(db)

    items, total = await inventory_service.get_all(
        skip=pagination.skip,
        limit=pagination.limit,
        search=search,
        category_id=category_id,
        low_stock_only=low_stock_only,
        is_active=is_active
    )

    return {
        "items": items,
        "total": total,
        "skip": pagination.skip,
        "limit": pagination.limit
    }


@router.get("/low-stock")
async def get_low_stock_items(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_permission(Permission.VIEW_INVENTORY)),
    db: AsyncSession = Depends(get_db)
):
    """Get items at or below reorder point."""
    inventory_service = InventoryService(db)
    items = await inventory_service.get_low_stock_items(limit)
    return {"items": items, "count": len(items)}


@router.get("/total-value")
async def get_total_inventory_value(
    current_user: User = Depends(require_permission(Permission.VIEW_FINANCIALS)),
    db: AsyncSession = Depends(get_db)
):
    """Get total inventory value."""
    inventory_service = InventoryService(db)
    total = await inventory_service.get_total_inventory_value()
    return {"total_value": float(total)}


@router.get("/categories")
async def get_categories(
    current_user: User = Depends(require_permission(Permission.VIEW_INVENTORY)),
    db: AsyncSession = Depends(get_db)
):
    """Get inventory categories."""
    inventory_service = InventoryService(db)
    categories = await inventory_service.get_categories()
    return {"categories": categories}


@router.post("/categories")
async def create_category(
    name: str,
    parent_id: Optional[int] = None,
    current_user: User = Depends(require_permission(Permission.MANAGE_INVENTORY)),
    db: AsyncSession = Depends(get_db)
):
    """Create an inventory category."""
    inventory_service = InventoryService(db)
    category = await inventory_service.create_category(name, parent_id)
    return category


@router.get("/{item_id}", response_model=InventoryResponse)
async def get_inventory_item(
    item_id: int,
    current_user: User = Depends(require_permission(Permission.VIEW_INVENTORY)),
    db: AsyncSession = Depends(get_db)
):
    """Get inventory item details."""
    inventory_service = InventoryService(db)
    item = await inventory_service.get_by_id(item_id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )

    return item


@router.get("/sku/{sku}", response_model=InventoryResponse)
async def get_inventory_by_sku(
    sku: str,
    current_user: User = Depends(require_permission(Permission.VIEW_INVENTORY)),
    db: AsyncSession = Depends(get_db)
):
    """Get inventory item by SKU."""
    inventory_service = InventoryService(db)
    item = await inventory_service.get_by_sku(sku)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )

    return item


@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    item_data: InventoryCreate,
    current_user: User = Depends(require_permission(Permission.MANAGE_INVENTORY)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new inventory item."""
    inventory_service = InventoryService(db)

    try:
        item = await inventory_service.create(item_data)
        return item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{item_id}", response_model=InventoryResponse)
async def update_inventory_item(
    item_id: int,
    item_data: InventoryUpdate,
    current_user: User = Depends(require_permission(Permission.MANAGE_INVENTORY)),
    db: AsyncSession = Depends(get_db)
):
    """Update an inventory item."""
    inventory_service = InventoryService(db)

    try:
        item = await inventory_service.update(item_id, item_data)
        return item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{item_id}/adjust", response_model=InventoryResponse)
async def adjust_inventory(
    item_id: int,
    adjustment: InventoryAdjustment,
    current_user: User = Depends(require_permission(Permission.MANAGE_INVENTORY)),
    db: AsyncSession = Depends(get_db)
):
    """Adjust inventory quantity."""
    inventory_service = InventoryService(db)

    try:
        item = await inventory_service.adjust_quantity(
            item_id=item_id,
            adjustment=adjustment,
            user_id=current_user.id
        )
        return item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{item_id}/receive", response_model=InventoryResponse)
async def receive_stock(
    item_id: int,
    receive_data: StockReceive,
    current_user: User = Depends(require_permission(Permission.MANAGE_INVENTORY)),
    db: AsyncSession = Depends(get_db)
):
    """Receive stock (e.g., from purchase order)."""
    inventory_service = InventoryService(db)

    try:
        item = await inventory_service.receive_stock(
            item_id=item_id,
            quantity=receive_data.quantity,
            unit_cost=receive_data.unit_cost,
            reference_type=receive_data.reference_type,
            reference_id=receive_data.reference_id,
            notes=receive_data.notes,
            user_id=current_user.id
        )
        return item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{item_id}/transactions")
async def get_inventory_transactions(
    item_id: int,
    pagination: PaginationParams = Depends(get_pagination),
    current_user: User = Depends(require_permission(Permission.VIEW_INVENTORY)),
    db: AsyncSession = Depends(get_db)
):
    """Get transaction history for an inventory item."""
    inventory_service = InventoryService(db)

    transactions = await inventory_service.get_transactions(
        item_id=item_id,
        skip=pagination.skip,
        limit=pagination.limit
    )

    return {"transactions": transactions}
