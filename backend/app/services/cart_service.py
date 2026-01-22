"""
Cart Service - Business logic for shopping cart operations
"""

from typing import Optional
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductVariant
from app.models.inventory import Inventory
from app.models.coupon import Coupon
from app.core.exceptions import NotFoundError, BusinessLogicError, InsufficientStockError


class CartService:
    """Service class for cart operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_cart(
        self,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> Optional[Cart]:
        """Get user's cart or guest cart."""
        query = select(Cart).options(
            selectinload(Cart.items).selectinload(CartItem.product),
            selectinload(Cart.items).selectinload(CartItem.variant)
        )

        if user_id:
            query = query.where(Cart.user_id == user_id, Cart.status == "active")
        elif session_id:
            query = query.where(Cart.session_id == session_id, Cart.status == "active")
        else:
            return None

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_or_create_cart(
        self,
        user_id: Optional[int] = None,
        session_id: Optional[str] = None
    ) -> Cart:
        """Get existing cart or create a new one."""
        cart = await self.get_cart(user_id, session_id)

        if not cart:
            cart = Cart(
                user_id=user_id,
                session_id=session_id,
                status="active",
                subtotal=Decimal("0.00"),
                discount_amount=Decimal("0.00"),
                tax_amount=Decimal("0.00"),
                total=Decimal("0.00"),
            )
            cart.set_expiry(days=7)
            self.db.add(cart)
            await self.db.flush()
            await self.db.refresh(cart)

        return cart

    async def add_item(
        self,
        user_id: Optional[int],
        session_id: Optional[str],
        product_id: int,
        quantity: int = 1,
        variant_id: Optional[int] = None
    ) -> Cart:
        """Add an item to the cart."""
        cart = await self.get_or_create_cart(user_id, session_id)

        # Get product
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.inventory))
            .where(Product.id == product_id, Product.is_active == True)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise NotFoundError("Product")

        # Check stock
        if product.inventory:
            available = product.inventory.quantity_available
            if available < quantity:
                raise InsufficientStockError(product.name, available, quantity)

        # Get price
        unit_price = product.current_price
        if variant_id:
            variant_result = await self.db.execute(
                select(ProductVariant).where(ProductVariant.id == variant_id)
            )
            variant = variant_result.scalar_one_or_none()
            if variant:
                unit_price = variant.effective_price

        # Check if item already in cart
        existing_item = next(
            (item for item in cart.items
             if item.product_id == product_id and item.variant_id == variant_id),
            None
        )

        if existing_item:
            # Update quantity
            new_quantity = existing_item.quantity + quantity
            if product.inventory and product.inventory.quantity_available < new_quantity:
                raise InsufficientStockError(
                    product.name,
                    product.inventory.quantity_available,
                    new_quantity
                )
            existing_item.quantity = new_quantity
            existing_item.unit_price = Decimal(str(unit_price))
            existing_item.calculate_total()
        else:
            # Add new item
            cart_item = CartItem(
                cart_id=cart.id,
                product_id=product_id,
                variant_id=variant_id,
                quantity=quantity,
                unit_price=Decimal(str(unit_price)),
                total_price=Decimal(str(unit_price * quantity))
            )
            self.db.add(cart_item)
            cart.items.append(cart_item)

        # Recalculate cart totals
        await self._calculate_cart_totals(cart)

        await self.db.flush()
        await self.db.refresh(cart)
        return cart

    async def update_item_quantity(
        self,
        user_id: Optional[int],
        session_id: Optional[str],
        item_id: int,
        quantity: int
    ) -> Cart:
        """Update cart item quantity."""
        cart = await self.get_cart(user_id, session_id)
        if not cart:
            raise NotFoundError("Cart")

        # Find item
        item = next((i for i in cart.items if i.id == item_id), None)
        if not item:
            raise NotFoundError("Cart item")

        if quantity <= 0:
            # Remove item
            await self.db.delete(item)
            cart.items = [i for i in cart.items if i.id != item_id]
        else:
            # Check stock
            result = await self.db.execute(
                select(Inventory).where(Inventory.product_id == item.product_id)
            )
            inventory = result.scalar_one_or_none()
            if inventory and inventory.quantity_available < quantity:
                raise InsufficientStockError(
                    item.product.name if item.product else "Product",
                    inventory.quantity_available,
                    quantity
                )

            item.quantity = quantity
            item.calculate_total()

        # Recalculate cart totals
        await self._calculate_cart_totals(cart)

        await self.db.flush()
        await self.db.refresh(cart)
        return cart

    async def remove_item(
        self,
        user_id: Optional[int],
        session_id: Optional[str],
        item_id: int
    ) -> Cart:
        """Remove an item from the cart."""
        return await self.update_item_quantity(user_id, session_id, item_id, 0)

    async def clear_cart(
        self,
        user_id: Optional[int],
        session_id: Optional[str]
    ) -> Cart:
        """Clear all items from cart."""
        cart = await self.get_cart(user_id, session_id)
        if not cart:
            raise NotFoundError("Cart")

        # Delete all items
        await self.db.execute(
            delete(CartItem).where(CartItem.cart_id == cart.id)
        )
        cart.items = []

        # Reset totals
        cart.subtotal = Decimal("0.00")
        cart.discount_amount = Decimal("0.00")
        cart.tax_amount = Decimal("0.00")
        cart.total = Decimal("0.00")
        cart.coupon_code = None

        await self.db.flush()
        await self.db.refresh(cart)
        return cart

    async def apply_coupon(
        self,
        user_id: Optional[int],
        session_id: Optional[str],
        coupon_code: str
    ) -> Cart:
        """Apply a coupon to the cart."""
        cart = await self.get_cart(user_id, session_id)
        if not cart:
            raise NotFoundError("Cart")

        # Get coupon
        result = await self.db.execute(
            select(Coupon).where(Coupon.code == coupon_code.upper())
        )
        coupon = result.scalar_one_or_none()

        if not coupon:
            raise NotFoundError("Coupon")

        if not coupon.is_valid:
            raise BusinessLogicError("This coupon is no longer valid")

        if user_id and not coupon.can_be_used_by(user_id):
            raise BusinessLogicError("You have already used this coupon")

        # Calculate discount
        subtotal = float(cart.subtotal)
        discount = coupon.calculate_discount(subtotal)

        cart.coupon_code = coupon.code
        cart.discount_amount = Decimal(str(discount))

        # Recalculate total
        await self._calculate_cart_totals(cart)

        await self.db.flush()
        await self.db.refresh(cart)
        return cart

    async def remove_coupon(
        self,
        user_id: Optional[int],
        session_id: Optional[str]
    ) -> Cart:
        """Remove coupon from cart."""
        cart = await self.get_cart(user_id, session_id)
        if not cart:
            raise NotFoundError("Cart")

        cart.coupon_code = None
        cart.discount_amount = Decimal("0.00")

        await self._calculate_cart_totals(cart)

        await self.db.flush()
        await self.db.refresh(cart)
        return cart

    async def merge_carts(self, user_id: int, session_id: str) -> Cart:
        """Merge guest cart into user cart after login."""
        guest_cart = await self.get_cart(session_id=session_id)
        user_cart = await self.get_or_create_cart(user_id=user_id)

        if guest_cart and guest_cart.items:
            for item in guest_cart.items:
                # Check if item exists in user cart
                existing = next(
                    (i for i in user_cart.items
                     if i.product_id == item.product_id and i.variant_id == item.variant_id),
                    None
                )
                if existing:
                    existing.quantity += item.quantity
                    existing.calculate_total()
                else:
                    # Move item to user cart
                    item.cart_id = user_cart.id
                    user_cart.items.append(item)

            # Delete guest cart
            guest_cart.status = "converted"
            await self._calculate_cart_totals(user_cart)

        await self.db.flush()
        await self.db.refresh(user_cart)
        return user_cart

    async def _calculate_cart_totals(self, cart: Cart):
        """Calculate cart subtotal and total."""
        cart.subtotal = sum(Decimal(str(item.total_price)) for item in cart.items)

        # Keep existing discount if coupon applied
        if not cart.coupon_code:
            cart.discount_amount = Decimal("0.00")

        # Calculate total (tax would be calculated at checkout based on address)
        cart.total = cart.subtotal - cart.discount_amount + cart.tax_amount
