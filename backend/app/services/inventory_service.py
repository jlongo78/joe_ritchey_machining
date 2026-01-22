"""
Inventory Service - Business logic for inventory management
"""

from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventory import Inventory, InventoryTransaction, InventoryCategory
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryAdjustment
from app.core.exceptions import NotFoundError, BusinessLogicError


class InventoryService:
    """Service class for inventory operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, item_id: int) -> Optional[Inventory]:
        """Get inventory item by ID."""
        result = await self.db.execute(
            select(Inventory).where(Inventory.id == item_id)
        )
        return result.scalar_one_or_none()

    async def get_by_sku(self, sku: str) -> Optional[Inventory]:
        """Get inventory item by SKU."""
        result = await self.db.execute(
            select(Inventory).where(Inventory.sku == sku)
        )
        return result.scalar_one_or_none()

    async def get_by_product_id(self, product_id: int) -> Optional[Inventory]:
        """Get inventory for a product."""
        result = await self.db.execute(
            select(Inventory).where(Inventory.product_id == product_id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        low_stock_only: bool = False,
        is_active: bool = True
    ) -> tuple[List[Inventory], int]:
        """Get all inventory items with filters."""
        query = select(Inventory).where(Inventory.is_active == is_active)

        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Inventory.sku.ilike(search_term),
                    Inventory.name.ilike(search_term),
                    Inventory.part_number.ilike(search_term)
                )
            )

        if category_id:
            query = query.where(Inventory.category_id == category_id)

        if low_stock_only:
            query = query.where(
                Inventory.quantity_on_hand - Inventory.quantity_reserved <= Inventory.reorder_point
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        query = query.offset(skip).limit(limit).order_by(Inventory.name)
        result = await self.db.execute(query)
        items = result.scalars().all()

        return list(items), total_count

    async def get_low_stock_items(self, limit: int = 50) -> List[Inventory]:
        """Get items at or below reorder point."""
        result = await self.db.execute(
            select(Inventory)
            .where(
                Inventory.is_active == True,
                Inventory.track_inventory == True,
                Inventory.quantity_on_hand - Inventory.quantity_reserved <= Inventory.reorder_point
            )
            .order_by((Inventory.quantity_on_hand - Inventory.quantity_reserved).asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, item_data: InventoryCreate) -> Inventory:
        """Create a new inventory item."""
        item = Inventory(**item_data.model_dump())
        self.db.add(item)
        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def update(self, item_id: int, item_data: InventoryUpdate) -> Inventory:
        """Update an inventory item."""
        item = await self.get_by_id(item_id)
        if not item:
            raise NotFoundError("Inventory item")

        update_data = item_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)

        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def adjust_quantity(
        self,
        item_id: int,
        adjustment: InventoryAdjustment,
        user_id: Optional[int] = None
    ) -> Inventory:
        """Adjust inventory quantity."""
        item = await self.get_by_id(item_id)
        if not item:
            raise NotFoundError("Inventory item")

        old_quantity = item.quantity_on_hand

        if adjustment.adjustment_type == "count":
            # Set to specific quantity
            item.quantity_on_hand = adjustment.quantity
            item.last_counted_at = datetime.utcnow()
            change = adjustment.quantity - old_quantity
        elif adjustment.adjustment_type == "add":
            item.quantity_on_hand += adjustment.quantity
            change = adjustment.quantity
        elif adjustment.adjustment_type == "remove":
            if item.quantity_available < adjustment.quantity:
                raise BusinessLogicError(
                    f"Cannot remove {adjustment.quantity} items. Only {item.quantity_available} available."
                )
            item.quantity_on_hand -= adjustment.quantity
            change = -adjustment.quantity
        elif adjustment.adjustment_type in ["damage", "loss"]:
            if item.quantity_on_hand < adjustment.quantity:
                raise BusinessLogicError(
                    f"Cannot record {adjustment.quantity} as {adjustment.adjustment_type}. "
                    f"Only {item.quantity_on_hand} on hand."
                )
            item.quantity_on_hand -= adjustment.quantity
            change = -adjustment.quantity
        else:
            raise BusinessLogicError(f"Invalid adjustment type: {adjustment.adjustment_type}")

        # Record transaction
        transaction = InventoryTransaction(
            item_id=item_id,
            product_id=item.product_id,
            transaction_type="adjustment",
            quantity=change,
            notes=f"{adjustment.adjustment_type}: {adjustment.reason or adjustment.notes or 'Manual adjustment'}",
            performed_by=user_id
        )
        self.db.add(transaction)

        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def receive_stock(
        self,
        item_id: int,
        quantity: int,
        unit_cost: Optional[Decimal] = None,
        reference_type: Optional[str] = None,
        reference_id: Optional[int] = None,
        notes: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Inventory:
        """Receive stock (e.g., from purchase order)."""
        item = await self.get_by_id(item_id)
        if not item:
            raise NotFoundError("Inventory item")

        item.quantity_on_hand += quantity

        # Update cost if provided
        if unit_cost is not None:
            item.cost_price = unit_cost

        # Record transaction
        transaction = InventoryTransaction(
            item_id=item_id,
            product_id=item.product_id,
            transaction_type="received",
            quantity=quantity,
            reference_type=reference_type,
            reference_id=reference_id,
            unit_cost=unit_cost,
            total_cost=float(unit_cost) * quantity if unit_cost else None,
            notes=notes,
            performed_by=user_id
        )
        self.db.add(transaction)

        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def use_stock(
        self,
        item_id: int,
        quantity: int,
        reference_type: Optional[str] = None,
        reference_id: Optional[int] = None,
        notes: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Inventory:
        """Use stock (e.g., for a job)."""
        item = await self.get_by_id(item_id)
        if not item:
            raise NotFoundError("Inventory item")

        if item.quantity_available < quantity:
            raise BusinessLogicError(
                f"Insufficient stock. Only {item.quantity_available} available."
            )

        item.quantity_on_hand -= quantity

        # Record transaction
        transaction = InventoryTransaction(
            item_id=item_id,
            product_id=item.product_id,
            transaction_type="used",
            quantity=-quantity,
            reference_type=reference_type,
            reference_id=reference_id,
            unit_cost=item.cost_price,
            notes=notes,
            performed_by=user_id
        )
        self.db.add(transaction)

        await self.db.flush()
        await self.db.refresh(item)
        return item

    async def get_transactions(
        self,
        item_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[InventoryTransaction]:
        """Get transaction history for an item."""
        result = await self.db.execute(
            select(InventoryTransaction)
            .where(InventoryTransaction.item_id == item_id)
            .order_by(InventoryTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_total_inventory_value(self) -> Decimal:
        """Calculate total inventory value."""
        result = await self.db.execute(
            select(
                func.sum(Inventory.quantity_on_hand * Inventory.cost_price)
            ).where(
                Inventory.is_active == True,
                Inventory.cost_price.isnot(None)
            )
        )
        total = result.scalar()
        return Decimal(str(total)) if total else Decimal("0.00")

    # Category management

    async def get_categories(self) -> List[InventoryCategory]:
        """Get all inventory categories."""
        result = await self.db.execute(
            select(InventoryCategory)
            .where(InventoryCategory.is_active == True)
            .order_by(InventoryCategory.name)
        )
        return list(result.scalars().all())

    async def create_category(self, name: str, parent_id: Optional[int] = None) -> InventoryCategory:
        """Create an inventory category."""
        category = InventoryCategory(name=name, parent_id=parent_id)
        self.db.add(category)
        await self.db.flush()
        await self.db.refresh(category)
        return category
