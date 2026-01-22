"""
Pricing Service - Automated supplier price monitoring and adjustment engine
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import asyncio
import httpx
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product
from app.models.supplier import Supplier, SupplierAPIConfig, ProductSupplier
from app.models.price_history import (
    PriceHistory, PriceAdjustmentRule, PriceAdjustmentLog, CompetitorConfig
)
from app.core.config import settings
from app.core.exceptions import NotFoundError, BusinessLogicError


class PricingService:
    """Service class for automated pricing operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.http_client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        """Close HTTP client."""
        await self.http_client.aclose()

    # Supplier Price Fetching

    async def fetch_supplier_prices(self, supplier_id: int) -> Dict[str, Any]:
        """Fetch prices from a supplier's API."""
        # Get supplier and API config
        result = await self.db.execute(
            select(Supplier)
            .options(selectinload(Supplier.api_config))
            .where(Supplier.id == supplier_id, Supplier.is_active == True)
        )
        supplier = result.scalar_one_or_none()

        if not supplier or not supplier.api_config:
            raise NotFoundError("Supplier or API configuration")

        config = supplier.api_config

        if not config.is_active:
            raise BusinessLogicError("Supplier API is not active")

        # Build request
        headers = {}
        if config.api_key:
            headers[config.api_key_header or "X-API-Key"] = config.api_key
        if config.auth_token:
            headers["Authorization"] = f"Bearer {config.auth_token}"

        try:
            response = await self.http_client.request(
                method=config.request_method or "GET",
                url=config.base_url + (config.price_endpoint or ""),
                headers=headers,
                timeout=config.timeout_seconds or 30
            )
            response.raise_for_status()

            # Update last sync
            config.last_sync_at = datetime.utcnow()
            config.last_sync_status = "success"

            return {
                "supplier_id": supplier_id,
                "supplier_name": supplier.name,
                "status": "success",
                "data": response.json(),
                "fetched_at": datetime.utcnow().isoformat()
            }

        except httpx.HTTPError as e:
            config.last_sync_status = "error"
            config.last_sync_error = str(e)
            raise BusinessLogicError(f"Failed to fetch prices from {supplier.name}: {str(e)}")

    async def sync_supplier_prices(self, supplier_id: int) -> Dict[str, Any]:
        """Sync and update product prices from a supplier."""
        # Fetch current prices
        price_data = await self.fetch_supplier_prices(supplier_id)

        # Get products from this supplier
        result = await self.db.execute(
            select(ProductSupplier)
            .options(selectinload(ProductSupplier.product))
            .where(ProductSupplier.supplier_id == supplier_id, ProductSupplier.is_active == True)
        )
        product_suppliers = result.scalars().all()

        updated_count = 0
        errors = []

        # This is a template - actual implementation depends on supplier API response format
        # You would parse price_data["data"] according to supplier's response structure
        supplier_prices = self._parse_supplier_response(price_data.get("data", {}))

        for ps in product_suppliers:
            try:
                supplier_sku = ps.supplier_sku
                if supplier_sku in supplier_prices:
                    new_cost = Decimal(str(supplier_prices[supplier_sku]))

                    if new_cost != ps.cost_price:
                        # Record price history
                        history = PriceHistory(
                            product_id=ps.product_id,
                            supplier_id=supplier_id,
                            price_type="cost",
                            old_price=ps.cost_price,
                            new_price=new_cost,
                            change_source="supplier_sync",
                            change_reason=f"Supplier price update"
                        )
                        self.db.add(history)

                        # Update product supplier cost
                        ps.cost_price = new_cost
                        ps.last_price_update = datetime.utcnow()

                        # Check if we should auto-adjust retail price
                        await self._check_auto_adjust(ps.product, new_cost)

                        updated_count += 1

            except Exception as e:
                errors.append({
                    "product_id": ps.product_id,
                    "error": str(e)
                })

        await self.db.flush()

        return {
            "supplier_id": supplier_id,
            "products_checked": len(product_suppliers),
            "products_updated": updated_count,
            "errors": errors,
            "synced_at": datetime.utcnow().isoformat()
        }

    def _parse_supplier_response(self, data: Dict) -> Dict[str, Decimal]:
        """
        Parse supplier API response to extract prices.
        This is a template - implement based on actual supplier API formats.
        """
        prices = {}

        # Example formats that might be returned:
        # Format 1: {"items": [{"sku": "ABC123", "price": 10.99}, ...]}
        if "items" in data:
            for item in data["items"]:
                if "sku" in item and "price" in item:
                    prices[item["sku"]] = Decimal(str(item["price"]))

        # Format 2: {"ABC123": 10.99, "DEF456": 20.99, ...}
        elif isinstance(data, dict) and not any(isinstance(v, dict) for v in data.values()):
            for sku, price in data.items():
                try:
                    prices[sku] = Decimal(str(price))
                except:
                    pass

        # Format 3: {"products": {"ABC123": {"price": 10.99}, ...}}
        elif "products" in data:
            for sku, details in data["products"].items():
                if isinstance(details, dict) and "price" in details:
                    prices[sku] = Decimal(str(details["price"]))

        return prices

    # Price Adjustment Rules

    async def get_adjustment_rules(
        self,
        product_id: Optional[int] = None,
        category_id: Optional[int] = None,
        is_active: bool = True
    ) -> List[PriceAdjustmentRule]:
        """Get price adjustment rules."""
        query = select(PriceAdjustmentRule)

        if product_id:
            query = query.where(PriceAdjustmentRule.product_id == product_id)
        if category_id:
            query = query.where(PriceAdjustmentRule.category_id == category_id)
        if is_active:
            query = query.where(PriceAdjustmentRule.is_active == True)

        result = await self.db.execute(query.order_by(PriceAdjustmentRule.priority.desc()))
        return list(result.scalars().all())

    async def create_adjustment_rule(
        self,
        rule_type: str,
        adjustment_type: str,
        adjustment_value: Decimal,
        name: str,
        product_id: Optional[int] = None,
        category_id: Optional[int] = None,
        brand_id: Optional[int] = None,
        min_margin: Optional[Decimal] = None,
        max_margin: Optional[Decimal] = None,
        priority: int = 0,
        user_id: Optional[int] = None
    ) -> PriceAdjustmentRule:
        """Create a price adjustment rule."""
        rule = PriceAdjustmentRule(
            name=name,
            rule_type=rule_type,
            product_id=product_id,
            category_id=category_id,
            brand_id=brand_id,
            adjustment_type=adjustment_type,
            adjustment_value=adjustment_value,
            min_margin=min_margin,
            max_margin=max_margin,
            priority=priority,
            is_active=True,
            created_by=user_id
        )
        self.db.add(rule)
        await self.db.flush()
        await self.db.refresh(rule)
        return rule

    async def _check_auto_adjust(self, product: Product, new_cost: Decimal):
        """Check if product price should be auto-adjusted based on rules."""
        # Get applicable rules
        rules = await self.db.execute(
            select(PriceAdjustmentRule)
            .where(
                PriceAdjustmentRule.is_active == True,
                PriceAdjustmentRule.rule_type == "cost_plus"
            )
            .order_by(PriceAdjustmentRule.priority.desc())
        )
        rules = rules.scalars().all()

        applicable_rule = None
        for rule in rules:
            # Check if rule applies to this product
            if rule.product_id and rule.product_id == product.id:
                applicable_rule = rule
                break
            elif rule.category_id:
                # Check if product is in this category
                # Would need to check product.categories
                pass
            elif rule.brand_id and rule.brand_id == product.brand_id:
                applicable_rule = rule
                break
            elif not rule.product_id and not rule.category_id and not rule.brand_id:
                # Global rule
                applicable_rule = rule

        if applicable_rule:
            await self.apply_adjustment_rule(product.id, applicable_rule.id, new_cost)

    async def apply_adjustment_rule(
        self,
        product_id: int,
        rule_id: int,
        base_cost: Optional[Decimal] = None
    ) -> Product:
        """Apply a price adjustment rule to a product."""
        # Get product
        result = await self.db.execute(
            select(Product).where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise NotFoundError("Product")

        # Get rule
        rule_result = await self.db.execute(
            select(PriceAdjustmentRule).where(PriceAdjustmentRule.id == rule_id)
        )
        rule = rule_result.scalar_one_or_none()
        if not rule:
            raise NotFoundError("Price adjustment rule")

        # Use provided cost or product's base cost
        cost = base_cost or product.base_cost
        if not cost:
            raise BusinessLogicError("No cost available for price calculation")

        old_price = product.retail_price

        # Calculate new price based on rule type
        if rule.adjustment_type == "percentage":
            # Cost plus percentage markup
            markup = cost * (rule.adjustment_value / 100)
            new_price = cost + markup
        elif rule.adjustment_type == "fixed":
            # Fixed markup
            new_price = cost + rule.adjustment_value
        elif rule.adjustment_type == "multiplier":
            # Cost multiplier
            new_price = cost * rule.adjustment_value
        else:
            raise BusinessLogicError(f"Unknown adjustment type: {rule.adjustment_type}")

        # Round to 2 decimal places
        new_price = new_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Check margin constraints
        margin = ((new_price - cost) / new_price * 100) if new_price > 0 else Decimal("0")

        if rule.min_margin and margin < rule.min_margin:
            # Adjust price to meet minimum margin
            new_price = cost / (1 - rule.min_margin / 100)
            new_price = new_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if rule.max_margin and margin > rule.max_margin:
            # Cap price at maximum margin
            new_price = cost / (1 - rule.max_margin / 100)
            new_price = new_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # Update product price
        if new_price != old_price:
            # Record history
            history = PriceHistory(
                product_id=product_id,
                price_type="retail",
                old_price=old_price,
                new_price=new_price,
                change_source="rule_application",
                change_reason=f"Rule: {rule.name}"
            )
            self.db.add(history)

            # Log the adjustment
            log = PriceAdjustmentLog(
                product_id=product_id,
                rule_id=rule_id,
                old_price=old_price,
                new_price=new_price,
                cost_at_adjustment=cost,
                margin_achieved=float(margin)
            )
            self.db.add(log)

            product.retail_price = new_price

        await self.db.flush()
        await self.db.refresh(product)
        return product

    # Competitor Price Monitoring

    async def fetch_competitor_prices(self, competitor_id: int) -> Dict[str, Any]:
        """Fetch prices from a competitor's website/API."""
        result = await self.db.execute(
            select(CompetitorConfig).where(CompetitorConfig.id == competitor_id)
        )
        competitor = result.scalar_one_or_none()

        if not competitor:
            raise NotFoundError("Competitor configuration")

        if not competitor.is_active:
            raise BusinessLogicError("Competitor monitoring is not active")

        # This would typically involve web scraping or API calls
        # Placeholder for actual implementation
        try:
            if competitor.api_endpoint:
                response = await self.http_client.get(
                    competitor.api_endpoint,
                    headers={"User-Agent": "PriceMonitor/1.0"}
                )
                response.raise_for_status()

                competitor.last_check_at = datetime.utcnow()
                competitor.last_check_status = "success"

                return {
                    "competitor_id": competitor_id,
                    "competitor_name": competitor.name,
                    "status": "success",
                    "data": response.json(),
                    "fetched_at": datetime.utcnow().isoformat()
                }
            else:
                # Web scraping would go here
                raise BusinessLogicError("No API endpoint configured for competitor")

        except httpx.HTTPError as e:
            competitor.last_check_status = "error"
            competitor.last_check_error = str(e)
            raise BusinessLogicError(f"Failed to fetch competitor prices: {str(e)}")

    # Price Analysis

    async def get_price_history(
        self,
        product_id: int,
        days: int = 30
    ) -> List[PriceHistory]:
        """Get price history for a product."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        result = await self.db.execute(
            select(PriceHistory)
            .where(
                PriceHistory.product_id == product_id,
                PriceHistory.created_at >= cutoff
            )
            .order_by(PriceHistory.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_margin_analysis(
        self,
        product_id: Optional[int] = None,
        category_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Analyze margins for products."""
        query = select(Product).where(Product.is_active == True)

        if product_id:
            query = query.where(Product.id == product_id)
        # category filtering would need join

        result = await self.db.execute(query)
        products = result.scalars().all()

        margins = []
        for product in products:
            if product.base_cost and product.retail_price:
                margin = ((product.retail_price - product.base_cost) / product.retail_price * 100)
                margins.append({
                    "product_id": product.id,
                    "sku": product.sku,
                    "name": product.name,
                    "cost": float(product.base_cost),
                    "price": float(product.retail_price),
                    "margin_percent": float(margin),
                    "margin_amount": float(product.retail_price - product.base_cost)
                })

        if not margins:
            return {
                "average_margin": 0,
                "min_margin": 0,
                "max_margin": 0,
                "products": []
            }

        margin_values = [m["margin_percent"] for m in margins]

        return {
            "average_margin": sum(margin_values) / len(margin_values),
            "min_margin": min(margin_values),
            "max_margin": max(margin_values),
            "products_analyzed": len(margins),
            "products": sorted(margins, key=lambda x: x["margin_percent"])
        }

    async def bulk_price_update(
        self,
        product_ids: List[int],
        adjustment_type: str,
        adjustment_value: Decimal,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Bulk update prices for multiple products."""
        updated = 0
        errors = []

        for product_id in product_ids:
            try:
                result = await self.db.execute(
                    select(Product).where(Product.id == product_id)
                )
                product = result.scalar_one_or_none()

                if not product:
                    errors.append({"product_id": product_id, "error": "Not found"})
                    continue

                old_price = product.retail_price

                if adjustment_type == "percentage":
                    change = old_price * (adjustment_value / 100)
                    new_price = old_price + change
                elif adjustment_type == "fixed":
                    new_price = old_price + adjustment_value
                elif adjustment_type == "set":
                    new_price = adjustment_value
                else:
                    errors.append({"product_id": product_id, "error": "Invalid adjustment type"})
                    continue

                new_price = new_price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

                if new_price != old_price:
                    # Record history
                    history = PriceHistory(
                        product_id=product_id,
                        price_type="retail",
                        old_price=old_price,
                        new_price=new_price,
                        change_source="bulk_update",
                        change_reason=f"Bulk update: {adjustment_type} {adjustment_value}",
                        changed_by=user_id
                    )
                    self.db.add(history)

                    product.retail_price = new_price
                    updated += 1

            except Exception as e:
                errors.append({"product_id": product_id, "error": str(e)})

        await self.db.flush()

        return {
            "products_processed": len(product_ids),
            "products_updated": updated,
            "errors": errors,
            "updated_at": datetime.utcnow().isoformat()
        }

    async def schedule_price_sync(
        self,
        supplier_id: int,
        sync_interval_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Schedule periodic price synchronization.
        Note: This creates a record - actual scheduling would be done by Celery/cron.
        """
        result = await self.db.execute(
            select(SupplierAPIConfig).where(SupplierAPIConfig.supplier_id == supplier_id)
        )
        config = result.scalar_one_or_none()

        if not config:
            raise NotFoundError("Supplier API configuration")

        config.sync_interval_hours = sync_interval_hours
        config.next_sync_at = datetime.utcnow() + timedelta(hours=sync_interval_hours)

        await self.db.flush()

        return {
            "supplier_id": supplier_id,
            "sync_interval_hours": sync_interval_hours,
            "next_sync_at": config.next_sync_at.isoformat()
        }

    async def get_suppliers_due_for_sync(self) -> List[Supplier]:
        """Get suppliers that need price synchronization."""
        result = await self.db.execute(
            select(Supplier)
            .join(SupplierAPIConfig)
            .where(
                SupplierAPIConfig.is_active == True,
                SupplierAPIConfig.next_sync_at <= datetime.utcnow()
            )
        )
        return list(result.scalars().all())
