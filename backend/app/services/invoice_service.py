"""
Invoice Service - Business logic for invoice management
"""

from typing import Optional, List
from datetime import datetime, timedelta
from decimal import Decimal
import random
import string
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.invoice import Invoice, InvoiceItem
from app.models.job import Job
from app.models.order import Order
from app.models.payment import Payment
from app.models.settings import TaxRate
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceItemCreate
from app.core.config import settings
from app.core.exceptions import NotFoundError, BusinessLogicError


class InvoiceService:
    """Service class for invoice operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_invoice_number(self) -> str:
        """Generate a unique invoice number."""
        timestamp = datetime.utcnow().strftime("%Y%m")
        chars = string.digits
        random_part = "".join(random.choices(chars, k=4))
        return f"INV-{timestamp}-{random_part}"

    async def get_by_id(self, invoice_id: int) -> Optional[Invoice]:
        """Get invoice by ID with items."""
        result = await self.db.execute(
            select(Invoice)
            .options(
                selectinload(Invoice.items),
                selectinload(Invoice.payments),
                selectinload(Invoice.customer)
            )
            .where(Invoice.id == invoice_id)
        )
        return result.scalar_one_or_none()

    async def get_by_number(self, invoice_number: str) -> Optional[Invoice]:
        """Get invoice by invoice number."""
        result = await self.db.execute(
            select(Invoice)
            .options(selectinload(Invoice.items))
            .where(Invoice.invoice_number == invoice_number)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        customer_id: Optional[int] = None,
        status: Optional[str] = None,
        invoice_type: Optional[str] = None,
        overdue_only: bool = False
    ) -> tuple[List[Invoice], int]:
        """Get all invoices with filters."""
        query = select(Invoice)

        if customer_id:
            query = query.where(Invoice.customer_id == customer_id)
        if status:
            query = query.where(Invoice.status == status)
        if invoice_type:
            query = query.where(Invoice.invoice_type == invoice_type)
        if overdue_only:
            query = query.where(
                and_(
                    Invoice.due_date < datetime.utcnow(),
                    Invoice.status.in_(["sent", "viewed", "partial"])
                )
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        query = query.options(
            selectinload(Invoice.customer),
            selectinload(Invoice.items)
        ).offset(skip).limit(limit).order_by(Invoice.created_at.desc())

        result = await self.db.execute(query)
        invoices = result.scalars().all()

        return list(invoices), total_count

    async def create(self, invoice_data: InvoiceCreate, user_id: int) -> Invoice:
        """Create a new invoice."""
        # Generate unique invoice number
        invoice_number = self._generate_invoice_number()
        while await self.get_by_number(invoice_number):
            invoice_number = self._generate_invoice_number()

        # Get default tax rate if not provided
        tax_rate = invoice_data.tax_rate
        if tax_rate is None:
            tax_result = await self.db.execute(
                select(TaxRate).where(TaxRate.is_default == True, TaxRate.is_active == True)
            )
            default_tax = tax_result.scalar_one_or_none()
            tax_rate = default_tax.rate if default_tax else Decimal(str(settings.TAX_RATE_DEFAULT))

        # Set default due date (net 30)
        due_date = invoice_data.due_date
        if due_date is None:
            due_date = (datetime.utcnow() + timedelta(days=30)).date()

        # Create invoice
        invoice_dict = invoice_data.model_dump(exclude={"items"})
        invoice = Invoice(
            invoice_number=invoice_number,
            status="draft",
            tax_rate=tax_rate,
            due_date=due_date,
            created_by=user_id,
            **invoice_dict
        )
        self.db.add(invoice)
        await self.db.flush()

        # Add items
        for i, item_data in enumerate(invoice_data.items or []):
            item = InvoiceItem(
                invoice_id=invoice.id,
                **item_data.model_dump(),
                display_order=item_data.display_order or i
            )
            item.calculate_total()
            self.db.add(item)
            invoice.items.append(item)

        # Calculate totals
        invoice.calculate_totals()

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def create_from_job(self, job_id: int, user_id: int) -> Invoice:
        """Create an invoice from a completed job."""
        # Get job with all related data
        result = await self.db.execute(
            select(Job)
            .options(
                selectinload(Job.parts),
                selectinload(Job.labor_entries),
                selectinload(Job.tasks),
                selectinload(Job.customer)
            )
            .where(Job.id == job_id)
        )
        job = result.scalar_one_or_none()

        if not job:
            raise NotFoundError("Job")

        if job.status != "completed":
            raise BusinessLogicError("Only completed jobs can be invoiced")

        if job.invoice_id:
            raise BusinessLogicError("This job has already been invoiced")

        # Generate invoice number
        invoice_number = self._generate_invoice_number()
        while await self.get_by_number(invoice_number):
            invoice_number = self._generate_invoice_number()

        # Get default tax rate
        tax_result = await self.db.execute(
            select(TaxRate).where(TaxRate.is_default == True, TaxRate.is_active == True)
        )
        default_tax = tax_result.scalar_one_or_none()
        tax_rate = default_tax.rate if default_tax else Decimal(str(settings.TAX_RATE_DEFAULT))

        # Create invoice
        invoice = Invoice(
            invoice_number=invoice_number,
            invoice_type="job",
            customer_id=job.customer_id,
            job_id=job.id,
            status="draft",
            tax_rate=tax_rate,
            due_date=(datetime.utcnow() + timedelta(days=30)).date(),
            notes=f"Invoice for Job {job.job_number}: {job.title}",
            created_by=user_id
        )
        self.db.add(invoice)
        await self.db.flush()

        display_order = 0

        # Add labor items
        for labor in job.labor_entries:
            item = InvoiceItem(
                invoice_id=invoice.id,
                item_type="labor",
                description=labor.description or f"Labor - {labor.hours} hours",
                quantity=labor.hours,
                unit_price=labor.rate,
                display_order=display_order
            )
            item.calculate_total()
            self.db.add(item)
            invoice.items.append(item)
            display_order += 1

        # Add parts items
        for part in job.parts:
            item = InvoiceItem(
                invoice_id=invoice.id,
                item_type="part",
                product_id=part.product_id,
                description=part.name or part.part_number,
                quantity=Decimal(str(part.quantity)),
                unit_price=part.price,
                unit_cost=part.cost,
                display_order=display_order
            )
            item.calculate_total()
            self.db.add(item)
            invoice.items.append(item)
            display_order += 1

        # Calculate totals
        invoice.calculate_totals()

        # Update job
        job.invoice_id = invoice.id
        job.status = "invoiced"

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def create_from_order(self, order_id: int, user_id: int) -> Invoice:
        """Create an invoice from an order."""
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()

        if not order:
            raise NotFoundError("Order")

        if order.invoice_id:
            raise BusinessLogicError("This order has already been invoiced")

        # Generate invoice number
        invoice_number = self._generate_invoice_number()
        while await self.get_by_number(invoice_number):
            invoice_number = self._generate_invoice_number()

        # Create invoice
        invoice = Invoice(
            invoice_number=invoice_number,
            invoice_type="order",
            user_id=order.user_id,
            order_id=order.id,
            status="draft",
            subtotal=order.subtotal,
            tax_rate=Decimal(str(settings.TAX_RATE_DEFAULT)),
            tax_amount=order.tax_amount,
            shipping_amount=order.shipping_amount,
            discount_amount=order.discount_amount,
            total=order.total,
            due_date=datetime.utcnow().date(),  # Due immediately for orders
            notes=f"Invoice for Order {order.order_number}",
            created_by=user_id
        )
        self.db.add(invoice)
        await self.db.flush()

        # Add order items
        for i, order_item in enumerate(order.items):
            item = InvoiceItem(
                invoice_id=invoice.id,
                item_type="product",
                product_id=order_item.product_id,
                description=order_item.name,
                quantity=Decimal(str(order_item.quantity)),
                unit_price=order_item.unit_price,
                unit_cost=order_item.unit_cost,
                display_order=i
            )
            item.calculate_total()
            self.db.add(item)

        # Update order
        order.invoice_id = invoice.id

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def update(self, invoice_id: int, invoice_data: InvoiceUpdate) -> Invoice:
        """Update an invoice."""
        invoice = await self.get_by_id(invoice_id)
        if not invoice:
            raise NotFoundError("Invoice")

        if invoice.status not in ["draft"]:
            raise BusinessLogicError("Cannot modify an invoice that has been sent or paid")

        update_data = invoice_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(invoice, field, value)

        invoice.calculate_totals()

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def add_item(self, invoice_id: int, item_data: InvoiceItemCreate) -> Invoice:
        """Add an item to an invoice."""
        invoice = await self.get_by_id(invoice_id)
        if not invoice:
            raise NotFoundError("Invoice")

        if invoice.status not in ["draft"]:
            raise BusinessLogicError("Cannot modify an invoice that has been sent or paid")

        display_order = len(invoice.items)
        item = InvoiceItem(
            invoice_id=invoice_id,
            **item_data.model_dump(),
            display_order=item_data.display_order or display_order
        )
        item.calculate_total()
        self.db.add(item)

        invoice.calculate_totals()

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def remove_item(self, invoice_id: int, item_id: int) -> Invoice:
        """Remove an item from an invoice."""
        invoice = await self.get_by_id(invoice_id)
        if not invoice:
            raise NotFoundError("Invoice")

        if invoice.status not in ["draft"]:
            raise BusinessLogicError("Cannot modify an invoice that has been sent or paid")

        item = next((i for i in invoice.items if i.id == item_id), None)
        if not item:
            raise NotFoundError("Invoice item")

        await self.db.delete(item)
        invoice.items = [i for i in invoice.items if i.id != item_id]
        invoice.calculate_totals()

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def send_invoice(self, invoice_id: int, user_id: int) -> Invoice:
        """Mark invoice as sent."""
        invoice = await self.get_by_id(invoice_id)
        if not invoice:
            raise NotFoundError("Invoice")

        if invoice.status not in ["draft"]:
            raise BusinessLogicError("Invoice has already been sent")

        if not invoice.items:
            raise BusinessLogicError("Cannot send an empty invoice")

        invoice.status = "sent"
        invoice.sent_at = datetime.utcnow()
        invoice.sent_by = user_id

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def mark_viewed(self, invoice_id: int) -> Invoice:
        """Mark invoice as viewed by customer."""
        invoice = await self.get_by_id(invoice_id)
        if not invoice:
            raise NotFoundError("Invoice")

        if invoice.status == "sent" and not invoice.viewed_at:
            invoice.status = "viewed"
            invoice.viewed_at = datetime.utcnow()
            await self.db.flush()
            await self.db.refresh(invoice)

        return invoice

    async def record_payment(
        self,
        invoice_id: int,
        amount: Decimal,
        payment_method: str,
        reference: Optional[str] = None,
        notes: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Invoice:
        """Record a payment against an invoice."""
        invoice = await self.get_by_id(invoice_id)
        if not invoice:
            raise NotFoundError("Invoice")

        if invoice.status in ["paid", "cancelled", "draft"]:
            raise BusinessLogicError("Cannot record payment for this invoice")

        # Create payment record
        payment = Payment(
            invoice_id=invoice_id,
            customer_id=invoice.customer_id,
            user_id=invoice.user_id,
            amount=amount,
            payment_method=payment_method,
            payment_reference=reference,
            status="completed",
            notes=notes,
            processed_by=user_id
        )
        self.db.add(payment)

        # Update invoice paid amount
        invoice.amount_paid = (invoice.amount_paid or Decimal("0")) + amount

        # Update status
        if invoice.amount_paid >= invoice.total:
            invoice.status = "paid"
            invoice.paid_at = datetime.utcnow()

            # Update related job if exists
            if invoice.job_id:
                job_result = await self.db.execute(
                    select(Job).where(Job.id == invoice.job_id)
                )
                job = job_result.scalar_one_or_none()
                if job:
                    job.status = "paid"
        else:
            invoice.status = "partial"

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def void_invoice(
        self,
        invoice_id: int,
        reason: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Invoice:
        """Void an invoice."""
        invoice = await self.get_by_id(invoice_id)
        if not invoice:
            raise NotFoundError("Invoice")

        if invoice.status == "paid":
            raise BusinessLogicError("Cannot void a paid invoice. Create a credit note instead.")

        invoice.status = "cancelled"
        invoice.void_reason = reason
        invoice.voided_at = datetime.utcnow()
        invoice.voided_by = user_id

        await self.db.flush()
        await self.db.refresh(invoice)
        return invoice

    async def get_overdue_invoices(self, days_overdue: int = 0) -> List[Invoice]:
        """Get overdue invoices."""
        cutoff_date = datetime.utcnow() - timedelta(days=days_overdue)
        result = await self.db.execute(
            select(Invoice)
            .where(
                and_(
                    Invoice.due_date < cutoff_date,
                    Invoice.status.in_(["sent", "viewed", "partial"])
                )
            )
            .options(selectinload(Invoice.customer))
            .order_by(Invoice.due_date.asc())
        )
        return list(result.scalars().all())

    async def get_revenue_summary(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> dict:
        """Get revenue summary for a date range."""
        # Total invoiced
        invoiced_result = await self.db.execute(
            select(func.sum(Invoice.total))
            .where(
                and_(
                    Invoice.created_at >= start_date,
                    Invoice.created_at <= end_date,
                    Invoice.status != "cancelled"
                )
            )
        )
        total_invoiced = invoiced_result.scalar() or Decimal("0")

        # Total collected
        collected_result = await self.db.execute(
            select(func.sum(Invoice.amount_paid))
            .where(
                and_(
                    Invoice.created_at >= start_date,
                    Invoice.created_at <= end_date,
                    Invoice.status != "cancelled"
                )
            )
        )
        total_collected = collected_result.scalar() or Decimal("0")

        # Outstanding
        outstanding_result = await self.db.execute(
            select(func.sum(Invoice.total - Invoice.amount_paid))
            .where(
                Invoice.status.in_(["sent", "viewed", "partial"])
            )
        )
        total_outstanding = outstanding_result.scalar() or Decimal("0")

        # Invoice count by status
        status_counts = {}
        for status in ["draft", "sent", "viewed", "partial", "paid", "cancelled"]:
            count_result = await self.db.execute(
                select(func.count())
                .where(
                    and_(
                        Invoice.created_at >= start_date,
                        Invoice.created_at <= end_date,
                        Invoice.status == status
                    )
                )
            )
            status_counts[status] = count_result.scalar() or 0

        return {
            "total_invoiced": float(total_invoiced),
            "total_collected": float(total_collected),
            "total_outstanding": float(total_outstanding),
            "status_counts": status_counts,
            "collection_rate": float(total_collected / total_invoiced * 100) if total_invoiced > 0 else 0
        }
