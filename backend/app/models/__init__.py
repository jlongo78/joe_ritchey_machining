"""
Database Models Package
All SQLAlchemy models for the unified platform.
"""

from app.models.user import User, UserAddress, PasswordResetToken
from app.models.customer import Customer, CustomerContact, CustomerVehicle, CustomerNote
from app.models.employee import Employee, EmployeeAvailability
from app.models.time_entry import TimeEntry
from app.models.product import (
    Product, ProductImage, ProductAttribute, ProductVariant,
    ProductCategory as ProductCategoryAssociation
)
from app.models.category import Category
from app.models.brand import Brand
from app.models.inventory import Inventory, InventoryTransaction, InventoryCategory
from app.models.supplier import Supplier, SupplierAPIConfig, ProductSupplier
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.payment import Payment, Refund
from app.models.coupon import Coupon, CouponUsage
from app.models.review import Review
from app.models.wishlist import Wishlist, WishlistItem
from app.models.vehicle import VehicleMake, VehicleModel, VehicleYear, ProductFitment
from app.models.price_history import (
    PriceHistory, PriceAdjustmentRule, PriceAdjustmentLog, CompetitorConfig
)
from app.models.notification import NotificationSubscription
from app.models.service_request import ServiceRequest, ServiceRequestItem, ServiceRequestFile, ServiceType
from app.models.quote import Quote, QuoteItem
from app.models.job import Job, JobTask, JobPart, JobLabor, JobNote, JobFile, JobStatusHistory
from app.models.schedule import ScheduleEvent, ShopBay, ShopHours, ShopClosure
from app.models.invoice import Invoice, InvoiceItem
from app.models.expense import Expense, ExpenseCategory
from app.models.bank_account import BankAccount, BankTransaction
from app.models.communication import Communication, CommunicationTemplate, CommunicationAttachment
from app.models.equipment import Equipment, EquipmentMaintenance
from app.models.dyno import DynoSession, DynoRun
from app.models.settings import Setting, TaxRate, LaborRate
from app.models.audit import AuditLog, SystemNotification

__all__ = [
    # User & Auth
    "User", "UserAddress", "PasswordResetToken",

    # Customer & CRM
    "Customer", "CustomerContact", "CustomerVehicle", "CustomerNote",

    # Employee & HR
    "Employee", "EmployeeAvailability", "TimeEntry",

    # E-commerce: Products
    "Product", "ProductImage", "ProductAttribute", "ProductVariant",
    "Category", "Brand", "ProductCategoryAssociation",

    # E-commerce: Inventory
    "Inventory", "InventoryTransaction", "InventoryCategory",

    # E-commerce: Suppliers
    "Supplier", "SupplierAPIConfig", "ProductSupplier",

    # E-commerce: Cart & Orders
    "Cart", "CartItem", "Order", "OrderItem", "OrderStatusHistory",

    # E-commerce: Payment
    "Payment", "Refund",

    # E-commerce: Promotions
    "Coupon", "CouponUsage",

    # E-commerce: Reviews & Wishlists
    "Review", "Wishlist", "WishlistItem",

    # E-commerce: Vehicle Fitment
    "VehicleMake", "VehicleModel", "VehicleYear", "ProductFitment",

    # E-commerce: Pricing
    "PriceHistory", "PriceAdjustmentRule", "PriceAdjustmentLog", "CompetitorConfig",

    # E-commerce: Notifications
    "NotificationSubscription",

    # Machining: Service Requests
    "ServiceRequest", "ServiceRequestItem", "ServiceRequestFile", "ServiceType",

    # Machining: Quotes
    "Quote", "QuoteItem",

    # Machining: Jobs
    "Job", "JobTask", "JobPart", "JobLabor", "JobNote", "JobFile", "JobStatusHistory",

    # Machining: Scheduling
    "ScheduleEvent", "ShopBay", "ShopHours", "ShopClosure",

    # Accounting
    "Invoice", "InvoiceItem", "Expense", "ExpenseCategory",
    "BankAccount", "BankTransaction",

    # Communication
    "Communication", "CommunicationTemplate", "CommunicationAttachment",

    # Equipment
    "Equipment", "EquipmentMaintenance",

    # Dyno
    "DynoSession", "DynoRun",

    # Settings & System
    "Setting", "TaxRate", "LaborRate",
    "AuditLog", "SystemNotification",
]
