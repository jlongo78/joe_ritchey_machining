"""
Job API Endpoints - Machining job management
"""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db, get_current_active_user, get_staff_user,
    get_pagination, PaginationParams
)
from app.services.job_service import JobService
from app.services.notification_service import NotificationService
from app.schemas.job import (
    JobCreate, JobUpdate, JobResponse, JobDetailResponse,
    JobTaskCreate, JobTaskUpdate, JobPartCreate, JobLaborCreate, JobNoteCreate
)
from app.schemas.common import PaginatedResponse
from app.core.permissions import Permission
from app.api.deps import require_permission
from app.models.user import User


router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def list_jobs(
    pagination: PaginationParams = Depends(get_pagination),
    customer_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    assigned_to: Optional[int] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_permission(Permission.VIEW_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """List jobs with filters."""
    job_service = JobService(db)

    jobs, total = await job_service.get_all(
        skip=pagination.skip,
        limit=pagination.limit,
        customer_id=customer_id,
        status=status_filter,
        assigned_to=assigned_to,
        priority=priority,
        search=search
    )

    return {
        "items": jobs,
        "total": total,
        "skip": pagination.skip,
        "limit": pagination.limit
    }


@router.get("/active")
async def get_active_jobs(
    current_user: User = Depends(require_permission(Permission.VIEW_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Get all active jobs."""
    job_service = JobService(db)
    jobs = await job_service.get_active_jobs()
    return {"jobs": jobs, "count": len(jobs)}


@router.get("/overdue")
async def get_overdue_jobs(
    current_user: User = Depends(require_permission(Permission.VIEW_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Get overdue jobs."""
    job_service = JobService(db)
    jobs = await job_service.get_overdue_jobs()
    return {"jobs": jobs, "count": len(jobs)}


@router.get("/schedule")
async def get_scheduled_jobs(
    start_date: datetime,
    end_date: datetime,
    current_user: User = Depends(require_permission(Permission.VIEW_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Get jobs scheduled within a date range."""
    job_service = JobService(db)
    jobs = await job_service.get_jobs_for_scheduling(start_date, end_date)
    return {"jobs": jobs, "count": len(jobs)}


@router.get("/my-jobs")
async def get_my_jobs(
    include_completed: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get jobs assigned to current user."""
    job_service = JobService(db)
    jobs = await job_service.get_employee_jobs(
        employee_id=current_user.id,
        include_completed=include_completed
    )
    return {"jobs": jobs, "count": len(jobs)}


@router.get("/{job_id}", response_model=JobDetailResponse)
async def get_job(
    job_id: int,
    current_user: User = Depends(require_permission(Permission.VIEW_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Get job details."""
    job_service = JobService(db)
    job = await job_service.get_by_id(job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    return job


@router.get("/number/{job_number}", response_model=JobDetailResponse)
async def get_job_by_number(
    job_number: str,
    current_user: User = Depends(require_permission(Permission.VIEW_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Get job by job number."""
    job_service = JobService(db)
    job = await job_service.get_by_number(job_number)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    return job


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(require_permission(Permission.CREATE_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Create a new job."""
    job_service = JobService(db)

    try:
        job = await job_service.create(job_data, user_id=current_user.id)
        return job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(require_permission(Permission.MANAGE_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Update a job."""
    job_service = JobService(db)

    try:
        job = await job_service.update(job_id, job_data)
        return job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{job_id}/status")
async def update_job_status(
    job_id: int,
    new_status: str,
    notes: Optional[str] = None,
    current_user: User = Depends(require_permission(Permission.MANAGE_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Update job status."""
    job_service = JobService(db)

    try:
        job = await job_service.update_status(
            job_id=job_id,
            new_status=new_status,
            notes=notes,
            user_id=current_user.id
        )

        # Notify customer of status change
        if job.customer and job.customer.email:
            notification_service = NotificationService(db)
            await notification_service.send_job_update(
                job_id=job.id,
                email=job.customer.email,
                phone=job.customer.phone,
                job_number=job.job_number,
                customer_name=job.customer.display_name,
                status=new_status,
                message=notes
            )

        return {"message": f"Job status updated to {new_status}", "job_id": job.id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Task management

@router.post("/{job_id}/tasks", response_model=JobResponse)
async def add_task(
    job_id: int,
    task_data: JobTaskCreate,
    current_user: User = Depends(require_permission(Permission.MANAGE_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Add a task to a job."""
    job_service = JobService(db)

    try:
        job = await job_service.add_task(job_id, task_data)
        return job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{job_id}/tasks/{task_id}")
async def update_task(
    job_id: int,
    task_id: int,
    task_data: JobTaskUpdate,
    current_user: User = Depends(require_permission(Permission.MANAGE_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Update a job task."""
    job_service = JobService(db)

    try:
        job = await job_service.update_task(job_id, task_id, task_data)
        return {"message": "Task updated", "job_id": job.id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{job_id}/tasks/{task_id}")
async def remove_task(
    job_id: int,
    task_id: int,
    current_user: User = Depends(require_permission(Permission.MANAGE_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Remove a task from a job."""
    job_service = JobService(db)

    try:
        await job_service.remove_task(job_id, task_id)
        return {"message": "Task removed"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Parts management

@router.post("/{job_id}/parts", response_model=JobResponse)
async def add_part(
    job_id: int,
    part_data: JobPartCreate,
    current_user: User = Depends(require_permission(Permission.MANAGE_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Add a part to a job."""
    job_service = JobService(db)

    try:
        job = await job_service.add_part(job_id, part_data, user_id=current_user.id)
        return job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{job_id}/parts/{part_id}")
async def remove_part(
    job_id: int,
    part_id: int,
    current_user: User = Depends(require_permission(Permission.MANAGE_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Remove a part from a job."""
    job_service = JobService(db)

    try:
        await job_service.remove_part(job_id, part_id)
        return {"message": "Part removed"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Labor management

@router.post("/{job_id}/labor", response_model=JobResponse)
async def add_labor(
    job_id: int,
    labor_data: JobLaborCreate,
    current_user: User = Depends(require_permission(Permission.MANAGE_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Add labor entry to a job."""
    job_service = JobService(db)

    try:
        job = await job_service.add_labor(job_id, labor_data, user_id=current_user.id)
        return job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Notes management

@router.post("/{job_id}/notes", response_model=JobResponse)
async def add_note(
    job_id: int,
    note_data: JobNoteCreate,
    current_user: User = Depends(require_permission(Permission.VIEW_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Add a note to a job."""
    job_service = JobService(db)

    try:
        job = await job_service.add_note(job_id, note_data, user_id=current_user.id)
        return job
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Job completion

@router.post("/{job_id}/complete")
async def complete_job(
    job_id: int,
    current_user: User = Depends(require_permission(Permission.MANAGE_JOBS)),
    db: AsyncSession = Depends(get_db)
):
    """Complete a job."""
    job_service = JobService(db)

    try:
        job = await job_service.complete_job(job_id, user_id=current_user.id)

        # Notify customer
        if job.customer and job.customer.email:
            notification_service = NotificationService(db)
            await notification_service.send_job_update(
                job_id=job.id,
                email=job.customer.email,
                phone=job.customer.phone,
                job_number=job.job_number,
                customer_name=job.customer.display_name,
                status="completed",
                message="Your job is complete and ready for pickup!"
            )

        return {"message": "Job completed", "job_id": job.id, "job_number": job.job_number}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
