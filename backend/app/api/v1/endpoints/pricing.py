"""
Pricing API Endpoints - Automated pricing engine
"""

from typing import Optional, List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.services.pricing_service import PricingService
from app.schemas.pricing import (
    PriceAdjustmentRuleCreate, PriceAdjustmentRuleResponse,
    BulkPriceUpdate, SupplierSyncResult, MarginAnalysis
)
from app.core.permissions import Permission
from app.api.deps import require_permission
from app.models.user import User


router = APIRouter()


# Supplier Price Syncing

@router.post("/suppliers/{supplier_id}/sync")
async def sync_supplier_prices(
    supplier_id: int,
    current_user: User = Depends(require_permission(Permission.MANAGE_PRICING)),
    db: AsyncSession = Depends(get_db)
):
    """Sync prices from a supplier."""
    pricing_service = PricingService(db)

    try:
        result = await pricing_service.sync_supplier_prices(supplier_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    finally:
        await pricing_service.close()


@router.post("/suppliers/{supplier_id}/fetch")
async def fetch_supplier_prices(
    supplier_id: int,
    current_user: User = Depends(require_permission(Permission.MANAGE_PRICING)),
    db: AsyncSession = Depends(get_db)
):
    """Fetch prices from a supplier (preview only, no updates)."""
    pricing_service = PricingService(db)

    try:
        result = await pricing_service.fetch_supplier_prices(supplier_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    finally:
        await pricing_service.close()


@router.post("/suppliers/{supplier_id}/schedule")
async def schedule_price_sync(
    supplier_id: int,
    interval_hours: int = Query(24, ge=1, le=168),
    current_user: User = Depends(require_permission(Permission.MANAGE_PRICING)),
    db: AsyncSession = Depends(get_db)
):
    """Schedule periodic price synchronization for a supplier."""
    pricing_service = PricingService(db)

    try:
        result = await pricing_service.schedule_price_sync(supplier_id, interval_hours)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    finally:
        await pricing_service.close()


@router.get("/suppliers/due-for-sync")
async def get_suppliers_due_for_sync(
    current_user: User = Depends(require_permission(Permission.VIEW_PRICING)),
    db: AsyncSession = Depends(get_db)
):
    """Get suppliers that need price synchronization."""
    pricing_service = PricingService(db)

    try:
        suppliers = await pricing_service.get_suppliers_due_for_sync()
        return {"suppliers": suppliers, "count": len(suppliers)}
    finally:
        await pricing_service.close()


# Price Adjustment Rules

@router.get("/rules")
async def list_adjustment_rules(
    product_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    is_active: bool = Query(True),
    current_user: User = Depends(require_permission(Permission.VIEW_PRICING)),
    db: AsyncSession = Depends(get_db)
):
    """List price adjustment rules."""
    pricing_service = PricingService(db)

    try:
        rules = await pricing_service.get_adjustment_rules(
            product_id=product_id,
            category_id=category_id,
            is_active=is_active
        )
        return {"rules": rules}
    finally:
        await pricing_service.close()


@router.post("/rules")
async def create_adjustment_rule(
    rule_data: PriceAdjustmentRuleCreate,
    current_user: User = Depends(require_permission(Permission.MANAGE_PRICING)),
    db: AsyncSession = Depends(get_db)
):
    """Create a price adjustment rule."""
    pricing_service = PricingService(db)

    try:
        rule = await pricing_service.create_adjustment_rule(
            rule_type=rule_data.rule_type,
            adjustment_type=rule_data.adjustment_type,
            adjustment_value=rule_data.adjustment_value,
            name=rule_data.name,
            product_id=rule_data.product_id,
            category_id=rule_data.category_id,
            brand_id=rule_data.brand_id,
            min_margin=rule_data.min_margin,
            max_margin=rule_data.max_margin,
            priority=rule_data.priority,
            user_id=current_user.id
        )
        return rule
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    finally:
        await pricing_service.close()


@router.post("/rules/{rule_id}/apply/{product_id}")
async def apply_rule_to_product(
    rule_id: int,
    product_id: int,
    base_cost: Optional[Decimal] = None,
    current_user: User = Depends(require_permission(Permission.MANAGE_PRICING)),
    db: AsyncSession = Depends(get_db)
):
    """Apply a pricing rule to a specific product."""
    pricing_service = PricingService(db)

    try:
        product = await pricing_service.apply_adjustment_rule(
            product_id=product_id,
            rule_id=rule_id,
            base_cost=base_cost
        )
        return {
            "message": "Rule applied",
            "product_id": product.id,
            "new_price": float(product.retail_price) if product.retail_price else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    finally:
        await pricing_service.close()


# Bulk Price Updates

@router.post("/bulk-update")
async def bulk_update_prices(
    update_data: BulkPriceUpdate,
    current_user: User = Depends(require_permission(Permission.MANAGE_PRICING)),
    db: AsyncSession = Depends(get_db)
):
    """Bulk update prices for multiple products."""
    pricing_service = PricingService(db)

    try:
        result = await pricing_service.bulk_price_update(
            product_ids=update_data.product_ids,
            adjustment_type=update_data.adjustment_type,
            adjustment_value=update_data.adjustment_value,
            user_id=current_user.id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    finally:
        await pricing_service.close()


# Price History and Analysis

@router.get("/history/{product_id}")
async def get_price_history(
    product_id: int,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_permission(Permission.VIEW_PRICING)),
    db: AsyncSession = Depends(get_db)
):
    """Get price history for a product."""
    pricing_service = PricingService(db)

    try:
        history = await pricing_service.get_price_history(product_id, days)
        return {"history": history, "count": len(history)}
    finally:
        await pricing_service.close()


@router.get("/margin-analysis")
async def get_margin_analysis(
    product_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    current_user: User = Depends(require_permission(Permission.VIEW_PRICING)),
    db: AsyncSession = Depends(get_db)
):
    """Get margin analysis for products."""
    pricing_service = PricingService(db)

    try:
        analysis = await pricing_service.get_margin_analysis(
            product_id=product_id,
            category_id=category_id
        )
        return analysis
    finally:
        await pricing_service.close()


# Competitor Monitoring

@router.post("/competitors/{competitor_id}/fetch")
async def fetch_competitor_prices(
    competitor_id: int,
    current_user: User = Depends(require_permission(Permission.MANAGE_PRICING)),
    db: AsyncSession = Depends(get_db)
):
    """Fetch prices from a competitor."""
    pricing_service = PricingService(db)

    try:
        result = await pricing_service.fetch_competitor_prices(competitor_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    finally:
        await pricing_service.close()
