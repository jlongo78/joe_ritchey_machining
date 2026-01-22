# Performance Car Parts E-Commerce - System Architecture

## Overview
A full-stack e-commerce platform for performance car parts with dynamic pricing, supplier integration, and comprehensive order management.

---

## 1. Database Schema (SQLite)

### Entity Relationship Diagram (Conceptual)
```
Users ──┬── Orders ──── OrderItems ──── Products
        │                                   │
        └── Cart ─── CartItems ────────────┘
                                            │
Products ──── ProductCategories ────── Categories
    │
    ├── ProductImages
    ├── ProductSuppliers ──── Suppliers
    ├── PriceHistory
    └── Inventory

Suppliers ──── SupplierPriceMonitor
           └── SupplierAPIConfig
```

### Complete Schema Definition

```sql
-- =============================================
-- USER MANAGEMENT
-- =============================================

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer', -- customer, admin, manager
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE user_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address_type VARCHAR(20) DEFAULT 'shipping', -- shipping, billing
    is_default BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(200),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'USA',
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- PRODUCT CATALOG
-- =============================================

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER,
    image_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    meta_title VARCHAR(200),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    description TEXT,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description VARCHAR(500),
    description TEXT,
    brand_id INTEGER,

    -- Pricing
    base_cost DECIMAL(10,2) NOT NULL,
    retail_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    sale_start_date TIMESTAMP,
    sale_end_date TIMESTAMP,

    -- Pricing Algorithm Settings
    min_margin_percent DECIMAL(5,2) DEFAULT 15.00,
    max_margin_percent DECIMAL(5,2) DEFAULT 40.00,
    price_rounding VARCHAR(20) DEFAULT 'nearest_99', -- nearest_99, nearest_95, none
    competitor_match_enabled BOOLEAN DEFAULT TRUE,

    -- Physical Properties
    weight DECIMAL(10,2), -- in pounds
    length DECIMAL(10,2), -- in inches
    width DECIMAL(10,2),
    height DECIMAL(10,2),

    -- Vehicle Compatibility
    year_start INTEGER,
    year_end INTEGER,
    make VARCHAR(100),
    model VARCHAR(100),
    submodel VARCHAR(100),
    engine VARCHAR(100),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,

    -- SEO
    meta_title VARCHAR(200),
    meta_description TEXT,
    meta_keywords VARCHAR(500),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
);

CREATE TABLE product_categories (
    product_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (product_id, category_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    variant_attributes JSON, -- {"color": "red", "size": "large"}
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =============================================
-- INVENTORY MANAGEMENT
-- =============================================

CREATE TABLE inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    variant_id INTEGER,
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) VIRTUAL,
    reorder_point INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 50,
    warehouse_location VARCHAR(50),
    last_counted_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

CREATE TABLE inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    variant_id INTEGER,
    transaction_type VARCHAR(50) NOT NULL, -- purchase, sale, adjustment, return, transfer
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- order, purchase_order, adjustment
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =============================================
-- SUPPLIER MANAGEMENT
-- =============================================

CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    payment_terms VARCHAR(100),
    lead_time_days INTEGER DEFAULT 7,
    minimum_order_amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supplier_api_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER UNIQUE NOT NULL,
    api_type VARCHAR(50) NOT NULL, -- rest, soap, ftp, scraper
    base_url VARCHAR(500),
    auth_type VARCHAR(50), -- api_key, oauth2, basic
    api_key_encrypted VARCHAR(500),
    api_secret_encrypted VARCHAR(500),
    additional_config JSON, -- Extra configuration parameters
    rate_limit_per_minute INTEGER DEFAULT 60,
    last_sync_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

CREATE TABLE product_suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    supplier_sku VARCHAR(100),
    supplier_url VARCHAR(500),
    cost_price DECIMAL(10,2) NOT NULL,
    last_cost_price DECIMAL(10,2),
    minimum_order_quantity INTEGER DEFAULT 1,
    is_preferred BOOLEAN DEFAULT FALSE,
    lead_time_days INTEGER,
    last_checked_at TIMESTAMP,
    last_price_change_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- =============================================
-- PRICE MONITORING & ADJUSTMENT
-- =============================================

CREATE TABLE competitor_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    website VARCHAR(255),
    scraping_enabled BOOLEAN DEFAULT FALSE,
    api_enabled BOOLEAN DEFAULT FALSE,
    api_config JSON,
    priority INTEGER DEFAULT 5, -- 1-10, lower is higher priority
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- supplier, competitor, internal
    source_id INTEGER,
    source_name VARCHAR(200),
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE price_adjustment_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL, -- margin_based, competitor_based, volume_based
    conditions JSON NOT NULL, -- Rule conditions
    adjustments JSON NOT NULL, -- Adjustment actions
    priority INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    applies_to_categories JSON, -- Category IDs or null for all
    applies_to_brands JSON, -- Brand IDs or null for all
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE price_adjustment_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    rule_id INTEGER,
    old_price DECIMAL(10,2) NOT NULL,
    new_price DECIMAL(10,2) NOT NULL,
    adjustment_reason TEXT,
    trigger_type VARCHAR(50), -- automatic, manual, supplier_change
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (rule_id) REFERENCES price_adjustment_rules(id)
);

-- =============================================
-- SHOPPING CART
-- =============================================

CREATE TABLE carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id VARCHAR(255), -- For guest carts
    status VARCHAR(20) DEFAULT 'active', -- active, abandoned, converted
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    coupon_code VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variant_id INTEGER,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- =============================================
-- ORDERS
-- =============================================

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER,
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled, refunded
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, authorized, paid, failed, refunded

    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,

    -- Shipping Details
    shipping_method VARCHAR(100),
    shipping_carrier VARCHAR(100),
    tracking_number VARCHAR(255),
    estimated_delivery_date DATE,
    actual_delivery_date DATE,

    -- Addresses (JSON stored at time of order)
    shipping_address JSON NOT NULL,
    billing_address JSON NOT NULL,

    -- Additional Info
    customer_notes TEXT,
    internal_notes TEXT,
    coupon_code VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variant_id INTEGER,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2), -- Cost at time of order for profit tracking
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

CREATE TABLE order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =============================================
-- PAYMENTS
-- =============================================

CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- credit_card, paypal, stripe, etc.
    transaction_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL, -- pending, completed, failed, refunded
    gateway_response JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    payment_id INTEGER,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, processed, rejected
    processed_by INTEGER,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- =============================================
-- PROMOTIONS & COUPONS
-- =============================================

CREATE TABLE coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount, free_shipping
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2),
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    applies_to_categories JSON,
    applies_to_products JSON,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coupon_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coupon_id INTEGER NOT NULL,
    user_id INTEGER,
    order_id INTEGER NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- =============================================
-- REVIEWS & RATINGS
-- =============================================

CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    order_id INTEGER,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    content TEXT,
    pros TEXT,
    cons TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- =============================================
-- WISHLISTS
-- =============================================

CREATE TABLE wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) DEFAULT 'My Wishlist',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE wishlist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wishlist_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    variant_id INTEGER,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =============================================
-- VEHICLE FITMENT
-- =============================================

CREATE TABLE vehicle_makes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE vehicle_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    make_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (make_id) REFERENCES vehicle_makes(id) ON DELETE CASCADE
);

CREATE TABLE vehicle_years (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    submodel VARCHAR(100),
    engine VARCHAR(100),
    FOREIGN KEY (model_id) REFERENCES vehicle_models(id) ON DELETE CASCADE
);

CREATE TABLE product_fitment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    vehicle_year_id INTEGER NOT NULL,
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_year_id) REFERENCES vehicle_years(id) ON DELETE CASCADE
);

-- =============================================
-- NOTIFICATIONS & ALERTS
-- =============================================

CREATE TABLE notification_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    email VARCHAR(255) NOT NULL,
    product_id INTEGER,
    notification_type VARCHAR(50) NOT NULL, -- back_in_stock, price_drop
    target_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    notified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =============================================
-- ANALYTICS & LOGGING
-- =============================================

CREATE TABLE product_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    user_id INTEGER,
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    referrer VARCHAR(500),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE search_queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id VARCHAR(255),
    query VARCHAR(500) NOT NULL,
    results_count INTEGER,
    filters JSON,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_data JSON,
    response_status INTEGER,
    response_time_ms INTEGER,
    user_id INTEGER,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_product_categories_product ON product_categories(product_id);
CREATE INDEX idx_product_categories_category ON product_categories(category_id);
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_cart_user ON carts(user_id);
CREATE INDEX idx_cart_session ON carts(session_id);
CREATE INDEX idx_price_history_product ON price_history(product_id);
CREATE INDEX idx_price_history_recorded ON price_history(recorded_at);
CREATE INDEX idx_product_suppliers_product ON product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier ON product_suppliers(supplier_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_product_views_product ON product_views(product_id);
CREATE INDEX idx_product_views_date ON product_views(viewed_at);
```

---

## 2. API Endpoints (FastAPI)

### Authentication & Users
```
POST   /api/v1/auth/register              - Register new user
POST   /api/v1/auth/login                 - User login
POST   /api/v1/auth/logout                - User logout
POST   /api/v1/auth/refresh               - Refresh access token
POST   /api/v1/auth/forgot-password       - Request password reset
POST   /api/v1/auth/reset-password        - Reset password with token
GET    /api/v1/auth/verify-email/{token}  - Verify email address

GET    /api/v1/users/me                   - Get current user profile
PUT    /api/v1/users/me                   - Update current user profile
GET    /api/v1/users/me/addresses         - Get user addresses
POST   /api/v1/users/me/addresses         - Add new address
PUT    /api/v1/users/me/addresses/{id}    - Update address
DELETE /api/v1/users/me/addresses/{id}    - Delete address
GET    /api/v1/users/me/orders            - Get user order history
GET    /api/v1/users/me/wishlists         - Get user wishlists

# Admin endpoints
GET    /api/v1/admin/users                - List all users (paginated)
GET    /api/v1/admin/users/{id}           - Get user details
PUT    /api/v1/admin/users/{id}           - Update user
DELETE /api/v1/admin/users/{id}           - Deactivate user
```

### Products & Catalog
```
GET    /api/v1/products                   - List products (paginated, filterable)
GET    /api/v1/products/{id}              - Get product details
GET    /api/v1/products/{id}/reviews      - Get product reviews
GET    /api/v1/products/slug/{slug}       - Get product by slug
GET    /api/v1/products/sku/{sku}         - Get product by SKU
GET    /api/v1/products/search            - Search products
GET    /api/v1/products/featured          - Get featured products
GET    /api/v1/products/new-arrivals      - Get new arrivals
GET    /api/v1/products/{id}/related      - Get related products
GET    /api/v1/products/{id}/fitment      - Get vehicle fitment

# Admin endpoints
POST   /api/v1/admin/products             - Create product
PUT    /api/v1/admin/products/{id}        - Update product
DELETE /api/v1/admin/products/{id}        - Delete product
POST   /api/v1/admin/products/{id}/images - Upload product images
DELETE /api/v1/admin/products/{id}/images/{img_id} - Delete product image
POST   /api/v1/admin/products/bulk-import - Bulk import products
PUT    /api/v1/admin/products/bulk-update - Bulk update products
```

### Categories
```
GET    /api/v1/categories                 - List all categories (tree structure)
GET    /api/v1/categories/{id}            - Get category details
GET    /api/v1/categories/{id}/products   - Get products in category
GET    /api/v1/categories/slug/{slug}     - Get category by slug

# Admin endpoints
POST   /api/v1/admin/categories           - Create category
PUT    /api/v1/admin/categories/{id}      - Update category
DELETE /api/v1/admin/categories/{id}      - Delete category
PUT    /api/v1/admin/categories/reorder   - Reorder categories
```

### Brands
```
GET    /api/v1/brands                     - List all brands
GET    /api/v1/brands/{id}                - Get brand details
GET    /api/v1/brands/{id}/products       - Get products by brand
GET    /api/v1/brands/slug/{slug}         - Get brand by slug

# Admin endpoints
POST   /api/v1/admin/brands               - Create brand
PUT    /api/v1/admin/brands/{id}          - Update brand
DELETE /api/v1/admin/brands/{id}          - Delete brand
```

### Shopping Cart
```
GET    /api/v1/cart                       - Get current cart
POST   /api/v1/cart/items                 - Add item to cart
PUT    /api/v1/cart/items/{id}            - Update cart item quantity
DELETE /api/v1/cart/items/{id}            - Remove item from cart
DELETE /api/v1/cart                       - Clear cart
POST   /api/v1/cart/apply-coupon          - Apply coupon code
DELETE /api/v1/cart/coupon                - Remove coupon
GET    /api/v1/cart/shipping-estimate     - Get shipping estimates
POST   /api/v1/cart/merge                 - Merge guest cart with user cart
```

### Checkout & Orders
```
POST   /api/v1/checkout/validate          - Validate cart for checkout
POST   /api/v1/checkout/shipping-rates    - Get shipping rates
POST   /api/v1/checkout/tax-calculate     - Calculate tax
POST   /api/v1/checkout/create-order      - Create order from cart
POST   /api/v1/checkout/payment           - Process payment

GET    /api/v1/orders                     - List user orders
GET    /api/v1/orders/{id}                - Get order details
GET    /api/v1/orders/number/{number}     - Get order by order number
POST   /api/v1/orders/{id}/cancel         - Request order cancellation
GET    /api/v1/orders/{id}/tracking       - Get tracking info

# Admin endpoints
GET    /api/v1/admin/orders               - List all orders (filterable)
GET    /api/v1/admin/orders/{id}          - Get order details (admin)
PUT    /api/v1/admin/orders/{id}/status   - Update order status
POST   /api/v1/admin/orders/{id}/ship     - Mark order as shipped
POST   /api/v1/admin/orders/{id}/refund   - Process refund
GET    /api/v1/admin/orders/export        - Export orders to CSV
```

### Inventory Management (Admin)
```
GET    /api/v1/admin/inventory            - List inventory levels
GET    /api/v1/admin/inventory/{product_id} - Get product inventory
PUT    /api/v1/admin/inventory/{product_id} - Update inventory
POST   /api/v1/admin/inventory/adjustment - Create inventory adjustment
GET    /api/v1/admin/inventory/low-stock  - Get low stock alerts
GET    /api/v1/admin/inventory/transactions - List inventory transactions
```

### Supplier Management (Admin)
```
GET    /api/v1/admin/suppliers            - List suppliers
GET    /api/v1/admin/suppliers/{id}       - Get supplier details
POST   /api/v1/admin/suppliers            - Create supplier
PUT    /api/v1/admin/suppliers/{id}       - Update supplier
DELETE /api/v1/admin/suppliers/{id}       - Delete supplier
GET    /api/v1/admin/suppliers/{id}/products - Get supplier products
POST   /api/v1/admin/suppliers/{id}/sync  - Sync supplier prices
GET    /api/v1/admin/suppliers/{id}/api-config - Get API config
PUT    /api/v1/admin/suppliers/{id}/api-config - Update API config
```

### Price Management (Admin)
```
GET    /api/v1/admin/pricing/rules        - List pricing rules
POST   /api/v1/admin/pricing/rules        - Create pricing rule
PUT    /api/v1/admin/pricing/rules/{id}   - Update pricing rule
DELETE /api/v1/admin/pricing/rules/{id}   - Delete pricing rule
GET    /api/v1/admin/pricing/history/{product_id} - Get price history
POST   /api/v1/admin/pricing/run-adjustments - Run price adjustments
GET    /api/v1/admin/pricing/adjustment-log - Get adjustment log
GET    /api/v1/admin/pricing/competitor-prices - Get competitor prices
POST   /api/v1/admin/pricing/sync-suppliers - Sync all supplier prices
```

### Reviews
```
GET    /api/v1/reviews                    - List reviews (filterable)
POST   /api/v1/reviews                    - Submit review
PUT    /api/v1/reviews/{id}               - Update own review
DELETE /api/v1/reviews/{id}               - Delete own review
POST   /api/v1/reviews/{id}/helpful       - Mark review as helpful

# Admin endpoints
GET    /api/v1/admin/reviews/pending      - Get pending reviews
PUT    /api/v1/admin/reviews/{id}/approve - Approve review
DELETE /api/v1/admin/reviews/{id}         - Delete review
```

### Wishlists
```
GET    /api/v1/wishlists                  - List user wishlists
POST   /api/v1/wishlists                  - Create wishlist
PUT    /api/v1/wishlists/{id}             - Update wishlist
DELETE /api/v1/wishlists/{id}             - Delete wishlist
POST   /api/v1/wishlists/{id}/items       - Add item to wishlist
DELETE /api/v1/wishlists/{id}/items/{item_id} - Remove item
POST   /api/v1/wishlists/{id}/add-to-cart - Add all items to cart
```

### Coupons (Admin)
```
GET    /api/v1/admin/coupons              - List coupons
GET    /api/v1/admin/coupons/{id}         - Get coupon details
POST   /api/v1/admin/coupons              - Create coupon
PUT    /api/v1/admin/coupons/{id}         - Update coupon
DELETE /api/v1/admin/coupons/{id}         - Delete coupon
GET    /api/v1/admin/coupons/{id}/usage   - Get coupon usage stats
POST   /api/v1/coupons/validate           - Validate coupon code (public)
```

### Vehicle Fitment
```
GET    /api/v1/vehicles/makes             - List vehicle makes
GET    /api/v1/vehicles/makes/{id}/models - List models for make
GET    /api/v1/vehicles/models/{id}/years - List years for model
GET    /api/v1/vehicles/fitment           - Search products by vehicle
POST   /api/v1/vehicles/my-garage         - Save vehicle to garage
GET    /api/v1/vehicles/my-garage         - Get saved vehicles
DELETE /api/v1/vehicles/my-garage/{id}    - Remove saved vehicle

# Admin endpoints
POST   /api/v1/admin/vehicles/makes       - Create make
POST   /api/v1/admin/vehicles/models      - Create model
POST   /api/v1/admin/vehicles/years       - Create year entry
POST   /api/v1/admin/products/{id}/fitment - Add product fitment
DELETE /api/v1/admin/products/{id}/fitment/{fitment_id} - Remove fitment
POST   /api/v1/admin/vehicles/import      - Import vehicle data
```

### Notifications
```
POST   /api/v1/notifications/back-in-stock - Subscribe to back in stock
POST   /api/v1/notifications/price-drop   - Subscribe to price drop
DELETE /api/v1/notifications/{id}         - Unsubscribe
GET    /api/v1/notifications/my-subscriptions - Get subscriptions
```

### Analytics & Reports (Admin)
```
GET    /api/v1/admin/analytics/dashboard  - Get dashboard stats
GET    /api/v1/admin/analytics/sales      - Sales analytics
GET    /api/v1/admin/analytics/products   - Product performance
GET    /api/v1/admin/analytics/customers  - Customer analytics
GET    /api/v1/admin/analytics/inventory  - Inventory analytics
GET    /api/v1/admin/analytics/pricing    - Pricing analytics
GET    /api/v1/admin/reports/sales        - Generate sales report
GET    /api/v1/admin/reports/inventory    - Generate inventory report
GET    /api/v1/admin/reports/customers    - Generate customer report
```

---

## 3. React Component Hierarchy

```
src/
├── App.tsx
├── index.tsx
│
├── components/
│   ├── common/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.styles.ts
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Modal/
│   │   ├── Dropdown/
│   │   ├── Pagination/
│   │   ├── LoadingSpinner/
│   │   ├── ErrorBoundary/
│   │   ├── Toast/
│   │   ├── Badge/
│   │   ├── Card/
│   │   ├── Breadcrumb/
│   │   ├── Rating/
│   │   ├── PriceDisplay/
│   │   ├── QuantitySelector/
│   │   ├── ImageGallery/
│   │   ├── SearchInput/
│   │   ├── FilterChips/
│   │   └── EmptyState/
│   │
│   ├── layout/
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── MainNav.tsx
│   │   │   ├── MegaMenu.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── CartIcon.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   └── MobileMenu.tsx
│   │   ├── Footer/
│   │   │   ├── Footer.tsx
│   │   │   ├── FooterLinks.tsx
│   │   │   ├── Newsletter.tsx
│   │   │   └── SocialLinks.tsx
│   │   ├── Sidebar/
│   │   └── PageLayout/
│   │
│   ├── product/
│   │   ├── ProductCard/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductCardSkeleton.tsx
│   │   │   └── QuickViewButton.tsx
│   │   ├── ProductGrid/
│   │   ├── ProductList/
│   │   ├── ProductGallery/
│   │   ├── ProductInfo/
│   │   ├── ProductTabs/
│   │   ├── ProductSpecs/
│   │   ├── ProductReviews/
│   │   ├── RelatedProducts/
│   │   ├── ProductBreadcrumb/
│   │   ├── StockIndicator/
│   │   ├── AddToCartButton/
│   │   ├── ProductQuickView/
│   │   └── FitmentChecker/
│   │
│   ├── category/
│   │   ├── CategoryCard/
│   │   ├── CategoryTree/
│   │   ├── CategoryBanner/
│   │   ├── SubcategoryList/
│   │   └── CategoryFilter/
│   │
│   ├── cart/
│   │   ├── CartDrawer/
│   │   ├── CartItem/
│   │   ├── CartSummary/
│   │   ├── CartEmpty/
│   │   ├── CouponInput/
│   │   ├── ShippingEstimate/
│   │   └── MiniCart/
│   │
│   ├── checkout/
│   │   ├── CheckoutSteps/
│   │   ├── ShippingForm/
│   │   ├── BillingForm/
│   │   ├── ShippingMethod/
│   │   ├── PaymentForm/
│   │   ├── OrderReview/
│   │   ├── OrderConfirmation/
│   │   └── AddressSelector/
│   │
│   ├── account/
│   │   ├── AccountNav/
│   │   ├── ProfileForm/
│   │   ├── AddressBook/
│   │   ├── OrderHistory/
│   │   ├── OrderDetail/
│   │   ├── WishlistManager/
│   │   ├── GarageManager/
│   │   └── PasswordChange/
│   │
│   ├── auth/
│   │   ├── LoginForm/
│   │   ├── RegisterForm/
│   │   ├── ForgotPasswordForm/
│   │   ├── ResetPasswordForm/
│   │   └── SocialLogin/
│   │
│   ├── search/
│   │   ├── SearchResults/
│   │   ├── SearchFilters/
│   │   ├── SearchSort/
│   │   ├── FacetedSearch/
│   │   ├── PriceRangeFilter/
│   │   ├── BrandFilter/
│   │   ├── VehicleFilter/
│   │   └── ActiveFilters/
│   │
│   ├── reviews/
│   │   ├── ReviewList/
│   │   ├── ReviewItem/
│   │   ├── ReviewForm/
│   │   ├── ReviewSummary/
│   │   └── ReviewFilters/
│   │
│   └── vehicle/
│       ├── VehicleSelector/
│       ├── GarageDropdown/
│       ├── FitmentBadge/
│       └── VehicleCard/
│
├── pages/
│   ├── Home/
│   │   ├── HomePage.tsx
│   │   ├── HeroBanner.tsx
│   │   ├── FeaturedCategories.tsx
│   │   ├── FeaturedProducts.tsx
│   │   ├── BrandShowcase.tsx
│   │   ├── PromoSection.tsx
│   │   └── NewsletterSignup.tsx
│   │
│   ├── Products/
│   │   ├── ProductListPage.tsx
│   │   └── ProductDetailPage.tsx
│   │
│   ├── Categories/
│   │   └── CategoryPage.tsx
│   │
│   ├── Cart/
│   │   └── CartPage.tsx
│   │
│   ├── Checkout/
│   │   ├── CheckoutPage.tsx
│   │   └── OrderConfirmationPage.tsx
│   │
│   ├── Account/
│   │   ├── AccountPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── OrderDetailPage.tsx
│   │   ├── AddressesPage.tsx
│   │   ├── WishlistPage.tsx
│   │   └── GaragePage.tsx
│   │
│   ├── Auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   └── ResetPasswordPage.tsx
│   │
│   ├── Search/
│   │   └── SearchResultsPage.tsx
│   │
│   └── Static/
│       ├── AboutPage.tsx
│       ├── ContactPage.tsx
│       ├── ShippingInfoPage.tsx
│       ├── ReturnsPage.tsx
│       └── PrivacyPage.tsx
│
├── admin/
│   ├── AdminApp.tsx
│   ├── components/
│   │   ├── AdminLayout/
│   │   ├── AdminSidebar/
│   │   ├── AdminHeader/
│   │   ├── DataTable/
│   │   ├── FormBuilder/
│   │   ├── StatsCard/
│   │   ├── Charts/
│   │   └── FileUpload/
│   │
│   └── pages/
│       ├── Dashboard/
│       ├── Products/
│       │   ├── ProductList.tsx
│       │   ├── ProductForm.tsx
│       │   └── ProductImport.tsx
│       ├── Orders/
│       │   ├── OrderList.tsx
│       │   └── OrderDetail.tsx
│       ├── Customers/
│       ├── Categories/
│       ├── Inventory/
│       ├── Suppliers/
│       │   ├── SupplierList.tsx
│       │   ├── SupplierForm.tsx
│       │   └── SupplierSync.tsx
│       ├── Pricing/
│       │   ├── PricingRules.tsx
│       │   ├── PriceHistory.tsx
│       │   └── CompetitorPrices.tsx
│       ├── Coupons/
│       ├── Reviews/
│       ├── Reports/
│       └── Settings/
│
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useProducts.ts
│   ├── useCategories.ts
│   ├── useOrders.ts
│   ├── useWishlist.ts
│   ├── useVehicle.ts
│   ├── useSearch.ts
│   ├── usePagination.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useMediaQuery.ts
│
├── context/
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   ├── VehicleContext.tsx
│   └── ToastContext.tsx
│
├── services/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── cart.ts
│   │   ├── orders.ts
│   │   ├── categories.ts
│   │   └── admin/
│   │       ├── products.ts
│   │       ├── orders.ts
│   │       ├── suppliers.ts
│   │       └── pricing.ts
│   └── stripe.ts
│
├── store/
│   ├── index.ts
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── cartSlice.ts
│   │   ├── productSlice.ts
│   │   └── vehicleSlice.ts
│   └── middleware/
│
├── types/
│   ├── product.ts
│   ├── cart.ts
│   ├── order.ts
│   ├── user.ts
│   ├── category.ts
│   ├── supplier.ts
│   └── api.ts
│
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   ├── helpers.ts
│   └── constants.ts
│
└── styles/
    ├── globals.css
    ├── variables.css
    └── theme.ts
```

---

## 4. Backend File/Folder Structure (FastAPI)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app initialization
│   ├── config.py                  # Configuration settings
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py                # Dependency injection
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py          # Main API router
│   │   │   ├── endpoints/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── products.py
│   │   │   │   ├── categories.py
│   │   │   │   ├── brands.py
│   │   │   │   ├── cart.py
│   │   │   │   ├── checkout.py
│   │   │   │   ├── orders.py
│   │   │   │   ├── reviews.py
│   │   │   │   ├── wishlists.py
│   │   │   │   ├── vehicles.py
│   │   │   │   ├── notifications.py
│   │   │   │   └── coupons.py
│   │   │   └── admin/
│   │   │       ├── __init__.py
│   │   │       ├── router.py
│   │   │       ├── products.py
│   │   │       ├── orders.py
│   │   │       ├── users.py
│   │   │       ├── categories.py
│   │   │       ├── inventory.py
│   │   │       ├── suppliers.py
│   │   │       ├── pricing.py
│   │   │       ├── coupons.py
│   │   │       ├── reviews.py
│   │   │       ├── analytics.py
│   │   │       └── settings.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # Settings/configuration
│   │   ├── security.py            # JWT, password hashing
│   │   ├── exceptions.py          # Custom exceptions
│   │   └── logging.py             # Logging configuration
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py            # Database connection
│   │   ├── base.py                # Base model class
│   │   └── session.py             # Session management
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── category.py
│   │   ├── brand.py
│   │   ├── inventory.py
│   │   ├── supplier.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   ├── payment.py
│   │   ├── coupon.py
│   │   ├── review.py
│   │   ├── wishlist.py
│   │   ├── vehicle.py
│   │   ├── price_history.py
│   │   └── notification.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── category.py
│   │   ├── brand.py
│   │   ├── inventory.py
│   │   ├── supplier.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   ├── payment.py
│   │   ├── coupon.py
│   │   ├── review.py
│   │   ├── wishlist.py
│   │   ├── vehicle.py
│   │   ├── pricing.py
│   │   ├── common.py              # Pagination, responses
│   │   └── analytics.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── product_service.py
│   │   ├── category_service.py
│   │   ├── cart_service.py
│   │   ├── order_service.py
│   │   ├── payment_service.py
│   │   ├── inventory_service.py
│   │   ├── supplier_service.py
│   │   ├── pricing_service.py
│   │   ├── review_service.py
│   │   ├── email_service.py
│   │   ├── search_service.py
│   │   └── analytics_service.py
│   │
│   ├── pricing/
│   │   ├── __init__.py
│   │   ├── engine.py              # Price calculation engine
│   │   ├── rules.py               # Rule processors
│   │   ├── competitors.py         # Competitor price fetching
│   │   ├── suppliers.py           # Supplier price sync
│   │   └── scheduler.py           # Automated price updates
│   │
│   ├── integrations/
│   │   ├── __init__.py
│   │   ├── stripe/
│   │   │   ├── __init__.py
│   │   │   ├── client.py
│   │   │   └── webhooks.py
│   │   ├── shipping/
│   │   │   ├── __init__.py
│   │   │   ├── ups.py
│   │   │   ├── fedex.py
│   │   │   └── usps.py
│   │   └── email/
│   │       ├── __init__.py
│   │       ├── sendgrid.py
│   │       └── templates.py
│   │
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py
│   │   ├── price_sync.py          # Supplier price sync tasks
│   │   ├── price_adjustment.py    # Automated price adjustments
│   │   ├── inventory_alerts.py
│   │   ├── order_notifications.py
│   │   └── cleanup.py             # Cleanup tasks
│   │
│   └── utils/
│       ├── __init__.py
│       ├── pagination.py
│       ├── validators.py
│       ├── helpers.py
│       ├── image_processing.py
│       └── csv_import.py
│
├── migrations/
│   ├── versions/
│   └── env.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_products.py
│   ├── test_cart.py
│   ├── test_orders.py
│   ├── test_pricing.py
│   └── test_suppliers.py
│
├── scripts/
│   ├── init_db.py
│   ├── seed_data.py
│   └── import_vehicles.py
│
├── alembic.ini
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

---

## 5. Key Backend Code Examples

### FastAPI Main Application
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
```

### Pricing Engine
```python
# app/pricing/engine.py
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from app.models.product import Product
from app.models.price_history import PriceHistory
from app.schemas.pricing import PriceAdjustmentRule

class PricingEngine:
    def __init__(self, db_session):
        self.db = db_session

    async def calculate_optimal_price(
        self,
        product: Product,
        supplier_cost: Decimal,
        competitor_prices: List[Decimal]
    ) -> Decimal:
        """Calculate optimal retail price based on rules."""

        # Get applicable rules
        rules = await self._get_applicable_rules(product)

        # Start with margin-based price
        base_price = self._apply_margin(
            supplier_cost,
            product.min_margin_percent,
            product.max_margin_percent
        )

        # Apply competitor matching if enabled
        if product.competitor_match_enabled and competitor_prices:
            base_price = self._match_competitor_price(
                base_price,
                competitor_prices,
                supplier_cost,
                product.min_margin_percent
            )

        # Apply pricing rules
        for rule in rules:
            base_price = self._apply_rule(base_price, rule, product)

        # Apply rounding
        final_price = self._apply_rounding(
            base_price,
            product.price_rounding
        )

        return final_price

    def _apply_margin(
        self,
        cost: Decimal,
        min_margin: Decimal,
        max_margin: Decimal
    ) -> Decimal:
        """Apply target margin to cost."""
        target_margin = (min_margin + max_margin) / 2
        return cost * (1 + target_margin / 100)

    def _match_competitor_price(
        self,
        current_price: Decimal,
        competitor_prices: List[Decimal],
        cost: Decimal,
        min_margin: Decimal
    ) -> Decimal:
        """Match competitor prices while maintaining minimum margin."""
        min_price = cost * (1 + min_margin / 100)
        lowest_competitor = min(competitor_prices)

        if lowest_competitor >= min_price:
            return lowest_competitor - Decimal('0.01')
        return current_price

    def _apply_rounding(
        self,
        price: Decimal,
        rounding_type: str
    ) -> Decimal:
        """Apply price rounding."""
        if rounding_type == 'nearest_99':
            return Decimal(int(price)) + Decimal('0.99')
        elif rounding_type == 'nearest_95':
            return Decimal(int(price)) + Decimal('0.95')
        return price.quantize(Decimal('0.01'))
```

---

This completes the comprehensive architecture for App 1: Performance Car Parts E-Commerce.
