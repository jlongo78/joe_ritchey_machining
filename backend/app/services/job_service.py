"""
Job Service - Business logic for machining job management
"""

from typing import Optional, List
from datetime import datetime, timedelta
from decimal import Decimal
import random
import string
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.job import Job, JobTask, JobPart, JobLabor, JobNote, JobFile, JobStatusHistory
from app.models.quote import Quote
from app.models.inventory import Inventory, InventoryTransaction
from app.models.settings import LaborRate
from app.schemas.job import (
    JobCreate, JobUpdate, JobTaskCreate, JobTaskUpdate,
    JobPartCreate, JobLaborCreate, JobNoteCreate
)
from app.core.config import settings
from app.core.exceptions import (
    NotFoundError, BusinessLogicError, InvalidStatusTransitionError
)


class JobService:
    """Service class for job operations."""

    # Valid status transitions
    STATUS_TRANSITIONS = {
        "pending": ["scheduled", "in_progress", "cancelled"],
        "scheduled": ["in_progress", "cancelled"],
        "in_progress": ["on_hold", "quality_check", "cancelled"],
        "on_hold": ["in_progress", "cancelled"],
        "quality_check": ["in_progress", "completed"],
        "completed": ["invoiced"],
        "invoiced": ["paid"],
        "cancelled": [],
        "paid": []
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_job_number(self) -> str:
        """Generate a unique job number."""
        timestamp = datetime.utcnow().strftime("%Y%m")
        chars = string.digits
        random_part = "".join(random.choices(chars, k=4))
        return f"JOB-{timestamp}-{random_part}"

    async def get_by_id(self, job_id: int) -> Optional[Job]:
        """Get job by ID with all related data."""
        result = await self.db.execute(
            select(Job)
            .options(
                selectinload(Job.tasks),
                selectinload(Job.parts),
                selectinload(Job.labor_entries),
                selectinload(Job.notes),
                selectinload(Job.files),
                selectinload(Job.status_history),
                selectinload(Job.customer),
                selectinload(Job.vehicle)
            )
            .where(Job.id == job_id)
        )
        return result.scalar_one_or_none()

    async def get_by_number(self, job_number: str) -> Optional[Job]:
        """Get job by job number."""
        result = await self.db.execute(
            select(Job)
            .options(selectinload(Job.tasks))
            .where(Job.job_number == job_number)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        customer_id: Optional[int] = None,
        status: Optional[str] = None,
        assigned_to: Optional[int] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None
    ) -> tuple[List[Job], int]:
        """Get all jobs with filters."""
        query = select(Job)

        if customer_id:
            query = query.where(Job.customer_id == customer_id)
        if status:
            query = query.where(Job.status == status)
        if assigned_to:
            query = query.where(Job.assigned_to == assigned_to)
        if priority:
            query = query.where(Job.priority == priority)
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Job.job_number.ilike(search_term),
                    Job.title.ilike(search_term),
                    Job.description.ilike(search_term)
                )
            )

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        query = query.options(
            selectinload(Job.customer),
            selectinload(Job.vehicle),
            selectinload(Job.tasks)
        ).offset(skip).limit(limit).order_by(Job.created_at.desc())

        result = await self.db.execute(query)
        jobs = result.scalars().all()

        return list(jobs), total_count

    async def create(self, job_data: JobCreate, user_id: int) -> Job:
        """Create a new job."""
        # Generate unique job number
        job_number = self._generate_job_number()
        while await self.get_by_number(job_number):
            job_number = self._generate_job_number()

        # Create job
        job_dict = job_data.model_dump(exclude={"tasks", "parts"})
        job = Job(
            job_number=job_number,
            status="pending",
            created_by=user_id,
            **job_dict
        )
        self.db.add(job)
        await self.db.flush()

        # Add initial status history
        status_history = JobStatusHistory(
            job_id=job.id,
            status="pending",
            notes="Job created",
            created_by=user_id
        )
        self.db.add(status_history)

        # Add tasks if provided
        if job_data.tasks:
            for i, task_data in enumerate(job_data.tasks):
                task = JobTask(
                    job_id=job.id,
                    **task_data.model_dump(),
                    display_order=task_data.display_order or i
                )
                self.db.add(task)

        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def create_from_quote(self, quote_id: int, user_id: int) -> Job:
        """Create a job from an approved quote."""
        # Get quote
        result = await self.db.execute(
            select(Quote)
            .options(selectinload(Quote.items))
            .where(Quote.id == quote_id)
        )
        quote = result.scalar_one_or_none()

        if not quote:
            raise NotFoundError("Quote")

        if quote.status != "approved":
            raise BusinessLogicError("Only approved quotes can be converted to jobs")

        if quote.job_id:
            raise BusinessLogicError("This quote has already been converted to a job")

        # Generate job number
        job_number = self._generate_job_number()
        while await self.get_by_number(job_number):
            job_number = self._generate_job_number()

        # Create job from quote
        job = Job(
            job_number=job_number,
            quote_id=quote.id,
            customer_id=quote.customer_id,
            vehicle_id=quote.vehicle_id,
            title=f"Job from Quote {quote.quote_number}",
            description=quote.notes,
            status="pending",
            priority="normal",
            estimated_hours=sum(item.labor_hours or Decimal("0") for item in quote.items),
            labor_rate=quote.items[0].labor_rate if quote.items else None,
            parts_total=sum(item.parts_cost or Decimal("0") for item in quote.items),
            labor_total=sum(item.labor_total or Decimal("0") for item in quote.items),
            subtotal=quote.subtotal,
            tax_amount=quote.tax_amount,
            total=quote.total,
            created_by=user_id
        )
        self.db.add(job)
        await self.db.flush()

        # Create tasks from quote items
        for i, item in enumerate(quote.items):
            task = JobTask(
                job_id=job.id,
                name=item.service_name,
                description=item.description,
                status="pending",
                estimated_hours=item.labor_hours,
                display_order=i
            )
            self.db.add(task)

        # Update quote
        quote.job_id = job.id
        quote.status = "converted"

        # Add status history
        status_history = JobStatusHistory(
            job_id=job.id,
            status="pending",
            notes=f"Job created from Quote {quote.quote_number}",
            created_by=user_id
        )
        self.db.add(status_history)

        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def update(self, job_id: int, job_data: JobUpdate) -> Job:
        """Update a job."""
        job = await self.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job")

        if job.status in ["completed", "invoiced", "paid", "cancelled"]:
            raise BusinessLogicError("Cannot modify a completed, invoiced, or cancelled job")

        update_data = job_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(job, field, value)

        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def update_status(
        self,
        job_id: int,
        new_status: str,
        notes: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Job:
        """Update job status with validation."""
        job = await self.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job")

        # Validate transition
        valid_transitions = self.STATUS_TRANSITIONS.get(job.status, [])
        if new_status not in valid_transitions:
            raise InvalidStatusTransitionError(job.status, new_status, "job")

        old_status = job.status
        job.status = new_status

        # Update timestamps
        if new_status == "in_progress" and not job.started_at:
            job.started_at = datetime.utcnow()
        elif new_status == "completed":
            job.completed_at = datetime.utcnow()
            # Calculate actual totals
            job.calculate_totals()

        # Add status history
        status_history = JobStatusHistory(
            job_id=job.id,
            status=new_status,
            notes=notes or f"Status changed from {old_status} to {new_status}",
            created_by=user_id
        )
        self.db.add(status_history)

        await self.db.flush()
        await self.db.refresh(job)
        return job

    # Task management

    async def add_task(self, job_id: int, task_data: JobTaskCreate) -> Job:
        """Add a task to a job."""
        job = await self.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job")

        if job.status in ["completed", "invoiced", "paid", "cancelled"]:
            raise BusinessLogicError("Cannot add tasks to a completed or cancelled job")

        display_order = len(job.tasks)
        task = JobTask(
            job_id=job_id,
            **task_data.model_dump(),
            display_order=task_data.display_order or display_order
        )
        self.db.add(task)

        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def update_task(
        self,
        job_id: int,
        task_id: int,
        task_data: JobTaskUpdate
    ) -> Job:
        """Update a job task."""
        job = await self.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job")

        task = next((t for t in job.tasks if t.id == task_id), None)
        if not task:
            raise NotFoundError("Job task")

        update_data = task_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        # Update task completion
        if task_data.status == "completed" and not task.completed_at:
            task.completed_at = datetime.utcnow()

        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def remove_task(self, job_id: int, task_id: int) -> Job:
        """Remove a task from a job."""
        job = await self.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job")

        if job.status in ["completed", "invoiced", "paid", "cancelled"]:
            raise BusinessLogicError("Cannot remove tasks from a completed or cancelled job")

        task = next((t for t in job.tasks if t.id == task_id), None)
        if not task:
            raise NotFoundError("Job task")

        await self.db.delete(task)

        await self.db.flush()
        await self.db.refresh(job)
        return job

    # Parts management

    async def add_part(
        self,
        job_id: int,
        part_data: JobPartCreate,
        user_id: Optional[int] = None
    ) -> Job:
        """Add a part to a job."""
        job = await self.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job")

        if job.status in ["completed", "invoiced", "paid", "cancelled"]:
            raise BusinessLogicError("Cannot add parts to a completed or cancelled job")

        # Check inventory if product_id provided
        if part_data.product_id:
            result = await self.db.execute(
                select(Inventory).where(Inventory.product_id == part_data.product_id)
            )
            inventory = result.scalar_one_or_none()
            if inventory and inventory.quantity_available < part_data.quantity:
                raise BusinessLogicError(
                    f"Insufficient stock. Only {inventory.quantity_available} available."
                )

        part = JobPart(
            job_id=job_id,
            **part_data.model_dump()
        )
        part.calculate_total()
        self.db.add(part)

        # Recalculate job totals
        job.calculate_totals()

        await self.db.flush()
        await self.db.refresh(job)
        return job

    async def remove_part(self, job_id: int, part_id: int) -> Job:
        """Remove a part from a job."""
        job = await self.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job")

        if job.status in ["completed", "invoiced", "paid", "cancelled"]:
            raise BusinessLogicError("Cannot remove parts from a completed or cancelled job")

        part = next((p for p in job.parts if p.id == part_id), None)
        if not part:
            raise NotFoundError("Job part")

        await self.db.delete(part)
        job.calculate_totals()

        await self.db.flush()
        await self.db.refresh(job)
        return job

    # Labor management

    async def add_labor(
        self,
        job_id: int,
        labor_data: JobLaborCreate,
        user_id: Optional[int] = None
    ) -> Job:
        """Add a labor entry to a job."""
        job = await self.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job")

        if job.status in ["completed", "invoiced", "paid", "cancelled"]:
            raise BusinessLogicError("Cannot add labor to a completed or cancelled job")

        # Get labor rate if not provided
        rate = labor_data.rate
        if rate is None:
            result = await self.db.execute(
                select(LaborRate).where(LaborRate.is_default == True, LaborRate.is_active == True)
            )
            default_rate = result.scalar_one_or_none()
            rate = default_rate.rate if default_rate else Decimal(str(settings.LABOR_RATE_DEFAULT))

        labor = JobLabor(
            job_id=job_id,
            employee_id=labor_data.employee_id or user_id,
            task_id=labor_data.task_id,
            hours=labor_data.hours,
            rate=rate,
            description=labor_data.description,
            work_date=labor_data.work_date or datetime.utcnow().date()
        )
        labor.calculate_total()
        self.db.add(labor)

        # Update job actual hours and recalculate
        job.actual_hours = (job.actual_hours or Decimal("0")) + labor_data.hours
        job.calculate_totals()

        await self.db.flush()
        await self.db.refresh(job)
        return job

    # Notes management

    async def add_note(
        self,
        job_id: int,
        note_data: JobNoteCreate,
        user_id: int
    ) -> Job:
        """Add a note to a job."""
        job = await self.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job")

        note = JobNote(
            job_id=job_id,
            user_id=user_id,
            **note_data.model_dump()
        )
        self.db.add(note)

        await self.db.flush()
        await self.db.refresh(job)
        return job

    # Job queries

    async def get_active_jobs(self) -> List[Job]:
        """Get all active (non-completed, non-cancelled) jobs."""
        result = await self.db.execute(
            select(Job)
            .where(Job.status.notin_(["completed", "invoiced", "paid", "cancelled"]))
            .order_by(Job.priority.desc(), Job.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_jobs_for_scheduling(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[Job]:
        """Get jobs scheduled within a date range."""
        result = await self.db.execute(
            select(Job)
            .where(
                and_(
                    Job.scheduled_start >= start_date,
                    Job.scheduled_start <= end_date
                )
            )
            .options(selectinload(Job.customer), selectinload(Job.vehicle))
            .order_by(Job.scheduled_start)
        )
        return list(result.scalars().all())

    async def get_overdue_jobs(self) -> List[Job]:
        """Get jobs that are past their due date."""
        result = await self.db.execute(
            select(Job)
            .where(
                and_(
                    Job.due_date < datetime.utcnow(),
                    Job.status.notin_(["completed", "invoiced", "paid", "cancelled"])
                )
            )
            .order_by(Job.due_date)
        )
        return list(result.scalars().all())

    async def get_employee_jobs(
        self,
        employee_id: int,
        include_completed: bool = False
    ) -> List[Job]:
        """Get jobs assigned to an employee."""
        query = select(Job).where(Job.assigned_to == employee_id)

        if not include_completed:
            query = query.where(Job.status.notin_(["completed", "invoiced", "paid", "cancelled"]))

        result = await self.db.execute(query.order_by(Job.priority.desc(), Job.due_date))
        return list(result.scalars().all())

    async def complete_job(self, job_id: int, user_id: int) -> Job:
        """Complete a job and finalize totals."""
        job = await self.get_by_id(job_id)
        if not job:
            raise NotFoundError("Job")

        if job.status != "quality_check":
            raise BusinessLogicError("Job must pass quality check before completion")

        # Ensure all tasks are completed
        incomplete_tasks = [t for t in job.tasks if t.status != "completed"]
        if incomplete_tasks:
            raise BusinessLogicError(
                f"Cannot complete job. {len(incomplete_tasks)} tasks are still incomplete."
            )

        # Deduct inventory for used parts
        for part in job.parts:
            if part.product_id and not part.is_deducted:
                result = await self.db.execute(
                    select(Inventory).where(Inventory.product_id == part.product_id)
                )
                inventory = result.scalar_one_or_none()
                if inventory:
                    inventory.quantity_on_hand -= part.quantity

                    # Record transaction
                    transaction = InventoryTransaction(
                        item_id=inventory.id,
                        product_id=part.product_id,
                        transaction_type="job_usage",
                        quantity=-part.quantity,
                        reference_type="job",
                        reference_id=job.id,
                        unit_cost=part.cost,
                        performed_by=user_id
                    )
                    self.db.add(transaction)
                    part.is_deducted = True

        return await self.update_status(job_id, "completed", "Job completed", user_id)
