"""
Cart API Endpoints
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.api.deps import get_db, get_current_user, get_session_id
from app.services.cart_service import CartService
from app.schemas.cart import CartResponse, CartItemAdd, CartItemUpdate
from app.models.user import User


router = APIRouter()


def get_or_create_session_id(request: Request, response: Response) -> str:
    """Get existing session ID or create new one."""
    session_id = get_session_id(request)
    if not session_id:
        session_id = str(uuid.uuid4())
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            samesite="lax",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
    return session_id


@router.get("", response_model=CartResponse)
async def get_cart(
    request: Request,
    response: Response,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current cart."""
    cart_service = CartService(db)

    user_id = current_user.id if current_user else None
    session_id = get_or_create_session_id(request, response) if not user_id else None

    cart = await cart_service.get_or_create_cart(user_id=user_id, session_id=session_id)
    return cart


@router.post("/items", response_model=CartResponse)
async def add_to_cart(
    item_data: CartItemAdd,
    request: Request,
    response: Response,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add item to cart."""
    cart_service = CartService(db)

    user_id = current_user.id if current_user else None
    session_id = get_or_create_session_id(request, response) if not user_id else None

    try:
        cart = await cart_service.add_item(
            user_id=user_id,
            session_id=session_id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            variant_id=item_data.variant_id
        )
        return cart
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: int,
    item_data: CartItemUpdate,
    request: Request,
    response: Response,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update cart item quantity."""
    cart_service = CartService(db)

    user_id = current_user.id if current_user else None
    session_id = get_session_id(request)

    try:
        cart = await cart_service.update_item_quantity(
            user_id=user_id,
            session_id=session_id,
            item_id=item_id,
            quantity=item_data.quantity
        )
        return cart
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_cart_item(
    item_id: int,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove item from cart."""
    cart_service = CartService(db)

    user_id = current_user.id if current_user else None
    session_id = get_session_id(request)

    try:
        cart = await cart_service.remove_item(
            user_id=user_id,
            session_id=session_id,
            item_id=item_id
        )
        return cart
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("", response_model=CartResponse)
async def clear_cart(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Clear all items from cart."""
    cart_service = CartService(db)

    user_id = current_user.id if current_user else None
    session_id = get_session_id(request)

    try:
        cart = await cart_service.clear_cart(
            user_id=user_id,
            session_id=session_id
        )
        return cart
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/coupon", response_model=CartResponse)
async def apply_coupon(
    coupon_code: str,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Apply coupon code to cart."""
    cart_service = CartService(db)

    user_id = current_user.id if current_user else None
    session_id = get_session_id(request)

    try:
        cart = await cart_service.apply_coupon(
            user_id=user_id,
            session_id=session_id,
            coupon_code=coupon_code
        )
        return cart
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/coupon", response_model=CartResponse)
async def remove_coupon(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove coupon from cart."""
    cart_service = CartService(db)

    user_id = current_user.id if current_user else None
    session_id = get_session_id(request)

    try:
        cart = await cart_service.remove_coupon(
            user_id=user_id,
            session_id=session_id
        )
        return cart
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/merge", response_model=CartResponse)
async def merge_carts(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Merge guest cart into user cart after login."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    session_id = get_session_id(request)
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No guest cart to merge"
        )

    cart_service = CartService(db)

    try:
        cart = await cart_service.merge_carts(
            user_id=current_user.id,
            session_id=session_id
        )

        # Clear session cookie after merge
        response.delete_cookie("session_id")

        return cart
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
