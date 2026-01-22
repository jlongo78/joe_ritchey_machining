"""
Invoice API Endpoints
"""

from typing import Optional
from decimal import Decimal
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db, get_current_active_user, get_staff_user,
    get_pagination, PaginationParams
)
from app.services.invoice_service import InvoiceService
from app.services.notification_service import NotificationService
from app.schemas.invoice import (
    InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceDetailResponse,
    InvoiceItemCreate, PaymentRecord
)
from app.schemas.common import PaginatedResponse
from app.core.permissions import Permission
from app.api.deps import require_permission
from app.core.config import settings
from app.models.user import User


router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def list_invoices(
    pagination: PaginationParams = Depends(get_pagination),
    customer_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    invoice_type: Optional[str] = Query(None),
    overdue_only: bool = Query(False),
    current_user: User = Depends(require_permission(Permission.VIEW_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """List invoices with filters."""
    invoice_service = InvoiceService(db)

    invoices, total = await invoice_service.get_all(
        skip=pagination.skip,
        limit=pagination.limit,
        customer_id=customer_id,
        status=status_filter,
        invoice_type=invoice_type,
        overdue_only=overdue_only
    )

    return {
        "items": invoices,
        "total": total,
        "skip": pagination.skip,
        "limit": pagination.limit
    }


@router.get("/overdue")
async def get_overdue_invoices(
    days_overdue: int = Query(0, ge=0),
    current_user: User = Depends(require_permission(Permission.VIEW_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """Get overdue invoices."""
    invoice_service = InvoiceService(db)
    invoices = await invoice_service.get_overdue_invoices(days_overdue)
    return {"invoices": invoices, "count": len(invoices)}


@router.get("/revenue-summary")
async def get_revenue_summary(
    start_date: datetime,
    end_date: datetime,
    current_user: User = Depends(require_permission(Permission.VIEW_FINANCIALS)),
    db: AsyncSession = Depends(get_db)
):
    """Get revenue summary for a date range."""
    invoice_service = InvoiceService(db)
    summary = await invoice_service.get_revenue_summary(start_date, end_date)
    return summary


@router.get("/{invoice_id}", response_model=InvoiceDetailResponse)
async def get_invoice(
    invoice_id: int,
    current_user: User = Depends(require_permission(Permission.VIEW_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """Get invoice details."""
    invoice_service = InvoiceService(db)
    invoice = await invoice_service.get_by_id(invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    return invoice


@router.get("/number/{invoice_number}", response_model=InvoiceDetailResponse)
async def get_invoice_by_number(
    invoice_number: str,
    db: AsyncSession = Depends(get_db)
):
    """Get invoice by invoice number (public for customer viewing)."""
    invoice_service = InvoiceService(db)
    invoice = await invoice_service.get_by_number(invoice_number)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    # Mark as viewed
    await invoice_service.mark_viewed(invoice.id)

    return invoice


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice_data: InvoiceCreate,
    current_user: User = Depends(require_permission(Permission.CREATE_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new invoice."""
    invoice_service = InvoiceService(db)

    try:
        invoice = await invoice_service.create(invoice_data, user_id=current_user.id)
        return invoice
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/from-job/{job_id}", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice_from_job(
    job_id: int,
    current_user: User = Depends(require_permission(Permission.CREATE_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """Create an invoice from a completed job."""
    invoice_service = InvoiceService(db)

    try:
        invoice = await invoice_service.create_from_job(job_id, user_id=current_user.id)
        return invoice
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/from-order/{order_id}", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice_from_order(
    order_id: int,
    current_user: User = Depends(require_permission(Permission.CREATE_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """Create an invoice from an order."""
    invoice_service = InvoiceService(db)

    try:
        invoice = await invoice_service.create_from_order(order_id, user_id=current_user.id)
        return invoice
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: int,
    invoice_data: InvoiceUpdate,
    current_user: User = Depends(require_permission(Permission.CREATE_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """Update an invoice."""
    invoice_service = InvoiceService(db)

    try:
        invoice = await invoice_service.update(invoice_id, invoice_data)
        return invoice
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{invoice_id}/items", response_model=InvoiceResponse)
async def add_invoice_item(
    invoice_id: int,
    item_data: InvoiceItemCreate,
    current_user: User = Depends(require_permission(Permission.CREATE_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """Add item to an invoice."""
    invoice_service = InvoiceService(db)

    try:
        invoice = await invoice_service.add_item(invoice_id, item_data)
        return invoice
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{invoice_id}/items/{item_id}", response_model=InvoiceResponse)
async def remove_invoice_item(
    invoice_id: int,
    item_id: int,
    current_user: User = Depends(require_permission(Permission.CREATE_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """Remove item from an invoice."""
    invoice_service = InvoiceService(db)

    try:
        invoice = await invoice_service.remove_item(invoice_id, item_id)
        return invoice
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{invoice_id}/send", response_model=InvoiceResponse)
async def send_invoice(
    invoice_id: int,
    current_user: User = Depends(require_permission(Permission.CREATE_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """Send invoice to customer."""
    invoice_service = InvoiceService(db)

    try:
        invoice = await invoice_service.send_invoice(invoice_id, user_id=current_user.id)

        # Send notification
        if invoice.customer and invoice.customer.email:
            notification_service = NotificationService(db)
            invoice_url = f"{settings.FRONTEND_URL}/invoices/{invoice.invoice_number}"
            await notification_service.send_invoice_notification(
                invoice_id=invoice.id,
                email=invoice.customer.email,
                invoice_number=invoice.invoice_number,
                customer_name=invoice.customer.display_name,
                total=float(invoice.total),
                due_date=str(invoice.due_date),
                invoice_url=invoice_url
            )

        return invoice
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{invoice_id}/payment")
async def record_payment(
    invoice_id: int,
    payment: PaymentRecord,
    current_user: User = Depends(require_permission(Permission.RECORD_PAYMENTS)),
    db: AsyncSession = Depends(get_db)
):
    """Record a payment against an invoice."""
    invoice_service = InvoiceService(db)

    try:
        invoice = await invoice_service.record_payment(
            invoice_id=invoice_id,
            amount=payment.amount,
            payment_method=payment.payment_method,
            reference=payment.reference,
            notes=payment.notes,
            user_id=current_user.id
        )
        return {
            "message": "Payment recorded",
            "invoice_number": invoice.invoice_number,
            "amount_paid": float(invoice.amount_paid),
            "balance_due": float(invoice.total - invoice.amount_paid),
            "status": invoice.status
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{invoice_id}/void")
async def void_invoice(
    invoice_id: int,
    reason: Optional[str] = None,
    current_user: User = Depends(require_permission(Permission.MANAGE_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """Void an invoice."""
    invoice_service = InvoiceService(db)

    try:
        invoice = await invoice_service.void_invoice(
            invoice_id=invoice_id,
            reason=reason,
            user_id=current_user.id
        )
        return {"message": "Invoice voided", "invoice_number": invoice.invoice_number}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{invoice_id}/send-reminder")
async def send_payment_reminder(
    invoice_id: int,
    current_user: User = Depends(require_permission(Permission.CREATE_INVOICES)),
    db: AsyncSession = Depends(get_db)
):
    """Send payment reminder for an invoice."""
    invoice_service = InvoiceService(db)
    invoice = await invoice_service.get_by_id(invoice_id)

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )

    if invoice.status not in ["sent", "viewed", "partial"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send reminder for this invoice"
        )

    # Calculate days overdue
    days_overdue = 0
    if invoice.due_date:
        from datetime import date
        today = date.today()
        if today > invoice.due_date:
            days_overdue = (today - invoice.due_date).days

    # Send reminder
    if invoice.customer and invoice.customer.email:
        notification_service = NotificationService(db)
        await notification_service.send_invoice_reminder(
            invoice_id=invoice.id,
            email=invoice.customer.email,
            invoice_number=invoice.invoice_number,
            customer_name=invoice.customer.display_name,
            total=float(invoice.total - (invoice.amount_paid or 0)),
            due_date=str(invoice.due_date),
            days_overdue=days_overdue
        )

    return {"message": "Reminder sent", "invoice_number": invoice.invoice_number}
