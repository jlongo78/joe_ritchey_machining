"""
Order API Endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db, get_current_user_required, get_current_active_user,
    get_staff_user, get_pagination, PaginationParams,
    get_client_ip, get_user_agent, get_session_id
)
from app.services.order_service import OrderService
from app.services.cart_service import CartService
from app.services.notification_service import NotificationService
from app.schemas.order import OrderCreate, OrderResponse, OrderDetailResponse
from app.schemas.common import PaginatedResponse
from app.core.permissions import Permission
from app.api.deps import require_permission
from app.models.user import User


router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def list_orders(
    pagination: PaginationParams = Depends(get_pagination),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's orders."""
    order_service = OrderService(db)

    orders, total = await order_service.get_user_orders(
        user_id=current_user.id,
        skip=pagination.skip,
        limit=pagination.limit,
        status=status_filter
    )

    return {
        "items": orders,
        "total": total,
        "skip": pagination.skip,
        "limit": pagination.limit
    }


@router.get("/admin", response_model=PaginatedResponse)
async def list_all_orders(
    pagination: PaginationParams = Depends(get_pagination),
    status_filter: Optional[str] = Query(None, alias="status"),
    payment_status: Optional[str] = Query(None),
    current_user: User = Depends(require_permission(Permission.VIEW_ALL_ORDERS)),
    db: AsyncSession = Depends(get_db)
):
    """List all orders (admin only)."""
    order_service = OrderService(db)

    orders, total = await order_service.get_all_orders(
        skip=pagination.skip,
        limit=pagination.limit,
        status=status_filter,
        payment_status=payment_status
    )

    return {
        "items": orders,
        "total": total,
        "skip": pagination.skip,
        "limit": pagination.limit
    }


@router.get("/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get order details."""
    order_service = OrderService(db)
    order = await order_service.get_by_id(order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Check ownership or admin access
    if order.user_id != current_user.id and current_user.role not in ["admin", "owner", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return order


@router.get("/number/{order_number}", response_model=OrderDetailResponse)
async def get_order_by_number(
    order_number: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get order by order number."""
    order_service = OrderService(db)
    order = await order_service.get_by_number(order_number)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Check ownership or admin access
    if order.user_id != current_user.id and current_user.role not in ["admin", "owner", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return order


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create order from cart (checkout)."""
    # Get user's cart
    cart_service = CartService(db)
    cart = await cart_service.get_cart(user_id=current_user.id)

    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty"
        )

    # Create order
    order_service = OrderService(db)

    try:
        order = await order_service.create_from_cart(
            user_id=current_user.id,
            cart=cart,
            order_data=order_data,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )

        # Send confirmation email
        notification_service = NotificationService(db)
        await notification_service.send_order_confirmation(
            order_id=order.id,
            email=current_user.email,
            order_number=order.order_number,
            total=float(order.total),
            items=[{"name": item.name, "quantity": item.quantity} for item in order.items]
        )

        return order

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    new_status: str,
    notes: Optional[str] = None,
    current_user: User = Depends(require_permission(Permission.MANAGE_ORDERS)),
    db: AsyncSession = Depends(get_db)
):
    """Update order status (admin only)."""
    order_service = OrderService(db)

    try:
        order = await order_service.update_status(
            order_id=order_id,
            new_status=new_status,
            notes=notes,
            user_id=current_user.id
        )
        return {"message": f"Order status updated to {new_status}", "order_id": order.id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{order_id}/tracking")
async def update_tracking(
    order_id: int,
    carrier: str,
    tracking_number: str,
    current_user: User = Depends(require_permission(Permission.MANAGE_ORDERS)),
    db: AsyncSession = Depends(get_db)
):
    """Update shipping tracking information (admin only)."""
    order_service = OrderService(db)

    try:
        order = await order_service.update_tracking(
            order_id=order_id,
            carrier=carrier,
            tracking_number=tracking_number
        )

        # Notify customer
        if order.status != "shipped":
            await order_service.update_status(order_id, "shipped", "Order shipped with tracking")

        return {
            "message": "Tracking updated",
            "carrier": carrier,
            "tracking_number": tracking_number
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel an order."""
    order_service = OrderService(db)
    order = await order_service.get_by_id(order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Check ownership or admin access
    if order.user_id != current_user.id and current_user.role not in ["admin", "owner", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        order = await order_service.cancel_order(
            order_id=order_id,
            reason=reason,
            user_id=current_user.id
        )
        return {"message": "Order cancelled", "order_id": order.id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
