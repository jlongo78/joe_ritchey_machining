"""
Quote Service - Business logic for machining service quotes
"""

from typing import Optional, List
from datetime import datetime, timedelta
from decimal import Decimal
import random
import string
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.quote import Quote, QuoteItem
from app.models.settings import TaxRate, LaborRate
from app.schemas.quote import QuoteCreate, QuoteUpdate, QuoteItemCreate
from app.core.config import settings
from app.core.exceptions import NotFoundError, BusinessLogicError, InvalidStatusTransitionError


class QuoteService:
    """Service class for quote operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_quote_number(self) -> str:
        """Generate a unique quote number."""
        timestamp = datetime.utcnow().strftime("%Y%m")
        chars = string.digits
        random_part = "".join(random.choices(chars, k=4))
        return f"Q-{timestamp}-{random_part}"

    async def get_by_id(self, quote_id: int) -> Optional[Quote]:
        """Get quote by ID with items."""
        result = await self.db.execute(
            select(Quote)
            .options(
                selectinload(Quote.items),
                selectinload(Quote.customer),
                selectinload(Quote.vehicle)
            )
            .where(Quote.id == quote_id)
        )
        return result.scalar_one_or_none()

    async def get_by_number(self, quote_number: str) -> Optional[Quote]:
        """Get quote by quote number."""
        result = await self.db.execute(
            select(Quote)
            .options(selectinload(Quote.items))
            .where(Quote.quote_number == quote_number)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        customer_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> tuple[List[Quote], int]:
        """Get all quotes with filters."""
        query = select(Quote)

        if customer_id:
            query = query.where(Quote.customer_id == customer_id)
        if status:
            query = query.where(Quote.status == status)

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        query = query.options(
            selectinload(Quote.customer),
            selectinload(Quote.vehicle),
            selectinload(Quote.items)
        ).offset(skip).limit(limit).order_by(Quote.created_at.desc())

        result = await self.db.execute(query)
        quotes = result.scalars().all()

        return list(quotes), total_count

    async def create(self, quote_data: QuoteCreate, user_id: int) -> Quote:
        """Create a new quote."""
        # Generate unique quote number
        quote_number = self._generate_quote_number()
        while await self.get_by_number(quote_number):
            quote_number = self._generate_quote_number()

        # Get default tax rate if not provided
        tax_rate = quote_data.tax_rate
        if tax_rate is None:
            tax_result = await self.db.execute(
                select(TaxRate).where(TaxRate.is_default == True, TaxRate.is_active == True)
            )
            default_tax = tax_result.scalar_one_or_none()
            tax_rate = default_tax.rate if default_tax else Decimal(str(settings.TAX_RATE_DEFAULT))

        # Set default validity
        valid_until = quote_data.valid_until
        if valid_until is None:
            valid_until = (datetime.utcnow() + timedelta(days=30)).date()

        # Create quote
        quote_dict = quote_data.model_dump(exclude={"items"})
        quote = Quote(
            quote_number=quote_number,
            status="draft",
            tax_rate=tax_rate,
            valid_until=valid_until,
            created_by=user_id,
            **quote_dict
        )
        self.db.add(quote)
        await self.db.flush()

        # Add items
        for i, item_data in enumerate(quote_data.items or []):
            item = QuoteItem(
                quote_id=quote.id,
                **item_data.model_dump(),
                display_order=item_data.display_order or i
            )
            item.calculate_total()
            self.db.add(item)
            quote.items.append(item)

        # Calculate totals
        quote.calculate_totals()

        await self.db.flush()
        await self.db.refresh(quote)
        return quote

    async def update(self, quote_id: int, quote_data: QuoteUpdate) -> Quote:
        """Update a quote."""
        quote = await self.get_by_id(quote_id)
        if not quote:
            raise NotFoundError("Quote")

        if quote.status not in ["draft", "sent"]:
            raise BusinessLogicError("Cannot modify a quote that has been approved or declined")

        update_data = quote_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(quote, field, value)

        quote.calculate_totals()

        await self.db.flush()
        await self.db.refresh(quote)
        return quote

    async def add_item(self, quote_id: int, item_data: QuoteItemCreate) -> Quote:
        """Add an item to a quote."""
        quote = await self.get_by_id(quote_id)
        if not quote:
            raise NotFoundError("Quote")

        if quote.status not in ["draft", "sent"]:
            raise BusinessLogicError("Cannot modify a quote that has been approved or declined")

        display_order = len(quote.items)
        item = QuoteItem(
            quote_id=quote_id,
            **item_data.model_dump(),
            display_order=item_data.display_order or display_order
        )
        item.calculate_total()
        self.db.add(item)

        quote.calculate_totals()

        await self.db.flush()
        await self.db.refresh(quote)
        return quote

    async def remove_item(self, quote_id: int, item_id: int) -> Quote:
        """Remove an item from a quote."""
        quote = await self.get_by_id(quote_id)
        if not quote:
            raise NotFoundError("Quote")

        if quote.status not in ["draft", "sent"]:
            raise BusinessLogicError("Cannot modify a quote that has been approved or declined")

        item = next((i for i in quote.items if i.id == item_id), None)
        if not item:
            raise NotFoundError("Quote item")

        await self.db.delete(item)
        quote.items = [i for i in quote.items if i.id != item_id]
        quote.calculate_totals()

        await self.db.flush()
        await self.db.refresh(quote)
        return quote

    async def send_quote(self, quote_id: int, user_id: int) -> Quote:
        """Mark quote as sent."""
        quote = await self.get_by_id(quote_id)
        if not quote:
            raise NotFoundError("Quote")

        if quote.status not in ["draft"]:
            raise BusinessLogicError("Quote has already been sent")

        if not quote.items:
            raise BusinessLogicError("Cannot send an empty quote")

        quote.status = "sent"
        quote.sent_at = datetime.utcnow()
        quote.sent_by = user_id

        await self.db.flush()
        await self.db.refresh(quote)
        return quote

    async def mark_viewed(self, quote_id: int) -> Quote:
        """Mark quote as viewed by customer."""
        quote = await self.get_by_id(quote_id)
        if not quote:
            raise NotFoundError("Quote")

        if quote.status == "sent" and not quote.viewed_at:
            quote.status = "viewed"
            quote.viewed_at = datetime.utcnow()
            await self.db.flush()
            await self.db.refresh(quote)

        return quote

    async def approve_quote(
        self,
        quote_id: int,
        approved_by_name: str,
        notes: Optional[str] = None
    ) -> Quote:
        """Approve a quote (customer action)."""
        quote = await self.get_by_id(quote_id)
        if not quote:
            raise NotFoundError("Quote")

        if not quote.can_be_approved:
            if quote.is_expired:
                raise BusinessLogicError("This quote has expired")
            raise BusinessLogicError("This quote cannot be approved")

        quote.status = "approved"
        quote.approved_at = datetime.utcnow()
        quote.approved_by_name = approved_by_name

        await self.db.flush()
        await self.db.refresh(quote)
        return quote

    async def decline_quote(
        self,
        quote_id: int,
        reason: Optional[str] = None
    ) -> Quote:
        """Decline a quote (customer action)."""
        quote = await self.get_by_id(quote_id)
        if not quote:
            raise NotFoundError("Quote")

        if quote.status not in ["sent", "viewed"]:
            raise BusinessLogicError("This quote cannot be declined")

        quote.status = "declined"
        quote.decline_reason = reason

        await self.db.flush()
        await self.db.refresh(quote)
        return quote

    async def convert_to_job(self, quote_id: int) -> int:
        """Convert an approved quote to a job. Returns job_id."""
        quote = await self.get_by_id(quote_id)
        if not quote:
            raise NotFoundError("Quote")

        if quote.status != "approved":
            raise BusinessLogicError("Only approved quotes can be converted to jobs")

        if quote.job_id:
            raise BusinessLogicError("This quote has already been converted to a job")

        # The actual job creation is done by JobService
        # This method marks the quote as converted
        quote.status = "converted"

        await self.db.flush()
        return quote.id

    async def get_pending_quotes(self, days_old: int = 7) -> List[Quote]:
        """Get pending quotes that need follow-up."""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        result = await self.db.execute(
            select(Quote)
            .where(
                Quote.status.in_(["sent", "viewed"]),
                Quote.sent_at <= cutoff_date
            )
            .order_by(Quote.sent_at.asc())
        )
        return list(result.scalars().all())

    async def get_default_labor_rate(self, service_type: Optional[str] = None) -> Decimal:
        """Get default labor rate."""
        query = select(LaborRate).where(LaborRate.is_active == True)

        if service_type:
            query = query.where(LaborRate.service_type == service_type)
        else:
            query = query.where(LaborRate.is_default == True)

        result = await self.db.execute(query)
        rate = result.scalar_one_or_none()

        return rate.rate if rate else Decimal(str(settings.LABOR_RATE_DEFAULT))
