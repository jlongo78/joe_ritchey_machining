"""
Order Service - Business logic for e-commerce order operations
"""

from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import random
import string
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.cart import Cart
from app.models.product import Product
from app.models.inventory import Inventory, InventoryTransaction
from app.models.coupon import Coupon, CouponUsage
from app.schemas.order import OrderCreate, OrderUpdate
from app.core.config import settings
from app.core.exceptions import (
    NotFoundError, BusinessLogicError, InsufficientStockError,
    InvalidStatusTransitionError
)


class OrderService:
    """Service class for order operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_order_number(self) -> str:
        """Generate a unique order number."""
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        chars = string.ascii_uppercase + string.digits
        random_part = "".join(random.choices(chars, k=6))
        return f"ORD-{timestamp}-{random_part}"

    async def get_by_id(self, order_id: int) -> Optional[Order]:
        """Get order by ID with items."""
        result = await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.payments),
                selectinload(Order.status_history)
            )
            .where(Order.id == order_id)
        )
        return result.scalar_one_or_none()

    async def get_by_number(self, order_number: str) -> Optional[Order]:
        """Get order by order number."""
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.order_number == order_number)
        )
        return result.scalar_one_or_none()

    async def get_user_orders(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None
    ) -> tuple[List[Order], int]:
        """Get orders for a user."""
        query = select(Order).where(Order.user_id == user_id)

        if status:
            query = query.where(Order.status == status)

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        query = query.options(
            selectinload(Order.items)
        ).offset(skip).limit(limit).order_by(Order.created_at.desc())

        result = await self.db.execute(query)
        orders = result.scalars().all()

        return list(orders), total_count

    async def get_all_orders(
        self,
        skip: int = 0,
        limit: int = 20,
        status: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> tuple[List[Order], int]:
        """Get all orders (admin)."""
        query = select(Order)

        if status:
            query = query.where(Order.status == status)
        if payment_status:
            query = query.where(Order.payment_status == payment_status)

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        query = query.options(
            selectinload(Order.items)
        ).offset(skip).limit(limit).order_by(Order.created_at.desc())

        result = await self.db.execute(query)
        orders = result.scalars().all()

        return list(orders), total_count

    async def create_from_cart(
        self,
        user_id: int,
        cart: Cart,
        order_data: OrderCreate,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Order:
        """Create an order from a cart."""
        if not cart.items:
            raise BusinessLogicError("Cart is empty")

        # Validate stock and reserve inventory
        for item in cart.items:
            result = await self.db.execute(
                select(Inventory).where(Inventory.product_id == item.product_id)
            )
            inventory = result.scalar_one_or_none()
            if inventory:
                if inventory.quantity_available < item.quantity:
                    product_name = item.product.name if item.product else f"Product #{item.product_id}"
                    raise InsufficientStockError(
                        product_name,
                        inventory.quantity_available,
                        item.quantity
                    )

        # Generate order number
        order_number = self._generate_order_number()
        while await self.get_by_number(order_number):
            order_number = self._generate_order_number()

        # Calculate tax based on shipping address
        tax_rate = Decimal(str(settings.TAX_RATE_DEFAULT))
        subtotal = cart.subtotal
        tax_amount = subtotal * tax_rate
        shipping_amount = Decimal("0.00")  # TODO: Calculate based on shipping method

        # Create order
        order = Order(
            order_number=order_number,
            user_id=user_id,
            status="pending",
            payment_status="pending",
            subtotal=subtotal,
            shipping_amount=shipping_amount,
            tax_amount=tax_amount,
            discount_amount=cart.discount_amount,
            total=subtotal + shipping_amount + tax_amount - cart.discount_amount,
            shipping_address=order_data.shipping_address,
            billing_address=order_data.billing_address,
            shipping_method=order_data.shipping_method,
            customer_notes=order_data.customer_notes,
            coupon_code=cart.coupon_code,
            ip_address=ip_address,
            user_agent=user_agent
        )
        self.db.add(order)
        await self.db.flush()

        # Create order items
        for cart_item in cart.items:
            product_result = await self.db.execute(
                select(Product).where(Product.id == cart_item.product_id)
            )
            product = product_result.scalar_one_or_none()

            order_item = OrderItem(
                order_id=order.id,
                product_id=cart_item.product_id,
                variant_id=cart_item.variant_id,
                sku=product.sku if product else "",
                name=product.name if product else "",
                quantity=cart_item.quantity,
                unit_price=cart_item.unit_price,
                total_price=cart_item.total_price,
                unit_cost=product.base_cost if product else None
            )
            self.db.add(order_item)

            # Reserve inventory
            inventory_result = await self.db.execute(
                select(Inventory).where(Inventory.product_id == cart_item.product_id)
            )
            inventory = inventory_result.scalar_one_or_none()
            if inventory:
                inventory.quantity_reserved += cart_item.quantity

        # Record coupon usage
        if cart.coupon_code:
            coupon_result = await self.db.execute(
                select(Coupon).where(Coupon.code == cart.coupon_code)
            )
            coupon = coupon_result.scalar_one_or_none()
            if coupon:
                coupon.times_used += 1
                usage = CouponUsage(
                    coupon_id=coupon.id,
                    user_id=user_id,
                    order_id=order.id,
                    discount_amount=cart.discount_amount
                )
                self.db.add(usage)

        # Add status history
        status_history = OrderStatusHistory(
            order_id=order.id,
            status="pending",
            notes="Order created"
        )
        self.db.add(status_history)

        # Mark cart as converted
        cart.status = "converted"

        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def update_status(
        self,
        order_id: int,
        new_status: str,
        notes: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Order:
        """Update order status."""
        order = await self.get_by_id(order_id)
        if not order:
            raise NotFoundError("Order")

        # Validate status transition
        valid_transitions = {
            "pending": ["confirmed", "cancelled"],
            "confirmed": ["processing", "cancelled"],
            "processing": ["shipped", "cancelled"],
            "shipped": ["delivered"],
            "delivered": ["refunded"],
            "cancelled": [],
            "refunded": []
        }

        if new_status not in valid_transitions.get(order.status, []):
            raise InvalidStatusTransitionError(order.status, new_status, "order")

        old_status = order.status
        order.status = new_status

        # Update timestamps
        if new_status == "shipped":
            order.shipped_at = datetime.utcnow()
        elif new_status == "delivered":
            order.delivered_at = datetime.utcnow()
        elif new_status == "cancelled":
            order.cancelled_at = datetime.utcnow()
            # Release reserved inventory
            await self._release_inventory(order)

        # Add status history
        status_history = OrderStatusHistory(
            order_id=order.id,
            status=new_status,
            notes=notes,
            created_by=user_id
        )
        self.db.add(status_history)

        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def update_payment_status(
        self,
        order_id: int,
        payment_status: str
    ) -> Order:
        """Update order payment status."""
        order = await self.get_by_id(order_id)
        if not order:
            raise NotFoundError("Order")

        order.payment_status = payment_status

        # If payment confirmed, move to confirmed status
        if payment_status == "paid" and order.status == "pending":
            await self.update_status(order_id, "confirmed", "Payment confirmed")
            # Deduct inventory
            await self._deduct_inventory(order)

        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def update_tracking(
        self,
        order_id: int,
        carrier: str,
        tracking_number: str
    ) -> Order:
        """Update shipping tracking information."""
        order = await self.get_by_id(order_id)
        if not order:
            raise NotFoundError("Order")

        order.shipping_carrier = carrier
        order.tracking_number = tracking_number

        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def cancel_order(
        self,
        order_id: int,
        reason: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Order:
        """Cancel an order."""
        order = await self.get_by_id(order_id)
        if not order:
            raise NotFoundError("Order")

        if not order.can_cancel:
            raise BusinessLogicError("This order cannot be cancelled")

        return await self.update_status(order_id, "cancelled", reason, user_id)

    async def _deduct_inventory(self, order: Order):
        """Deduct inventory for an order."""
        for item in order.items:
            inventory_result = await self.db.execute(
                select(Inventory).where(Inventory.product_id == item.product_id)
            )
            inventory = inventory_result.scalar_one_or_none()
            if inventory:
                inventory.quantity_on_hand -= item.quantity
                inventory.quantity_reserved -= item.quantity

                # Record transaction
                transaction = InventoryTransaction(
                    item_id=inventory.id,
                    product_id=item.product_id,
                    transaction_type="sale",
                    quantity=-item.quantity,
                    reference_type="order",
                    reference_id=order.id,
                    unit_cost=item.unit_cost
                )
                self.db.add(transaction)

    async def _release_inventory(self, order: Order):
        """Release reserved inventory for a cancelled order."""
        for item in order.items:
            inventory_result = await self.db.execute(
                select(Inventory).where(Inventory.product_id == item.product_id)
            )
            inventory = inventory_result.scalar_one_or_none()
            if inventory:
                inventory.quantity_reserved -= item.quantity
