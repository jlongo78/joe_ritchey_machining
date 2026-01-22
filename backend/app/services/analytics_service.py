"""
Analytics Service - Business intelligence and reporting
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import select, func, and_, extract, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderItem
from app.models.job import Job
from app.models.invoice import Invoice
from app.models.quote import Quote
from app.models.customer import Customer
from app.models.product import Product
from app.models.inventory import Inventory, InventoryTransaction
from app.models.expense import Expense
from app.models.payment import Payment


class AnalyticsService:
    """Service class for analytics and reporting."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # Revenue Analytics

    async def get_revenue_summary(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get overall revenue summary."""
        # E-commerce revenue (orders)
        order_revenue = await self.db.execute(
            select(func.sum(Order.total))
            .where(
                and_(
                    Order.created_at >= start_date,
                    Order.created_at <= end_date,
                    Order.payment_status == "paid"
                )
            )
        )
        ecommerce_revenue = order_revenue.scalar() or Decimal("0")

        # Machining service revenue (invoices)
        invoice_revenue = await self.db.execute(
            select(func.sum(Invoice.amount_paid))
            .where(
                and_(
                    Invoice.created_at >= start_date,
                    Invoice.created_at <= end_date,
                    Invoice.invoice_type == "job"
                )
            )
        )
        service_revenue = invoice_revenue.scalar() or Decimal("0")

        # Total expenses
        expenses = await self.db.execute(
            select(func.sum(Expense.amount))
            .where(
                and_(
                    Expense.expense_date >= start_date.date(),
                    Expense.expense_date <= end_date.date(),
                    Expense.status == "approved"
                )
            )
        )
        total_expenses = expenses.scalar() or Decimal("0")

        total_revenue = ecommerce_revenue + service_revenue
        gross_profit = total_revenue - total_expenses

        return {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "revenue": {
                "total": float(total_revenue),
                "ecommerce": float(ecommerce_revenue),
                "services": float(service_revenue)
            },
            "expenses": float(total_expenses),
            "gross_profit": float(gross_profit),
            "profit_margin": float(gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        }

    async def get_revenue_by_period(
        self,
        start_date: datetime,
        end_date: datetime,
        period: str = "day"  # day, week, month
    ) -> List[Dict[str, Any]]:
        """Get revenue broken down by time period."""
        if period == "day":
            date_trunc = func.date(Order.created_at)
        elif period == "week":
            date_trunc = func.strftime("%Y-%W", Order.created_at)
        else:  # month
            date_trunc = func.strftime("%Y-%m", Order.created_at)

        # E-commerce by period
        order_result = await self.db.execute(
            select(
                date_trunc.label("period"),
                func.sum(Order.total).label("revenue"),
                func.count(Order.id).label("order_count")
            )
            .where(
                and_(
                    Order.created_at >= start_date,
                    Order.created_at <= end_date,
                    Order.payment_status == "paid"
                )
            )
            .group_by(date_trunc)
            .order_by(date_trunc)
        )
        order_data = order_result.all()

        # Invoice by period (for services)
        invoice_result = await self.db.execute(
            select(
                func.date(Invoice.created_at).label("period"),
                func.sum(Invoice.amount_paid).label("revenue"),
                func.count(Invoice.id).label("invoice_count")
            )
            .where(
                and_(
                    Invoice.created_at >= start_date,
                    Invoice.created_at <= end_date,
                    Invoice.invoice_type == "job"
                )
            )
            .group_by(func.date(Invoice.created_at))
            .order_by(func.date(Invoice.created_at))
        )
        invoice_data = invoice_result.all()

        # Combine data
        combined = {}
        for row in order_data:
            period_key = str(row.period)
            combined[period_key] = {
                "period": period_key,
                "ecommerce_revenue": float(row.revenue or 0),
                "ecommerce_orders": row.order_count,
                "service_revenue": 0,
                "service_invoices": 0
            }

        for row in invoice_data:
            period_key = str(row.period)
            if period_key in combined:
                combined[period_key]["service_revenue"] = float(row.revenue or 0)
                combined[period_key]["service_invoices"] = row.invoice_count
            else:
                combined[period_key] = {
                    "period": period_key,
                    "ecommerce_revenue": 0,
                    "ecommerce_orders": 0,
                    "service_revenue": float(row.revenue or 0),
                    "service_invoices": row.invoice_count
                }

        # Add totals
        for key in combined:
            combined[key]["total_revenue"] = (
                combined[key]["ecommerce_revenue"] +
                combined[key]["service_revenue"]
            )

        return sorted(combined.values(), key=lambda x: x["period"])

    # Product Analytics

    async def get_top_products(
        self,
        start_date: datetime,
        end_date: datetime,
        limit: int = 10,
        by: str = "revenue"  # revenue or quantity
    ) -> List[Dict[str, Any]]:
        """Get top selling products."""
        if by == "revenue":
            order_col = func.sum(OrderItem.total_price).desc()
        else:
            order_col = func.sum(OrderItem.quantity).desc()

        result = await self.db.execute(
            select(
                OrderItem.product_id,
                Product.sku,
                Product.name,
                func.sum(OrderItem.quantity).label("total_quantity"),
                func.sum(OrderItem.total_price).label("total_revenue"),
                func.count(OrderItem.id).label("order_count")
            )
            .join(Product, OrderItem.product_id == Product.id)
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                and_(
                    Order.created_at >= start_date,
                    Order.created_at <= end_date,
                    Order.payment_status == "paid"
                )
            )
            .group_by(OrderItem.product_id, Product.sku, Product.name)
            .order_by(order_col)
            .limit(limit)
        )

        return [
            {
                "product_id": row.product_id,
                "sku": row.sku,
                "name": row.name,
                "quantity_sold": row.total_quantity,
                "revenue": float(row.total_revenue or 0),
                "order_count": row.order_count
            }
            for row in result.all()
        ]

    async def get_product_performance(
        self,
        product_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get detailed performance metrics for a product."""
        start_date = datetime.utcnow() - timedelta(days=days)

        # Sales data
        sales_result = await self.db.execute(
            select(
                func.sum(OrderItem.quantity).label("total_quantity"),
                func.sum(OrderItem.total_price).label("total_revenue"),
                func.avg(OrderItem.unit_price).label("avg_price")
            )
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                and_(
                    OrderItem.product_id == product_id,
                    Order.created_at >= start_date,
                    Order.payment_status == "paid"
                )
            )
        )
        sales = sales_result.one()

        # Inventory data
        inventory_result = await self.db.execute(
            select(Inventory).where(Inventory.product_id == product_id)
        )
        inventory = inventory_result.scalar_one_or_none()

        # Daily sales trend
        trend_result = await self.db.execute(
            select(
                func.date(Order.created_at).label("date"),
                func.sum(OrderItem.quantity).label("quantity")
            )
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                and_(
                    OrderItem.product_id == product_id,
                    Order.created_at >= start_date,
                    Order.payment_status == "paid"
                )
            )
            .group_by(func.date(Order.created_at))
            .order_by(func.date(Order.created_at))
        )

        return {
            "product_id": product_id,
            "period_days": days,
            "sales": {
                "total_quantity": sales.total_quantity or 0,
                "total_revenue": float(sales.total_revenue or 0),
                "average_price": float(sales.avg_price or 0)
            },
            "inventory": {
                "quantity_on_hand": inventory.quantity_on_hand if inventory else 0,
                "quantity_available": inventory.quantity_available if inventory else 0,
                "reorder_point": inventory.reorder_point if inventory else 0
            },
            "daily_trend": [
                {"date": str(row.date), "quantity": row.quantity}
                for row in trend_result.all()
            ]
        }

    # Customer Analytics

    async def get_customer_summary(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get customer analytics summary."""
        # New customers
        new_customers = await self.db.execute(
            select(func.count(Customer.id))
            .where(
                and_(
                    Customer.created_at >= start_date,
                    Customer.created_at <= end_date
                )
            )
        )
        new_count = new_customers.scalar() or 0

        # Total customers
        total_customers = await self.db.execute(
            select(func.count(Customer.id))
        )
        total_count = total_customers.scalar() or 0

        # Active customers (with orders/jobs in period)
        active_order_customers = await self.db.execute(
            select(func.count(func.distinct(Order.user_id)))
            .where(
                and_(
                    Order.created_at >= start_date,
                    Order.created_at <= end_date
                )
            )
        )
        active_orders = active_order_customers.scalar() or 0

        active_job_customers = await self.db.execute(
            select(func.count(func.distinct(Job.customer_id)))
            .where(
                and_(
                    Job.created_at >= start_date,
                    Job.created_at <= end_date
                )
            )
        )
        active_jobs = active_job_customers.scalar() or 0

        return {
            "total_customers": total_count,
            "new_customers": new_count,
            "active_customers": {
                "ecommerce": active_orders,
                "services": active_jobs
            }
        }

    async def get_top_customers(
        self,
        start_date: datetime,
        end_date: datetime,
        limit: int = 10,
        customer_type: str = "all"  # all, ecommerce, services
    ) -> List[Dict[str, Any]]:
        """Get top customers by revenue."""
        results = []

        if customer_type in ["all", "services"]:
            # Service customers
            job_result = await self.db.execute(
                select(
                    Customer.id,
                    Customer.company_name,
                    Customer.first_name,
                    Customer.last_name,
                    func.sum(Invoice.amount_paid).label("total_revenue"),
                    func.count(Job.id).label("job_count")
                )
                .join(Job, Customer.id == Job.customer_id)
                .join(Invoice, Job.id == Invoice.job_id, isouter=True)
                .where(
                    and_(
                        Job.created_at >= start_date,
                        Job.created_at <= end_date
                    )
                )
                .group_by(Customer.id)
                .order_by(func.sum(Invoice.amount_paid).desc())
                .limit(limit)
            )

            for row in job_result.all():
                results.append({
                    "customer_id": row.id,
                    "name": row.company_name or f"{row.first_name} {row.last_name}",
                    "type": "services",
                    "total_revenue": float(row.total_revenue or 0),
                    "transaction_count": row.job_count
                })

        return sorted(results, key=lambda x: x["total_revenue"], reverse=True)[:limit]

    # Job/Service Analytics

    async def get_job_statistics(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Get job/service statistics."""
        # Jobs by status
        status_result = await self.db.execute(
            select(Job.status, func.count(Job.id))
            .where(
                and_(
                    Job.created_at >= start_date,
                    Job.created_at <= end_date
                )
            )
            .group_by(Job.status)
        )
        status_counts = {row[0]: row[1] for row in status_result.all()}

        # Average job metrics
        metrics_result = await self.db.execute(
            select(
                func.avg(Job.actual_hours).label("avg_hours"),
                func.avg(Job.total).label("avg_value"),
                func.count(Job.id).label("total_jobs")
            )
            .where(
                and_(
                    Job.created_at >= start_date,
                    Job.created_at <= end_date,
                    Job.status == "completed"
                )
            )
        )
        metrics = metrics_result.one()

        # Quote conversion rate
        quotes_sent = await self.db.execute(
            select(func.count(Quote.id))
            .where(
                and_(
                    Quote.created_at >= start_date,
                    Quote.created_at <= end_date,
                    Quote.status.in_(["sent", "viewed", "approved", "declined", "converted"])
                )
            )
        )
        total_quotes = quotes_sent.scalar() or 0

        quotes_converted = await self.db.execute(
            select(func.count(Quote.id))
            .where(
                and_(
                    Quote.created_at >= start_date,
                    Quote.created_at <= end_date,
                    Quote.status == "converted"
                )
            )
        )
        converted_quotes = quotes_converted.scalar() or 0

        return {
            "total_jobs": sum(status_counts.values()),
            "jobs_by_status": status_counts,
            "completed_jobs": {
                "count": metrics.total_jobs or 0,
                "average_hours": float(metrics.avg_hours or 0),
                "average_value": float(metrics.avg_value or 0)
            },
            "quote_conversion": {
                "total_quotes": total_quotes,
                "converted": converted_quotes,
                "conversion_rate": float(converted_quotes / total_quotes * 100) if total_quotes > 0 else 0
            }
        }

    # Inventory Analytics

    async def get_inventory_summary(self) -> Dict[str, Any]:
        """Get inventory summary."""
        # Total inventory value
        value_result = await self.db.execute(
            select(func.sum(Inventory.quantity_on_hand * Inventory.cost_price))
            .where(
                Inventory.is_active == True,
                Inventory.cost_price.isnot(None)
            )
        )
        total_value = value_result.scalar() or Decimal("0")

        # Low stock items
        low_stock = await self.db.execute(
            select(func.count(Inventory.id))
            .where(
                and_(
                    Inventory.is_active == True,
                    Inventory.track_inventory == True,
                    Inventory.quantity_on_hand - Inventory.quantity_reserved <= Inventory.reorder_point
                )
            )
        )
        low_stock_count = low_stock.scalar() or 0

        # Out of stock
        out_of_stock = await self.db.execute(
            select(func.count(Inventory.id))
            .where(
                and_(
                    Inventory.is_active == True,
                    Inventory.track_inventory == True,
                    Inventory.quantity_on_hand <= 0
                )
            )
        )
        out_of_stock_count = out_of_stock.scalar() or 0

        # Total SKUs
        total_skus = await self.db.execute(
            select(func.count(Inventory.id)).where(Inventory.is_active == True)
        )
        sku_count = total_skus.scalar() or 0

        return {
            "total_value": float(total_value),
            "total_skus": sku_count,
            "low_stock_items": low_stock_count,
            "out_of_stock_items": out_of_stock_count,
            "stock_health": {
                "healthy": sku_count - low_stock_count - out_of_stock_count,
                "low": low_stock_count,
                "out": out_of_stock_count
            }
        }

    async def get_inventory_turnover(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Calculate inventory turnover for products."""
        # Get sales quantities
        sales_result = await self.db.execute(
            select(
                OrderItem.product_id,
                Product.sku,
                Product.name,
                func.sum(OrderItem.quantity).label("quantity_sold")
            )
            .join(Product, OrderItem.product_id == Product.id)
            .join(Order, OrderItem.order_id == Order.id)
            .where(
                and_(
                    Order.created_at >= start_date,
                    Order.created_at <= end_date,
                    Order.payment_status == "paid"
                )
            )
            .group_by(OrderItem.product_id, Product.sku, Product.name)
        )
        sales_data = {row.product_id: row for row in sales_result.all()}

        # Get current inventory
        inventory_result = await self.db.execute(
            select(Inventory)
            .where(Inventory.is_active == True)
        )
        inventory_data = inventory_result.scalars().all()

        results = []
        days_in_period = (end_date - start_date).days or 1

        for inv in inventory_data:
            if inv.product_id in sales_data:
                sales = sales_data[inv.product_id]
                avg_inventory = (inv.quantity_on_hand + sales.quantity_sold) / 2
                if avg_inventory > 0:
                    turnover = sales.quantity_sold / avg_inventory
                    days_of_supply = avg_inventory / (sales.quantity_sold / days_in_period) if sales.quantity_sold > 0 else float('inf')
                else:
                    turnover = 0
                    days_of_supply = float('inf')

                results.append({
                    "product_id": inv.product_id,
                    "sku": sales.sku,
                    "name": sales.name,
                    "quantity_sold": sales.quantity_sold,
                    "current_stock": inv.quantity_on_hand,
                    "turnover_rate": round(turnover, 2),
                    "days_of_supply": round(days_of_supply, 1) if days_of_supply != float('inf') else None
                })

        return sorted(results, key=lambda x: x["turnover_rate"], reverse=True)

    # Dashboard Summary

    async def get_dashboard_summary(self) -> Dict[str, Any]:
        """Get comprehensive dashboard summary."""
        today = datetime.utcnow()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        start_of_year = today.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        # Monthly revenue
        monthly_revenue = await self.get_revenue_summary(start_of_month, today)

        # Year to date
        ytd_revenue = await self.get_revenue_summary(start_of_year, today)

        # Active jobs
        active_jobs = await self.db.execute(
            select(func.count(Job.id))
            .where(Job.status.in_(["pending", "scheduled", "in_progress", "on_hold"]))
        )

        # Pending quotes
        pending_quotes = await self.db.execute(
            select(func.count(Quote.id))
            .where(Quote.status.in_(["sent", "viewed"]))
        )

        # Outstanding invoices
        outstanding = await self.db.execute(
            select(func.sum(Invoice.total - Invoice.amount_paid))
            .where(Invoice.status.in_(["sent", "viewed", "partial"]))
        )

        # Today's orders
        today_start = today.replace(hour=0, minute=0, second=0, microsecond=0)
        todays_orders = await self.db.execute(
            select(func.count(Order.id))
            .where(Order.created_at >= today_start)
        )

        # Inventory alerts
        inventory_summary = await self.get_inventory_summary()

        return {
            "revenue": {
                "mtd": monthly_revenue,
                "ytd": ytd_revenue
            },
            "operations": {
                "active_jobs": active_jobs.scalar() or 0,
                "pending_quotes": pending_quotes.scalar() or 0,
                "todays_orders": todays_orders.scalar() or 0
            },
            "financials": {
                "outstanding_invoices": float(outstanding.scalar() or 0)
            },
            "inventory": {
                "low_stock_alerts": inventory_summary["low_stock_items"],
                "out_of_stock": inventory_summary["out_of_stock_items"]
            },
            "generated_at": today.isoformat()
        }
