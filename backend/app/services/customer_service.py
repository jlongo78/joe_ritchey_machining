"""
Customer Service - Business logic for customer/CRM operations
"""

from typing import Optional, List
from datetime import datetime
import random
import string
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.customer import Customer, CustomerContact, CustomerVehicle, CustomerNote
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate,
    CustomerContactCreate, CustomerVehicleCreate, CustomerNoteCreate
)
from app.core.exceptions import NotFoundError, DuplicateEntryError


class CustomerService:
    """Service class for customer operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_customer_number(self) -> str:
        """Generate a unique customer number."""
        chars = string.ascii_uppercase + string.digits
        return "C" + "".join(random.choices(chars, k=7))

    async def get_by_id(self, customer_id: int) -> Optional[Customer]:
        """Get customer by ID with related data."""
        result = await self.db.execute(
            select(Customer)
            .options(
                selectinload(Customer.contacts),
                selectinload(Customer.vehicles),
                selectinload(Customer.customer_notes)
            )
            .where(Customer.id == customer_id)
        )
        return result.scalar_one_or_none()

    async def get_by_number(self, customer_number: str) -> Optional[Customer]:
        """Get customer by customer number."""
        result = await self.db.execute(
            select(Customer).where(Customer.customer_number == customer_number)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[Customer]:
        """Get customer by email."""
        result = await self.db.execute(
            select(Customer).where(Customer.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        customer_type: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> tuple[List[Customer], int]:
        """Get all customers with pagination, search, and filters."""
        query = select(Customer)

        # Apply filters
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Customer.customer_number.ilike(search_term),
                    Customer.company_name.ilike(search_term),
                    Customer.first_name.ilike(search_term),
                    Customer.last_name.ilike(search_term),
                    Customer.email.ilike(search_term),
                    Customer.phone.ilike(search_term)
                )
            )

        if customer_type:
            query = query.where(Customer.customer_type == customer_type)

        if is_active is not None:
            query = query.where(Customer.is_active == is_active)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        # Get paginated results
        query = query.offset(skip).limit(limit).order_by(Customer.created_at.desc())
        result = await self.db.execute(query)
        customers = result.scalars().all()

        return list(customers), total_count

    async def create(self, customer_data: CustomerCreate) -> Customer:
        """Create a new customer."""
        # Check for duplicate email if provided
        if customer_data.email:
            existing = await self.get_by_email(customer_data.email)
            if existing:
                raise DuplicateEntryError("email", customer_data.email)

        # Generate unique customer number
        customer_number = self._generate_customer_number()
        while await self.get_by_number(customer_number):
            customer_number = self._generate_customer_number()

        # Create customer
        customer = Customer(
            customer_number=customer_number,
            **customer_data.model_dump()
        )

        self.db.add(customer)
        await self.db.flush()
        await self.db.refresh(customer)
        return customer

    async def update(self, customer_id: int, customer_data: CustomerUpdate) -> Customer:
        """Update a customer."""
        customer = await self.get_by_id(customer_id)
        if not customer:
            raise NotFoundError("Customer")

        # Check for duplicate email if changing
        if customer_data.email and customer_data.email.lower() != customer.email:
            existing = await self.get_by_email(customer_data.email)
            if existing and existing.id != customer_id:
                raise DuplicateEntryError("email", customer_data.email)

        # Update fields
        update_data = customer_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "email" and value:
                value = value.lower()
            setattr(customer, field, value)

        await self.db.flush()
        await self.db.refresh(customer)
        return customer

    async def delete(self, customer_id: int) -> bool:
        """Soft delete a customer."""
        customer = await self.get_by_id(customer_id)
        if not customer:
            raise NotFoundError("Customer")

        customer.is_active = False
        await self.db.flush()
        return True

    async def update_stats(self, customer_id: int, revenue: float = 0, job_count: int = 0):
        """Update customer statistics after a job or order."""
        customer = await self.get_by_id(customer_id)
        if customer:
            customer.total_revenue = float(customer.total_revenue or 0) + revenue
            customer.total_jobs = (customer.total_jobs or 0) + job_count
            customer.last_service_date = datetime.utcnow().date()
            await self.db.flush()

    # Contact management

    async def add_contact(self, customer_id: int, contact_data: CustomerContactCreate) -> CustomerContact:
        """Add a contact to a customer."""
        customer = await self.get_by_id(customer_id)
        if not customer:
            raise NotFoundError("Customer")

        # If setting as primary, unset other primaries
        if contact_data.is_primary:
            for contact in customer.contacts:
                contact.is_primary = False

        contact = CustomerContact(
            customer_id=customer_id,
            **contact_data.model_dump()
        )
        self.db.add(contact)
        await self.db.flush()
        await self.db.refresh(contact)
        return contact

    async def update_contact(
        self,
        customer_id: int,
        contact_id: int,
        contact_data: CustomerContactCreate
    ) -> CustomerContact:
        """Update a customer contact."""
        result = await self.db.execute(
            select(CustomerContact)
            .where(CustomerContact.id == contact_id, CustomerContact.customer_id == customer_id)
        )
        contact = result.scalar_one_or_none()
        if not contact:
            raise NotFoundError("Contact")

        for field, value in contact_data.model_dump().items():
            setattr(contact, field, value)

        await self.db.flush()
        await self.db.refresh(contact)
        return contact

    async def delete_contact(self, customer_id: int, contact_id: int) -> bool:
        """Delete a customer contact."""
        result = await self.db.execute(
            select(CustomerContact)
            .where(CustomerContact.id == contact_id, CustomerContact.customer_id == customer_id)
        )
        contact = result.scalar_one_or_none()
        if not contact:
            raise NotFoundError("Contact")

        await self.db.delete(contact)
        await self.db.flush()
        return True

    # Vehicle management

    async def add_vehicle(self, customer_id: int, vehicle_data: CustomerVehicleCreate) -> CustomerVehicle:
        """Add a vehicle to a customer."""
        customer = await self.get_by_id(customer_id)
        if not customer:
            raise NotFoundError("Customer")

        vehicle = CustomerVehicle(
            customer_id=customer_id,
            **vehicle_data.model_dump()
        )
        self.db.add(vehicle)
        await self.db.flush()
        await self.db.refresh(vehicle)
        return vehicle

    async def update_vehicle(
        self,
        customer_id: int,
        vehicle_id: int,
        vehicle_data: CustomerVehicleCreate
    ) -> CustomerVehicle:
        """Update a customer vehicle."""
        result = await self.db.execute(
            select(CustomerVehicle)
            .where(CustomerVehicle.id == vehicle_id, CustomerVehicle.customer_id == customer_id)
        )
        vehicle = result.scalar_one_or_none()
        if not vehicle:
            raise NotFoundError("Vehicle")

        for field, value in vehicle_data.model_dump().items():
            setattr(vehicle, field, value)

        await self.db.flush()
        await self.db.refresh(vehicle)
        return vehicle

    async def delete_vehicle(self, customer_id: int, vehicle_id: int) -> bool:
        """Delete (deactivate) a customer vehicle."""
        result = await self.db.execute(
            select(CustomerVehicle)
            .where(CustomerVehicle.id == vehicle_id, CustomerVehicle.customer_id == customer_id)
        )
        vehicle = result.scalar_one_or_none()
        if not vehicle:
            raise NotFoundError("Vehicle")

        vehicle.is_active = False
        await self.db.flush()
        return True

    # Note management

    async def add_note(
        self,
        customer_id: int,
        user_id: int,
        note_data: CustomerNoteCreate
    ) -> CustomerNote:
        """Add a note to a customer."""
        customer = await self.get_by_id(customer_id)
        if not customer:
            raise NotFoundError("Customer")

        note = CustomerNote(
            customer_id=customer_id,
            user_id=user_id,
            **note_data.model_dump()
        )
        self.db.add(note)
        await self.db.flush()
        await self.db.refresh(note)
        return note

    async def get_notes(self, customer_id: int, limit: int = 50) -> List[CustomerNote]:
        """Get notes for a customer."""
        result = await self.db.execute(
            select(CustomerNote)
            .where(CustomerNote.customer_id == customer_id)
            .order_by(CustomerNote.is_pinned.desc(), CustomerNote.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
