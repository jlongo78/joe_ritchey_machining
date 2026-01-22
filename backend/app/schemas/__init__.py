"""
Pydantic Schemas Package
All request/response schemas for API validation.
"""

from app.schemas.common import (
    PaginationParams, PaginatedResponse, MessageResponse,
    IDResponse, SuccessResponse, ErrorResponse
)
from app.schemas.user import (
    UserBase, UserCreate, UserUpdate, UserResponse, UserInDB,
    AddressBase, AddressCreate, AddressResponse,
    Token, TokenPayload, LoginRequest, PasswordChange, PasswordReset, PasswordResetRequest
)
from app.schemas.customer import (
    CustomerBase, CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse, CustomerDetailResponse,
    CustomerContactBase, CustomerContactCreate, CustomerContactResponse,
    CustomerVehicleBase, CustomerVehicleCreate, CustomerVehicleResponse,
    CustomerNoteCreate, CustomerNoteResponse
)
from app.schemas.product import (
    ProductBase, ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    ProductImageCreate, ProductImageResponse,
    ProductAttributeCreate, ProductAttributeResponse,
    ProductVariantCreate, ProductVariantResponse
)
from app.schemas.category import CategoryBase, CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.brand import BrandBase, BrandCreate, BrandUpdate, BrandResponse
from app.schemas.inventory import (
    InventoryBase, InventoryCreate, InventoryUpdate, InventoryResponse,
    InventoryTransactionCreate, InventoryTransactionResponse, InventoryAdjustment, StockReceive
)
from app.schemas.supplier import (
    SupplierBase, SupplierCreate, SupplierUpdate, SupplierResponse,
    SupplierAPIConfigCreate, SupplierAPIConfigResponse,
    ProductSupplierCreate, ProductSupplierResponse
)
from app.schemas.cart import (
    CartItemCreate, CartItemUpdate, CartItemResponse,
    CartResponse, CartAddItem, CartUpdateItem, CartItemAdd
)
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderResponse, OrderListResponse, OrderDetailResponse,
    OrderItemResponse, OrderStatusUpdate
)
from app.schemas.payment import (
    PaymentCreate, PaymentResponse, PaymentProcessRequest,
    RefundCreate, RefundResponse
)
from app.schemas.coupon import CouponBase, CouponCreate, CouponUpdate, CouponResponse, CouponValidation
from app.schemas.review import ReviewBase, ReviewCreate, ReviewUpdate, ReviewResponse
from app.schemas.quote import (
    QuoteBase, QuoteCreate, QuoteUpdate, QuoteResponse, QuoteListResponse, QuoteDetailResponse,
    QuoteItemCreate, QuoteItemUpdate, QuoteItemResponse,
    QuoteApproval, QuoteSend
)
from app.schemas.job import (
    JobBase, JobCreate, JobUpdate, JobResponse, JobListResponse, JobDetailResponse,
    JobTaskCreate, JobTaskUpdate, JobTaskResponse,
    JobPartCreate, JobPartUpdate, JobPartResponse,
    JobLaborCreate, JobLaborResponse,
    JobNoteCreate, JobNoteResponse,
    JobStatusUpdate
)
from app.schemas.schedule import (
    ScheduleEventCreate, ScheduleEventUpdate, ScheduleEventResponse,
    ShopBayCreate, ShopBayResponse,
    ShopHoursCreate, ShopHoursResponse
)
from app.schemas.invoice import (
    InvoiceBase, InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceListResponse, InvoiceDetailResponse,
    InvoiceItemCreate, InvoiceItemResponse,
    InvoiceSend, PaymentRecord
)
from app.schemas.pricing import (
    PriceAdjustmentRuleCreate, PriceAdjustmentRuleResponse,
    PriceHistoryResponse, PriceAdjustmentLogResponse,
    PriceSyncRequest, PriceUpdateRequest, BulkPriceUpdate, SupplierSyncResult, MarginAnalysis
)
from app.schemas.analytics import (
    DashboardStats, RevenueData, SalesReport,
    JobMetrics, CustomerMetrics, InventoryMetrics
)

__all__ = [
    # Common
    "PaginationParams", "PaginatedResponse", "MessageResponse",
    "IDResponse", "SuccessResponse", "ErrorResponse",

    # User & Auth
    "UserBase", "UserCreate", "UserUpdate", "UserResponse", "UserInDB",
    "AddressBase", "AddressCreate", "AddressResponse",
    "Token", "TokenPayload", "LoginRequest", "PasswordChange", "PasswordReset", "PasswordResetRequest",

    # Customer
    "CustomerBase", "CustomerCreate", "CustomerUpdate", "CustomerResponse", "CustomerListResponse", "CustomerDetailResponse",
    "CustomerContactBase", "CustomerContactCreate", "CustomerContactResponse",
    "CustomerVehicleBase", "CustomerVehicleCreate", "CustomerVehicleResponse",
    "CustomerNoteCreate", "CustomerNoteResponse",

    # Product
    "ProductBase", "ProductCreate", "ProductUpdate", "ProductResponse", "ProductListResponse",
    "ProductImageCreate", "ProductImageResponse",
    "ProductAttributeCreate", "ProductAttributeResponse",
    "ProductVariantCreate", "ProductVariantResponse",

    # Category & Brand
    "CategoryBase", "CategoryCreate", "CategoryUpdate", "CategoryResponse",
    "BrandBase", "BrandCreate", "BrandUpdate", "BrandResponse",

    # Inventory
    "InventoryBase", "InventoryCreate", "InventoryUpdate", "InventoryResponse",
    "InventoryTransactionCreate", "InventoryTransactionResponse", "InventoryAdjustment", "StockReceive",

    # Supplier
    "SupplierBase", "SupplierCreate", "SupplierUpdate", "SupplierResponse",
    "SupplierAPIConfigCreate", "SupplierAPIConfigResponse",
    "ProductSupplierCreate", "ProductSupplierResponse",

    # Cart
    "CartItemCreate", "CartItemUpdate", "CartItemResponse",
    "CartResponse", "CartAddItem", "CartUpdateItem", "CartItemAdd",

    # Order
    "OrderCreate", "OrderUpdate", "OrderResponse", "OrderListResponse", "OrderDetailResponse",
    "OrderItemResponse", "OrderStatusUpdate",

    # Payment
    "PaymentCreate", "PaymentResponse", "PaymentProcessRequest",
    "RefundCreate", "RefundResponse",

    # Coupon
    "CouponBase", "CouponCreate", "CouponUpdate", "CouponResponse", "CouponValidation",

    # Review
    "ReviewBase", "ReviewCreate", "ReviewUpdate", "ReviewResponse",

    # Quote
    "QuoteBase", "QuoteCreate", "QuoteUpdate", "QuoteResponse", "QuoteListResponse", "QuoteDetailResponse",
    "QuoteItemCreate", "QuoteItemUpdate", "QuoteItemResponse",
    "QuoteApproval", "QuoteSend",

    # Job
    "JobBase", "JobCreate", "JobUpdate", "JobResponse", "JobListResponse", "JobDetailResponse",
    "JobTaskCreate", "JobTaskUpdate", "JobTaskResponse",
    "JobPartCreate", "JobPartUpdate", "JobPartResponse",
    "JobLaborCreate", "JobLaborResponse",
    "JobNoteCreate", "JobNoteResponse",
    "JobStatusUpdate",

    # Schedule
    "ScheduleEventCreate", "ScheduleEventUpdate", "ScheduleEventResponse",
    "ShopBayCreate", "ShopBayResponse",
    "ShopHoursCreate", "ShopHoursResponse",

    # Invoice
    "InvoiceBase", "InvoiceCreate", "InvoiceUpdate", "InvoiceResponse", "InvoiceListResponse", "InvoiceDetailResponse",
    "InvoiceItemCreate", "InvoiceItemResponse",
    "InvoiceSend", "PaymentRecord",

    # Pricing
    "PriceAdjustmentRuleCreate", "PriceAdjustmentRuleResponse",
    "PriceHistoryResponse", "PriceAdjustmentLogResponse",
    "PriceSyncRequest", "PriceUpdateRequest", "BulkPriceUpdate", "SupplierSyncResult", "MarginAnalysis",

    # Analytics
    "DashboardStats", "RevenueData", "SalesReport",
    "JobMetrics", "CustomerMetrics", "InventoryMetrics",
]
