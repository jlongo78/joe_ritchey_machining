"""
Analytics and Reporting Schemas
"""

from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field


class DashboardStats(BaseModel):
    """Dashboard statistics schema."""
    # Revenue
    total_revenue_today: Decimal = Decimal("0.00")
    total_revenue_week: Decimal = Decimal("0.00")
    total_revenue_month: Decimal = Decimal("0.00")
    total_revenue_year: Decimal = Decimal("0.00")

    # Orders (E-commerce)
    orders_today: int = 0
    orders_pending: int = 0
    orders_processing: int = 0
    average_order_value: Decimal = Decimal("0.00")

    # Jobs (Machining)
    jobs_in_progress: int = 0
    jobs_scheduled: int = 0
    jobs_completed_today: int = 0
    jobs_overdue: int = 0

    # Quotes
    quotes_pending: int = 0
    quotes_approved_month: int = 0
    quote_conversion_rate: float = 0.0

    # Invoices
    invoices_unpaid: int = 0
    invoices_overdue: int = 0
    outstanding_balance: Decimal = Decimal("0.00")

    # Inventory
    low_stock_items: int = 0
    out_of_stock_items: int = 0

    # Customers
    new_customers_month: int = 0
    total_customers: int = 0


class RevenueData(BaseModel):
    """Revenue data point schema."""
    date: date
    ecommerce_revenue: Decimal = Decimal("0.00")
    service_revenue: Decimal = Decimal("0.00")
    total_revenue: Decimal = Decimal("0.00")
    order_count: int = 0
    job_count: int = 0


class SalesReport(BaseModel):
    """Sales report schema."""
    period_start: date
    period_end: date
    total_revenue: Decimal = Decimal("0.00")
    ecommerce_revenue: Decimal = Decimal("0.00")
    service_revenue: Decimal = Decimal("0.00")
    total_orders: int = 0
    total_jobs: int = 0
    average_order_value: Decimal = Decimal("0.00")
    average_job_value: Decimal = Decimal("0.00")
    revenue_by_day: List[RevenueData] = []
    top_products: List[dict] = []
    top_services: List[dict] = []


class JobMetrics(BaseModel):
    """Job performance metrics schema."""
    period_start: date
    period_end: date
    total_jobs: int = 0
    completed_jobs: int = 0
    average_completion_time_hours: float = 0.0
    on_time_completion_rate: float = 0.0
    total_labor_hours: Decimal = Decimal("0.00")
    total_labor_revenue: Decimal = Decimal("0.00")
    total_parts_revenue: Decimal = Decimal("0.00")
    jobs_by_type: dict = {}
    jobs_by_technician: List[dict] = []


class CustomerMetrics(BaseModel):
    """Customer metrics schema."""
    period_start: date
    period_end: date
    total_customers: int = 0
    new_customers: int = 0
    returning_customers: int = 0
    customer_retention_rate: float = 0.0
    average_customer_value: Decimal = Decimal("0.00")
    top_customers: List[dict] = []
    customer_acquisition_by_source: dict = {}


class InventoryMetrics(BaseModel):
    """Inventory metrics schema."""
    total_sku_count: int = 0
    total_inventory_value: Decimal = Decimal("0.00")
    low_stock_items: List[dict] = []
    out_of_stock_items: List[dict] = []
    top_selling_products: List[dict] = []
    slow_moving_products: List[dict] = []
    inventory_turnover_rate: float = 0.0


class FinancialSummary(BaseModel):
    """Financial summary schema."""
    period_start: date
    period_end: date
    gross_revenue: Decimal = Decimal("0.00")
    cost_of_goods: Decimal = Decimal("0.00")
    gross_profit: Decimal = Decimal("0.00")
    gross_margin_percent: float = 0.0
    expenses: Decimal = Decimal("0.00")
    net_profit: Decimal = Decimal("0.00")
    net_margin_percent: float = 0.0
    accounts_receivable: Decimal = Decimal("0.00")
    accounts_payable: Decimal = Decimal("0.00")


class ReportFilter(BaseModel):
    """Report filter parameters."""
    start_date: date
    end_date: date
    group_by: str = Field(default="day", pattern="^(day|week|month|year)$")
    customer_id: Optional[int] = None
    category_id: Optional[int] = None
    employee_id: Optional[int] = None
