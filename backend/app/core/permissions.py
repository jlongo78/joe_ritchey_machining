"""
Permission and role-based access control utilities.
"""

from enum import Enum
from typing import List, Optional
from functools import wraps
from fastapi import Depends, HTTPException, status

from app.core.exceptions import PermissionDeniedError, InsufficientRoleError


class UserRole(str, Enum):
    """User roles in the system."""
    ADMIN = "admin"
    MANAGER = "manager"
    TECHNICIAN = "technician"
    FRONT_DESK = "front_desk"
    CUSTOMER = "customer"


class Permission(str, Enum):
    """Permission types in the system."""
    # User Management
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"

    # Customer Management
    CUSTOMER_CREATE = "customer:create"
    CUSTOMER_READ = "customer:read"
    CUSTOMER_UPDATE = "customer:update"
    CUSTOMER_DELETE = "customer:delete"

    # Product Management (E-commerce)
    PRODUCT_CREATE = "product:create"
    PRODUCT_READ = "product:read"
    PRODUCT_UPDATE = "product:update"
    PRODUCT_DELETE = "product:delete"

    # Order Management (E-commerce)
    ORDER_READ = "order:read"
    ORDER_UPDATE = "order:update"
    ORDER_CANCEL = "order:cancel"
    ORDER_REFUND = "order:refund"

    # Job Management (Machining)
    JOB_CREATE = "job:create"
    JOB_READ = "job:read"
    JOB_UPDATE = "job:update"
    JOB_DELETE = "job:delete"
    JOB_ASSIGN = "job:assign"

    # Quote Management
    QUOTE_CREATE = "quote:create"
    QUOTE_READ = "quote:read"
    QUOTE_UPDATE = "quote:update"
    QUOTE_DELETE = "quote:delete"
    QUOTE_SEND = "quote:send"

    # Invoice Management
    INVOICE_CREATE = "invoice:create"
    INVOICE_READ = "invoice:read"
    INVOICE_UPDATE = "invoice:update"
    INVOICE_DELETE = "invoice:delete"
    INVOICE_SEND = "invoice:send"

    # Payment Management
    PAYMENT_CREATE = "payment:create"
    PAYMENT_READ = "payment:read"
    PAYMENT_REFUND = "payment:refund"

    # Inventory Management
    INVENTORY_READ = "inventory:read"
    INVENTORY_UPDATE = "inventory:update"
    INVENTORY_ADJUST = "inventory:adjust"

    # Supplier Management
    SUPPLIER_CREATE = "supplier:create"
    SUPPLIER_READ = "supplier:read"
    SUPPLIER_UPDATE = "supplier:update"
    SUPPLIER_DELETE = "supplier:delete"

    # Pricing Management
    PRICING_READ = "pricing:read"
    PRICING_UPDATE = "pricing:update"
    PRICING_RULES = "pricing:rules"

    # Schedule Management
    SCHEDULE_READ = "schedule:read"
    SCHEDULE_UPDATE = "schedule:update"

    # Equipment Management
    EQUIPMENT_READ = "equipment:read"
    EQUIPMENT_UPDATE = "equipment:update"

    # Time Tracking
    TIME_ENTRY_CREATE = "time_entry:create"
    TIME_ENTRY_READ = "time_entry:read"
    TIME_ENTRY_UPDATE = "time_entry:update"
    TIME_ENTRY_APPROVE = "time_entry:approve"

    # Reports & Analytics
    REPORTS_VIEW = "reports:view"
    ANALYTICS_VIEW = "analytics:view"

    # Settings
    SETTINGS_READ = "settings:read"
    SETTINGS_UPDATE = "settings:update"

    # Communications
    COMMUNICATION_SEND = "communication:send"
    COMMUNICATION_READ = "communication:read"

    # Legacy/Convenience Permissions (used in endpoint files)
    # Product Management
    MANAGE_PRODUCTS = "products:manage"

    # Inventory Management
    VIEW_INVENTORY = "inventory:view"
    MANAGE_INVENTORY = "inventory:manage"

    # Financial
    VIEW_FINANCIALS = "financials:view"

    # Job Management
    VIEW_JOBS = "jobs:view"
    CREATE_JOBS = "jobs:create"
    MANAGE_JOBS = "jobs:manage"

    # Order Management
    VIEW_ALL_ORDERS = "orders:view_all"
    MANAGE_ORDERS = "orders:manage"

    # Quote Management
    VIEW_QUOTES = "quotes:view"
    CREATE_QUOTES = "quotes:create"

    # Pricing Management
    MANAGE_PRICING = "pricing:manage"
    VIEW_PRICING = "pricing:view"

    # Invoice Management
    VIEW_INVOICES = "invoices:view"
    CREATE_INVOICES = "invoices:create"
    MANAGE_INVOICES = "invoices:manage"

    # Payment Management
    RECORD_PAYMENTS = "payments:record"

    # Analytics
    VIEW_ANALYTICS = "analytics:view"

    # Customer Management
    VIEW_CUSTOMERS = "customers:view"
    MANAGE_CUSTOMERS = "customers:manage"


# Role to permission mappings
ROLE_PERMISSIONS = {
    UserRole.ADMIN: list(Permission),  # Admin has all permissions
    UserRole.MANAGER: [
        # User Management
        Permission.USER_READ,
        Permission.USER_CREATE,
        Permission.USER_UPDATE,

        # Customer Management
        Permission.CUSTOMER_CREATE,
        Permission.CUSTOMER_READ,
        Permission.CUSTOMER_UPDATE,
        Permission.CUSTOMER_DELETE,

        # Product Management
        Permission.PRODUCT_CREATE,
        Permission.PRODUCT_READ,
        Permission.PRODUCT_UPDATE,
        Permission.PRODUCT_DELETE,

        # Order Management
        Permission.ORDER_READ,
        Permission.ORDER_UPDATE,
        Permission.ORDER_CANCEL,
        Permission.ORDER_REFUND,

        # Job Management
        Permission.JOB_CREATE,
        Permission.JOB_READ,
        Permission.JOB_UPDATE,
        Permission.JOB_DELETE,
        Permission.JOB_ASSIGN,

        # Quote Management
        Permission.QUOTE_CREATE,
        Permission.QUOTE_READ,
        Permission.QUOTE_UPDATE,
        Permission.QUOTE_DELETE,
        Permission.QUOTE_SEND,

        # Invoice Management
        Permission.INVOICE_CREATE,
        Permission.INVOICE_READ,
        Permission.INVOICE_UPDATE,
        Permission.INVOICE_DELETE,
        Permission.INVOICE_SEND,

        # Payment Management
        Permission.PAYMENT_CREATE,
        Permission.PAYMENT_READ,
        Permission.PAYMENT_REFUND,

        # Inventory Management
        Permission.INVENTORY_READ,
        Permission.INVENTORY_UPDATE,
        Permission.INVENTORY_ADJUST,

        # Supplier Management
        Permission.SUPPLIER_CREATE,
        Permission.SUPPLIER_READ,
        Permission.SUPPLIER_UPDATE,

        # Pricing Management
        Permission.PRICING_READ,
        Permission.PRICING_UPDATE,
        Permission.PRICING_RULES,

        # Schedule Management
        Permission.SCHEDULE_READ,
        Permission.SCHEDULE_UPDATE,

        # Equipment Management
        Permission.EQUIPMENT_READ,
        Permission.EQUIPMENT_UPDATE,

        # Time Tracking
        Permission.TIME_ENTRY_CREATE,
        Permission.TIME_ENTRY_READ,
        Permission.TIME_ENTRY_UPDATE,
        Permission.TIME_ENTRY_APPROVE,

        # Reports & Analytics
        Permission.REPORTS_VIEW,
        Permission.ANALYTICS_VIEW,

        # Settings
        Permission.SETTINGS_READ,

        # Communications
        Permission.COMMUNICATION_SEND,
        Permission.COMMUNICATION_READ,

        # Legacy/Convenience Permissions for Manager
        Permission.MANAGE_PRODUCTS,
        Permission.VIEW_INVENTORY,
        Permission.MANAGE_INVENTORY,
        Permission.VIEW_FINANCIALS,
        Permission.VIEW_JOBS,
        Permission.CREATE_JOBS,
        Permission.MANAGE_JOBS,
        Permission.VIEW_ALL_ORDERS,
        Permission.MANAGE_ORDERS,
        Permission.VIEW_QUOTES,
        Permission.CREATE_QUOTES,
        Permission.MANAGE_PRICING,
        Permission.VIEW_PRICING,
        Permission.VIEW_INVOICES,
        Permission.CREATE_INVOICES,
        Permission.MANAGE_INVOICES,
        Permission.RECORD_PAYMENTS,
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_CUSTOMERS,
        Permission.MANAGE_CUSTOMERS,
    ],
    UserRole.TECHNICIAN: [
        Permission.CUSTOMER_READ,
        Permission.JOB_READ,
        Permission.JOB_UPDATE,
        Permission.QUOTE_READ,
        Permission.INVENTORY_READ,
        Permission.SCHEDULE_READ,
        Permission.EQUIPMENT_READ,
        Permission.TIME_ENTRY_CREATE,
        Permission.TIME_ENTRY_READ,
        Permission.TIME_ENTRY_UPDATE,

        # Legacy/Convenience Permissions for Technician
        Permission.VIEW_INVENTORY,
        Permission.VIEW_JOBS,
        Permission.VIEW_QUOTES,
        Permission.VIEW_CUSTOMERS,
    ],
    UserRole.FRONT_DESK: [
        Permission.CUSTOMER_CREATE,
        Permission.CUSTOMER_READ,
        Permission.CUSTOMER_UPDATE,
        Permission.ORDER_READ,
        Permission.JOB_CREATE,
        Permission.JOB_READ,
        Permission.QUOTE_CREATE,
        Permission.QUOTE_READ,
        Permission.QUOTE_UPDATE,
        Permission.QUOTE_SEND,
        Permission.INVOICE_READ,
        Permission.INVOICE_SEND,
        Permission.PAYMENT_CREATE,
        Permission.PAYMENT_READ,
        Permission.SCHEDULE_READ,
        Permission.SCHEDULE_UPDATE,
        Permission.COMMUNICATION_SEND,
        Permission.COMMUNICATION_READ,

        # Legacy/Convenience Permissions for Front Desk
        Permission.VIEW_JOBS,
        Permission.CREATE_JOBS,
        Permission.VIEW_QUOTES,
        Permission.CREATE_QUOTES,
        Permission.VIEW_INVOICES,
        Permission.CREATE_INVOICES,
        Permission.RECORD_PAYMENTS,
        Permission.VIEW_CUSTOMERS,
        Permission.MANAGE_CUSTOMERS,
    ],
    UserRole.CUSTOMER: [
        # Customers have limited permissions (mostly for portal)
        Permission.ORDER_READ,  # Their own orders
        Permission.QUOTE_READ,  # Their own quotes
        Permission.JOB_READ,  # Their own jobs
        Permission.INVOICE_READ,  # Their own invoices

        # Legacy/Convenience Permissions for Customer (view only for their own data)
        Permission.VIEW_JOBS,
        Permission.VIEW_QUOTES,
        Permission.VIEW_INVOICES,
    ],
}


def get_role_permissions(role: UserRole) -> List[Permission]:
    """Get permissions for a given role."""
    return ROLE_PERMISSIONS.get(role, [])


def has_permission(role: UserRole, permission: Permission) -> bool:
    """Check if a role has a specific permission."""
    return permission in get_role_permissions(role)


def has_any_permission(role: UserRole, permissions: List[Permission]) -> bool:
    """Check if a role has any of the specified permissions."""
    role_permissions = get_role_permissions(role)
    return any(p in role_permissions for p in permissions)


def has_all_permissions(role: UserRole, permissions: List[Permission]) -> bool:
    """Check if a role has all of the specified permissions."""
    role_permissions = get_role_permissions(role)
    return all(p in role_permissions for p in permissions)


# Role hierarchy for comparison
ROLE_HIERARCHY = {
    UserRole.ADMIN: 4,
    UserRole.MANAGER: 3,
    UserRole.TECHNICIAN: 2,
    UserRole.FRONT_DESK: 2,
    UserRole.CUSTOMER: 1,
}


def is_role_sufficient(user_role: UserRole, required_role: UserRole) -> bool:
    """Check if user's role is at least as high as required role."""
    return ROLE_HIERARCHY.get(user_role, 0) >= ROLE_HIERARCHY.get(required_role, 0)


def require_role(required_role: UserRole):
    """Decorator to require a minimum role for an endpoint."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # The actual check happens in the dependency
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_permission(permission: Permission):
    """Decorator to require a specific permission for an endpoint."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # The actual check happens in the dependency
            return await func(*args, **kwargs)
        return wrapper
    return decorator
