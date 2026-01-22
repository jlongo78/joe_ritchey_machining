"""
API v1 Router - Combines all endpoint routers
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    products,
    cart,
    orders,
    quotes,
    jobs,
    invoices,
    customers,
    inventory,
    pricing,
    analytics
)

api_router = APIRouter()

# Authentication
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

# Users
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)

# E-commerce
api_router.include_router(
    products.router,
    prefix="/products",
    tags=["Products"]
)

api_router.include_router(
    cart.router,
    prefix="/cart",
    tags=["Cart"]
)

api_router.include_router(
    orders.router,
    prefix="/orders",
    tags=["Orders"]
)

# Machining Services
api_router.include_router(
    quotes.router,
    prefix="/quotes",
    tags=["Quotes"]
)

api_router.include_router(
    jobs.router,
    prefix="/jobs",
    tags=["Jobs"]
)

# Business Management
api_router.include_router(
    invoices.router,
    prefix="/invoices",
    tags=["Invoices"]
)

api_router.include_router(
    customers.router,
    prefix="/customers",
    tags=["Customers"]
)

api_router.include_router(
    inventory.router,
    prefix="/inventory",
    tags=["Inventory"]
)

# Pricing Engine
api_router.include_router(
    pricing.router,
    prefix="/pricing",
    tags=["Pricing"]
)

# Analytics
api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"]
)
