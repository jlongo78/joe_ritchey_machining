"""
Customer API Endpoints - CRM functionality
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db, get_current_active_user, get_staff_user,
    get_pagination, PaginationParams
)
from app.services.customer_service import CustomerService
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerDetailResponse,
    CustomerContactCreate, CustomerNoteCreate, CustomerVehicleCreate
)
from app.schemas.common import PaginatedResponse
from app.core.permissions import Permission
from app.api.deps import require_permission
from app.models.user import User


router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def list_customers(
    pagination: PaginationParams = Depends(get_pagination),
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    customer_type: Optional[str] = Query(None),
    is_active: bool = Query(True),
    current_user: User = Depends(require_permission(Permission.VIEW_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """List customers with filters."""
    customer_service = CustomerService(db)

    customers, total = await customer_service.get_all(
        skip=pagination.skip,
        limit=pagination.limit,
        search=search,
        customer_type=customer_type,
        is_active=is_active
    )

    return {
        "items": customers,
        "total": total,
        "skip": pagination.skip,
        "limit": pagination.limit
    }


@router.get("/search")
async def search_customers(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(require_permission(Permission.VIEW_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Quick search for customers (autocomplete)."""
    customer_service = CustomerService(db)
    customers = await customer_service.search(q, limit)
    return {"customers": customers}


@router.get("/{customer_id}", response_model=CustomerDetailResponse)
async def get_customer(
    customer_id: int,
    current_user: User = Depends(require_permission(Permission.VIEW_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Get customer details."""
    customer_service = CustomerService(db)
    customer = await customer_service.get_by_id(customer_id)

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    return customer


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_data: CustomerCreate,
    current_user: User = Depends(require_permission(Permission.MANAGE_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new customer."""
    customer_service = CustomerService(db)

    try:
        customer = await customer_service.create(customer_data)
        return customer
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    current_user: User = Depends(require_permission(Permission.MANAGE_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Update a customer."""
    customer_service = CustomerService(db)

    try:
        customer = await customer_service.update(customer_id, customer_data)
        return customer
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int,
    current_user: User = Depends(require_permission(Permission.MANAGE_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate a customer."""
    customer_service = CustomerService(db)

    try:
        await customer_service.delete(customer_id)
        return {"message": "Customer deactivated"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Contact management

@router.get("/{customer_id}/contacts")
async def get_customer_contacts(
    customer_id: int,
    current_user: User = Depends(require_permission(Permission.VIEW_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Get customer contacts."""
    customer_service = CustomerService(db)
    contacts = await customer_service.get_contacts(customer_id)
    return {"contacts": contacts}


@router.post("/{customer_id}/contacts")
async def add_customer_contact(
    customer_id: int,
    contact_data: CustomerContactCreate,
    current_user: User = Depends(require_permission(Permission.MANAGE_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Add a contact to a customer."""
    customer_service = CustomerService(db)

    try:
        contact = await customer_service.add_contact(customer_id, contact_data)
        return contact
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{customer_id}/contacts/{contact_id}")
async def remove_customer_contact(
    customer_id: int,
    contact_id: int,
    current_user: User = Depends(require_permission(Permission.MANAGE_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Remove a contact from a customer."""
    customer_service = CustomerService(db)

    try:
        await customer_service.remove_contact(customer_id, contact_id)
        return {"message": "Contact removed"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Vehicle management

@router.get("/{customer_id}/vehicles")
async def get_customer_vehicles(
    customer_id: int,
    current_user: User = Depends(require_permission(Permission.VIEW_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Get customer vehicles."""
    customer_service = CustomerService(db)
    vehicles = await customer_service.get_vehicles(customer_id)
    return {"vehicles": vehicles}


@router.post("/{customer_id}/vehicles")
async def add_customer_vehicle(
    customer_id: int,
    vehicle_data: CustomerVehicleCreate,
    current_user: User = Depends(require_permission(Permission.MANAGE_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Add a vehicle to a customer."""
    customer_service = CustomerService(db)

    try:
        vehicle = await customer_service.add_vehicle(customer_id, vehicle_data)
        return vehicle
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{customer_id}/vehicles/{vehicle_id}")
async def remove_customer_vehicle(
    customer_id: int,
    vehicle_id: int,
    current_user: User = Depends(require_permission(Permission.MANAGE_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Remove a vehicle from a customer."""
    customer_service = CustomerService(db)

    try:
        await customer_service.remove_vehicle(customer_id, vehicle_id)
        return {"message": "Vehicle removed"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Notes management

@router.get("/{customer_id}/notes")
async def get_customer_notes(
    customer_id: int,
    current_user: User = Depends(require_permission(Permission.VIEW_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Get customer notes."""
    customer_service = CustomerService(db)
    notes = await customer_service.get_notes(customer_id)
    return {"notes": notes}


@router.post("/{customer_id}/notes")
async def add_customer_note(
    customer_id: int,
    note_data: CustomerNoteCreate,
    current_user: User = Depends(require_permission(Permission.VIEW_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Add a note to a customer."""
    customer_service = CustomerService(db)

    try:
        note = await customer_service.add_note(
            customer_id,
            note_data,
            user_id=current_user.id
        )
        return note
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Customer history

@router.get("/{customer_id}/history")
async def get_customer_history(
    customer_id: int,
    current_user: User = Depends(require_permission(Permission.VIEW_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Get customer history (jobs, quotes, orders)."""
    customer_service = CustomerService(db)
    history = await customer_service.get_history(customer_id)
    return history


@router.get("/{customer_id}/stats")
async def get_customer_stats(
    customer_id: int,
    current_user: User = Depends(require_permission(Permission.VIEW_CUSTOMERS)),
    db: AsyncSession = Depends(get_db)
):
    """Get customer statistics."""
    customer_service = CustomerService(db)
    stats = await customer_service.get_stats(customer_id)
    return stats
