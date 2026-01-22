"""
Quote API Endpoints - Machining service quotes
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db, get_current_active_user, get_staff_user,
    get_pagination, PaginationParams
)
from app.services.quote_service import QuoteService
from app.services.notification_service import NotificationService
from app.schemas.quote import (
    QuoteCreate, QuoteUpdate, QuoteResponse, QuoteDetailResponse,
    QuoteItemCreate, QuoteApproval
)
from app.schemas.common import PaginatedResponse
from app.core.permissions import Permission
from app.api.deps import require_permission
from app.core.config import settings
from app.models.user import User


router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def list_quotes(
    pagination: PaginationParams = Depends(get_pagination),
    customer_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_permission(Permission.VIEW_QUOTES)),
    db: AsyncSession = Depends(get_db)
):
    """List quotes with filters."""
    quote_service = QuoteService(db)

    quotes, total = await quote_service.get_all(
        skip=pagination.skip,
        limit=pagination.limit,
        customer_id=customer_id,
        status=status_filter
    )

    return {
        "items": quotes,
        "total": total,
        "skip": pagination.skip,
        "limit": pagination.limit
    }


@router.get("/pending")
async def get_pending_quotes(
    days_old: int = Query(7, ge=1),
    current_user: User = Depends(require_permission(Permission.VIEW_QUOTES)),
    db: AsyncSession = Depends(get_db)
):
    """Get pending quotes that need follow-up."""
    quote_service = QuoteService(db)
    quotes = await quote_service.get_pending_quotes(days_old)
    return {"quotes": quotes, "count": len(quotes)}


@router.get("/{quote_id}", response_model=QuoteDetailResponse)
async def get_quote(
    quote_id: int,
    current_user: User = Depends(require_permission(Permission.VIEW_QUOTES)),
    db: AsyncSession = Depends(get_db)
):
    """Get quote details."""
    quote_service = QuoteService(db)
    quote = await quote_service.get_by_id(quote_id)

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found"
        )

    return quote


@router.get("/number/{quote_number}", response_model=QuoteDetailResponse)
async def get_quote_by_number(
    quote_number: str,
    db: AsyncSession = Depends(get_db)
):
    """Get quote by quote number (public for customer viewing)."""
    quote_service = QuoteService(db)
    quote = await quote_service.get_by_number(quote_number)

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quote not found"
        )

    # Mark as viewed if first time
    await quote_service.mark_viewed(quote.id)

    return quote


@router.post("", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def create_quote(
    quote_data: QuoteCreate,
    current_user: User = Depends(require_permission(Permission.CREATE_QUOTES)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new quote."""
    quote_service = QuoteService(db)

    try:
        quote = await quote_service.create(quote_data, user_id=current_user.id)
        return quote
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{quote_id}", response_model=QuoteResponse)
async def update_quote(
    quote_id: int,
    quote_data: QuoteUpdate,
    current_user: User = Depends(require_permission(Permission.CREATE_QUOTES)),
    db: AsyncSession = Depends(get_db)
):
    """Update a quote."""
    quote_service = QuoteService(db)

    try:
        quote = await quote_service.update(quote_id, quote_data)
        return quote
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{quote_id}/items", response_model=QuoteResponse)
async def add_quote_item(
    quote_id: int,
    item_data: QuoteItemCreate,
    current_user: User = Depends(require_permission(Permission.CREATE_QUOTES)),
    db: AsyncSession = Depends(get_db)
):
    """Add item to a quote."""
    quote_service = QuoteService(db)

    try:
        quote = await quote_service.add_item(quote_id, item_data)
        return quote
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{quote_id}/items/{item_id}", response_model=QuoteResponse)
async def remove_quote_item(
    quote_id: int,
    item_id: int,
    current_user: User = Depends(require_permission(Permission.CREATE_QUOTES)),
    db: AsyncSession = Depends(get_db)
):
    """Remove item from a quote."""
    quote_service = QuoteService(db)

    try:
        quote = await quote_service.remove_item(quote_id, item_id)
        return quote
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{quote_id}/send", response_model=QuoteResponse)
async def send_quote(
    quote_id: int,
    current_user: User = Depends(require_permission(Permission.CREATE_QUOTES)),
    db: AsyncSession = Depends(get_db)
):
    """Send quote to customer."""
    quote_service = QuoteService(db)

    try:
        quote = await quote_service.send_quote(quote_id, user_id=current_user.id)

        # Send notification to customer
        if quote.customer and quote.customer.email:
            notification_service = NotificationService(db)
            quote_url = f"{settings.FRONTEND_URL}/quotes/{quote.quote_number}"
            await notification_service.send_quote_notification(
                quote_id=quote.id,
                email=quote.customer.email,
                quote_number=quote.quote_number,
                customer_name=quote.customer.display_name,
                total=float(quote.total),
                valid_until=str(quote.valid_until),
                quote_url=quote_url
            )

        return quote
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{quote_id}/approve")
async def approve_quote(
    quote_id: int,
    approval: QuoteApproval,
    db: AsyncSession = Depends(get_db)
):
    """Approve a quote (customer action)."""
    quote_service = QuoteService(db)

    try:
        quote = await quote_service.approve_quote(
            quote_id=quote_id,
            approved_by_name=approval.approved_by_name,
            notes=approval.notes
        )
        return {
            "message": "Quote approved",
            "quote_number": quote.quote_number,
            "status": quote.status
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{quote_id}/decline")
async def decline_quote(
    quote_id: int,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Decline a quote (customer action)."""
    quote_service = QuoteService(db)

    try:
        quote = await quote_service.decline_quote(
            quote_id=quote_id,
            reason=reason
        )
        return {
            "message": "Quote declined",
            "quote_number": quote.quote_number,
            "status": quote.status
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{quote_id}/convert-to-job")
async def convert_quote_to_job(
    quote_id: int,
    current_user: User = Depends(require_permission(Permission.CREATE_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Convert approved quote to a job."""
    # This endpoint triggers job creation - see jobs endpoint
    from app.services.job_service import JobService

    job_service = JobService(db)

    try:
        job = await job_service.create_from_quote(quote_id, user_id=current_user.id)
        return {
            "message": "Quote converted to job",
            "job_id": job.id,
            "job_number": job.job_number
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/labor-rate/default")
async def get_default_labor_rate(
    service_type: Optional[str] = None,
    current_user: User = Depends(require_permission(Permission.VIEW_QUOTES)),
    db: AsyncSession = Depends(get_db)
):
    """Get default labor rate for quoting."""
    quote_service = QuoteService(db)
    rate = await quote_service.get_default_labor_rate(service_type)
    return {"labor_rate": float(rate)}
