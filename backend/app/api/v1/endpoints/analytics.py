"""
Analytics API Endpoints - Business intelligence and reporting
"""

from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_user
from app.services.analytics_service import AnalyticsService
from app.core.permissions import Permission
from app.api.deps import require_permission
from app.models.user import User


router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_summary(
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive dashboard summary."""
    analytics_service = AnalyticsService(db)
    summary = await analytics_service.get_dashboard_summary()
    return summary


@router.get("/revenue")
async def get_revenue_summary(
    start_date: datetime,
    end_date: datetime,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get revenue summary for a date range."""
    analytics_service = AnalyticsService(db)
    summary = await analytics_service.get_revenue_summary(start_date, end_date)
    return summary


@router.get("/revenue/by-period")
async def get_revenue_by_period(
    start_date: datetime,
    end_date: datetime,
    period: str = Query("day", regex="^(day|week|month)$"),
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get revenue breakdown by time period."""
    analytics_service = AnalyticsService(db)
    data = await analytics_service.get_revenue_by_period(start_date, end_date, period)
    return {"data": data}


@router.get("/products/top")
async def get_top_products(
    start_date: datetime,
    end_date: datetime,
    limit: int = Query(10, ge=1, le=100),
    by: str = Query("revenue", regex="^(revenue|quantity)$"),
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get top selling products."""
    analytics_service = AnalyticsService(db)
    products = await analytics_service.get_top_products(start_date, end_date, limit, by)
    return {"products": products}


@router.get("/products/{product_id}/performance")
async def get_product_performance(
    product_id: int,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed performance metrics for a product."""
    analytics_service = AnalyticsService(db)
    performance = await analytics_service.get_product_performance(product_id, days)
    return performance


@router.get("/customers")
async def get_customer_summary(
    start_date: datetime,
    end_date: datetime,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get customer analytics summary."""
    analytics_service = AnalyticsService(db)
    summary = await analytics_service.get_customer_summary(start_date, end_date)
    return summary


@router.get("/customers/top")
async def get_top_customers(
    start_date: datetime,
    end_date: datetime,
    limit: int = Query(10, ge=1, le=100),
    customer_type: str = Query("all", regex="^(all|ecommerce|services)$"),
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get top customers by revenue."""
    analytics_service = AnalyticsService(db)
    customers = await analytics_service.get_top_customers(
        start_date, end_date, limit, customer_type
    )
    return {"customers": customers}


@router.get("/jobs")
async def get_job_statistics(
    start_date: datetime,
    end_date: datetime,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get job/service statistics."""
    analytics_service = AnalyticsService(db)
    stats = await analytics_service.get_job_statistics(start_date, end_date)
    return stats


@router.get("/inventory")
async def get_inventory_summary(
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get inventory summary."""
    analytics_service = AnalyticsService(db)
    summary = await analytics_service.get_inventory_summary()
    return summary


@router.get("/inventory/turnover")
async def get_inventory_turnover(
    start_date: datetime,
    end_date: datetime,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get inventory turnover analysis."""
    analytics_service = AnalyticsService(db)
    turnover = await analytics_service.get_inventory_turnover(start_date, end_date)
    return {"turnover": turnover}


# Quick reports for common time periods

@router.get("/reports/today")
async def get_today_report(
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get today's summary report."""
    analytics_service = AnalyticsService(db)

    today = datetime.utcnow()
    start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)

    revenue = await analytics_service.get_revenue_summary(start_of_day, today)

    return {
        "date": today.date().isoformat(),
        "revenue": revenue
    }


@router.get("/reports/this-week")
async def get_this_week_report(
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get this week's summary report."""
    analytics_service = AnalyticsService(db)

    today = datetime.utcnow()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

    revenue = await analytics_service.get_revenue_summary(start_of_week, today)
    daily_breakdown = await analytics_service.get_revenue_by_period(
        start_of_week, today, "day"
    )

    return {
        "week_start": start_of_week.date().isoformat(),
        "week_end": today.date().isoformat(),
        "revenue": revenue,
        "daily_breakdown": daily_breakdown
    }


@router.get("/reports/this-month")
async def get_this_month_report(
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get this month's summary report."""
    analytics_service = AnalyticsService(db)

    today = datetime.utcnow()
    start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    revenue = await analytics_service.get_revenue_summary(start_of_month, today)
    top_products = await analytics_service.get_top_products(start_of_month, today, 5)
    job_stats = await analytics_service.get_job_statistics(start_of_month, today)

    return {
        "month_start": start_of_month.date().isoformat(),
        "month_end": today.date().isoformat(),
        "revenue": revenue,
        "top_products": top_products,
        "job_statistics": job_stats
    }


@router.get("/reports/year-to-date")
async def get_ytd_report(
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: AsyncSession = Depends(get_db)
):
    """Get year-to-date summary report."""
    analytics_service = AnalyticsService(db)

    today = datetime.utcnow()
    start_of_year = today.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    revenue = await analytics_service.get_revenue_summary(start_of_year, today)
    monthly_breakdown = await analytics_service.get_revenue_by_period(
        start_of_year, today, "month"
    )
    customer_summary = await analytics_service.get_customer_summary(start_of_year, today)
    inventory_summary = await analytics_service.get_inventory_summary()

    return {
        "year": today.year,
        "year_start": start_of_year.date().isoformat(),
        "as_of": today.date().isoformat(),
        "revenue": revenue,
        "monthly_breakdown": monthly_breakdown,
        "customer_summary": customer_summary,
        "inventory_summary": inventory_summary
    }
