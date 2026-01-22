# Precision Engine and Dyno, LLC - Auto Machining Business System Architecture

## Overview
A comprehensive business management platform for a precision auto machining shop featuring CRM, scheduling, accounting, inventory management, and customer portal capabilities.

---

## 1. Database Schema (SQLite)

### Entity Relationship Diagram (Conceptual)
```
Customers ──┬── ServiceRequests ──── RequestItems
            │         │
            ├── Jobs ─┴── JobTasks ──── TaskLabor
            │    │
            │    ├── JobParts ──── InventoryItems
            │    └── JobNotes
            │
            ├── Invoices ──── InvoiceItems
            │       │
            │       └── Payments
            │
            ├── Quotes ──── QuoteItems
            │
            └── Communications

Employees ──┬── TimeEntries
            ├── ScheduleEvents
            └── JobAssignments

InventoryItems ──── InventoryTransactions
                └── Suppliers

Equipment ──── MaintenanceLogs
          └── ScheduleEvents
```

### Complete Schema Definition

```sql
-- =============================================
-- USER & EMPLOYEE MANAGEMENT
-- =============================================

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(30) NOT NULL, -- admin, manager, technician, front_desk, customer
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    department VARCHAR(50), -- machining, dyno, assembly, admin
    job_title VARCHAR(100),
    hire_date DATE NOT NULL,
    termination_date DATE,
    hourly_rate DECIMAL(10,2),
    salary DECIMAL(10,2),
    pay_type VARCHAR(20) DEFAULT 'hourly', -- hourly, salary
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    skills JSON, -- ["engine_building", "dyno_tuning", "cnc_machining"]
    certifications JSON, -- [{name, issued_date, expiry_date}]
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE employee_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE time_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    job_id INTEGER,
    task_id INTEGER,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    break_minutes INTEGER DEFAULT 0,
    total_hours DECIMAL(5,2),
    hourly_rate DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    entry_type VARCHAR(20) DEFAULT 'regular', -- regular, overtime, holiday
    notes TEXT,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- =============================================
-- CUSTOMER MANAGEMENT (CRM)
-- =============================================

CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE, -- Linked if customer has portal access
    customer_number VARCHAR(20) UNIQUE NOT NULL,
    customer_type VARCHAR(20) DEFAULT 'individual', -- individual, business, shop

    -- Contact Information
    company_name VARCHAR(200),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(255),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',

    -- Business Info
    tax_id VARCHAR(50),
    payment_terms VARCHAR(50) DEFAULT 'due_on_receipt', -- due_on_receipt, net_15, net_30, net_45, net_60
    credit_limit DECIMAL(10,2),

    -- Preferences
    preferred_contact_method VARCHAR(20) DEFAULT 'email', -- email, phone, sms
    marketing_opt_in BOOLEAN DEFAULT TRUE,

    -- Analytics
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    last_service_date DATE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    tags JSON, -- ["vip", "fleet", "racer"]

    -- Source tracking
    referral_source VARCHAR(100),
    referred_by_customer_id INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (referred_by_customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE customer_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    title VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE customer_vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    year INTEGER,
    make VARCHAR(100),
    model VARCHAR(100),
    submodel VARCHAR(100),
    engine VARCHAR(100),
    vin VARCHAR(17),
    license_plate VARCHAR(20),
    color VARCHAR(50),
    mileage INTEGER,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE customer_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general', -- general, call, meeting, email, issue
    subject VARCHAR(200),
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- SERVICE REQUESTS & QUOTES
-- =============================================

CREATE TABLE service_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- machining, dyno, assembly, general
    description TEXT,
    base_price DECIMAL(10,2),
    estimated_hours DECIMAL(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    vehicle_id INTEGER,

    -- Request Details
    status VARCHAR(30) DEFAULT 'pending', -- pending, reviewing, quoted, approved, declined, converted
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

    -- Description
    title VARCHAR(200) NOT NULL,
    description TEXT,
    customer_notes TEXT,

    -- Desired Timeline
    requested_start_date DATE,
    requested_completion_date DATE,
    is_flexible_timing BOOLEAN DEFAULT TRUE,

    -- Internal
    assigned_to INTEGER,
    internal_notes TEXT,
    estimated_cost DECIMAL(10,2),

    -- Conversion
    converted_to_quote_id INTEGER,
    converted_to_job_id INTEGER,

    -- Source
    source VARCHAR(50) DEFAULT 'website', -- website, phone, email, walk_in, referral

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (vehicle_id) REFERENCES customer_vehicles(id),
    FOREIGN KEY (assigned_to) REFERENCES employees(id)
);

CREATE TABLE service_request_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    service_type_id INTEGER,
    description VARCHAR(500) NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id)
);

CREATE TABLE service_request_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    service_request_id INTEGER,
    vehicle_id INTEGER,

    -- Quote Details
    status VARCHAR(30) DEFAULT 'draft', -- draft, sent, viewed, accepted, declined, expired, revised
    title VARCHAR(200),
    description TEXT,

    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_reason VARCHAR(200),
    total DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Timing
    estimated_start_date DATE,
    estimated_completion_date DATE,
    estimated_hours DECIMAL(6,2),

    -- Validity
    valid_until DATE,

    -- Customer Response
    customer_response_notes TEXT,
    responded_at TIMESTAMP,

    -- Internal
    prepared_by INTEGER,
    internal_notes TEXT,
    terms_and_conditions TEXT,

    -- Conversion
    converted_to_job_id INTEGER,

    -- Version tracking
    version INTEGER DEFAULT 1,
    parent_quote_id INTEGER, -- For revisions

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id),
    FOREIGN KEY (vehicle_id) REFERENCES customer_vehicles(id),
    FOREIGN KEY (prepared_by) REFERENCES employees(id),
    FOREIGN KEY (parent_quote_id) REFERENCES quotes(id)
);

CREATE TABLE quote_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER NOT NULL,
    item_type VARCHAR(20) NOT NULL, -- labor, parts, service, other
    service_type_id INTEGER,
    inventory_item_id INTEGER,

    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,

    -- For labor
    estimated_hours DECIMAL(5,2),
    hourly_rate DECIMAL(10,2),

    notes TEXT,
    display_order INTEGER DEFAULT 0,
    is_taxable BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id),
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

-- =============================================
-- JOB MANAGEMENT
-- =============================================

CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    vehicle_id INTEGER,
    quote_id INTEGER,

    -- Job Details
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Status
    status VARCHAR(30) DEFAULT 'pending', -- pending, scheduled, in_progress, on_hold, quality_check, completed, picked_up, cancelled
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

    -- Scheduling
    scheduled_start_date DATE,
    scheduled_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,

    -- Assignment
    assigned_technician_id INTEGER,
    assigned_bay VARCHAR(50), -- bay_1, bay_2, dyno_room, etc.

    -- Financials
    quoted_amount DECIMAL(10,2),
    actual_labor_cost DECIMAL(10,2) DEFAULT 0,
    actual_parts_cost DECIMAL(10,2) DEFAULT 0,
    actual_total DECIMAL(10,2) DEFAULT 0,

    -- Customer Communication
    customer_approval_required BOOLEAN DEFAULT FALSE,
    customer_approved BOOLEAN,
    customer_approved_at TIMESTAMP,
    customer_po_number VARCHAR(50),

    -- Quality
    quality_check_required BOOLEAN DEFAULT FALSE,
    quality_checked_by INTEGER,
    quality_checked_at TIMESTAMP,

    -- Completion
    completion_notes TEXT,
    customer_notified_at TIMESTAMP,
    picked_up_at TIMESTAMP,

    -- Internal
    internal_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (vehicle_id) REFERENCES customer_vehicles(id),
    FOREIGN KEY (quote_id) REFERENCES quotes(id),
    FOREIGN KEY (assigned_technician_id) REFERENCES employees(id),
    FOREIGN KEY (quality_checked_by) REFERENCES employees(id)
);

CREATE TABLE job_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    service_type_id INTEGER,

    -- Task Details
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Status
    status VARCHAR(30) DEFAULT 'pending', -- pending, in_progress, completed, skipped

    -- Estimates
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2) DEFAULT 0,

    -- Assignment
    assigned_to INTEGER,

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Dependencies
    depends_on_task_id INTEGER,

    -- Ordering
    display_order INTEGER DEFAULT 0,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (service_type_id) REFERENCES service_types(id),
    FOREIGN KEY (assigned_to) REFERENCES employees(id),
    FOREIGN KEY (depends_on_task_id) REFERENCES job_tasks(id)
);

CREATE TABLE job_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    task_id INTEGER,
    inventory_item_id INTEGER,

    -- Part Details
    part_number VARCHAR(100),
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,

    -- Pricing
    unit_cost DECIMAL(10,2),
    markup_percent DECIMAL(5,2) DEFAULT 0,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),

    -- Source
    source VARCHAR(50), -- inventory, ordered, customer_supplied
    supplier_id INTEGER,

    -- Status
    status VARCHAR(30) DEFAULT 'pending', -- pending, ordered, received, installed, returned

    -- Tracking
    ordered_at TIMESTAMP,
    received_at TIMESTAMP,
    installed_at TIMESTAMP,
    installed_by INTEGER,

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES job_tasks(id),
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (installed_by) REFERENCES employees(id)
);

CREATE TABLE job_labor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    task_id INTEGER,
    employee_id INTEGER NOT NULL,
    time_entry_id INTEGER,

    -- Labor Details
    description VARCHAR(500),
    hours DECIMAL(5,2) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Type
    labor_type VARCHAR(30) DEFAULT 'regular', -- regular, overtime, warranty
    is_billable BOOLEAN DEFAULT TRUE,

    performed_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES job_tasks(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (time_entry_id) REFERENCES time_entries(id)
);

CREATE TABLE job_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    note_type VARCHAR(30) DEFAULT 'internal', -- internal, customer_visible, issue, resolution
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE job_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    task_id INTEGER,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50), -- image, document, video
    file_category VARCHAR(50), -- before, after, measurement, dyno_chart
    description TEXT,
    uploaded_by INTEGER,
    is_customer_visible BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES job_tasks(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE job_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL,
    notes TEXT,
    changed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- =============================================
-- SCHEDULING & CALENDAR
-- =============================================

CREATE TABLE schedule_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type VARCHAR(30) NOT NULL, -- job, appointment, meeting, time_off, maintenance, reminder
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Timing
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,

    -- Recurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule VARCHAR(255), -- RRULE format
    recurrence_end_date DATE,
    parent_event_id INTEGER,

    -- Assignment
    employee_id INTEGER,
    equipment_id INTEGER,
    bay_id VARCHAR(50),

    -- Relationships
    job_id INTEGER,
    customer_id INTEGER,

    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled

    -- Colors/Display
    color VARCHAR(20),

    -- Reminders
    reminder_minutes INTEGER,
    reminder_sent BOOLEAN DEFAULT FALSE,

    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (parent_event_id) REFERENCES schedule_events(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE shop_bays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL, -- bay_1, dyno_1, etc.
    bay_type VARCHAR(30), -- general, dyno, machining, assembly
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE shop_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL, -- 0=Sunday
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE
);

CREATE TABLE shop_closures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- INVENTORY MANAGEMENT
-- =============================================

CREATE TABLE inventory_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (parent_id) REFERENCES inventory_categories(id) ON DELETE SET NULL
);

CREATE TABLE inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER,

    -- Identification
    part_number VARCHAR(100),
    manufacturer VARCHAR(100),
    barcode VARCHAR(100),

    -- Pricing
    cost_price DECIMAL(10,2),
    retail_price DECIMAL(10,2),
    markup_percent DECIMAL(5,2),

    -- Stock
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) VIRTUAL,

    -- Reorder
    reorder_point INTEGER DEFAULT 5,
    reorder_quantity INTEGER DEFAULT 10,

    -- Location
    storage_location VARCHAR(100),
    bin_number VARCHAR(50),

    -- Tracking
    track_inventory BOOLEAN DEFAULT TRUE,
    is_consumable BOOLEAN DEFAULT FALSE, -- Shop supplies that don't get billed

    -- Supplier
    preferred_supplier_id INTEGER,
    supplier_part_number VARCHAR(100),

    -- Physical
    unit_of_measure VARCHAR(20) DEFAULT 'each', -- each, set, pair, box
    weight DECIMAL(10,2),

    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES inventory_categories(id),
    FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    transaction_type VARCHAR(30) NOT NULL, -- received, used, adjusted, transferred, returned, scrapped
    quantity INTEGER NOT NULL, -- Positive for in, negative for out

    -- Reference
    reference_type VARCHAR(30), -- job, purchase_order, adjustment
    reference_id INTEGER,

    -- Details
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    notes TEXT,

    -- Tracking
    performed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    fax VARCHAR(20),
    website VARCHAR(255),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),

    -- Terms
    payment_terms VARCHAR(50),
    account_number VARCHAR(100),
    tax_id VARCHAR(50),

    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    po_number VARCHAR(20) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,

    -- Status
    status VARCHAR(30) DEFAULT 'draft', -- draft, sent, confirmed, partial, received, cancelled

    -- Totals
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,

    -- Dates
    order_date DATE,
    expected_date DATE,
    received_date DATE,

    -- Shipping
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(255),

    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL,
    inventory_item_id INTEGER,

    description VARCHAR(500) NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,

    notes TEXT,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

-- =============================================
-- ACCOUNTING & INVOICING
-- =============================================

CREATE TABLE invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    job_id INTEGER,

    -- Status
    status VARCHAR(30) DEFAULT 'draft', -- draft, sent, viewed, partial, paid, overdue, cancelled, void

    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,

    -- Totals
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_reason VARCHAR(200),
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance_due DECIMAL(10,2) GENERATED ALWAYS AS (total - amount_paid) VIRTUAL,

    -- Customer Info at time of invoice
    billing_address JSON,

    -- Reference
    po_number VARCHAR(50),

    -- Notes
    notes TEXT,
    terms TEXT,
    footer_text TEXT,

    -- Tracking
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    paid_at TIMESTAMP,

    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    item_type VARCHAR(20) NOT NULL, -- labor, parts, service, other

    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,

    -- Reference
    job_part_id INTEGER,
    job_labor_id INTEGER,

    is_taxable BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,

    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (job_part_id) REFERENCES job_parts(id),
    FOREIGN KEY (job_labor_id) REFERENCES job_labor(id)
);

CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,

    -- Payment Details
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- cash, check, credit_card, debit_card, ach, wire, paypal
    payment_date DATE NOT NULL,

    -- Reference
    reference_number VARCHAR(100), -- Check number, transaction ID

    -- Card Details (if applicable)
    card_last_four VARCHAR(4),
    card_type VARCHAR(20),

    -- Status
    status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed, refunded

    notes TEXT,
    received_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

CREATE TABLE refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL,
    invoice_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    refund_method VARCHAR(30),
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- pending, processed
    processed_by INTEGER,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(id),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- =============================================
-- BOOKKEEPING & EXPENSES
-- =============================================

CREATE TABLE expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    parent_id INTEGER,
    account_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (parent_id) REFERENCES expense_categories(id)
);

CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    vendor_name VARCHAR(200),
    supplier_id INTEGER,

    -- Details
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Date
    expense_date DATE NOT NULL,

    -- Payment
    payment_method VARCHAR(30),
    reference_number VARCHAR(100),
    is_paid BOOLEAN DEFAULT TRUE,
    paid_date DATE,

    -- Receipt
    receipt_url VARCHAR(500),

    -- Categorization
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_frequency VARCHAR(20), -- weekly, monthly, quarterly, annual

    -- Job allocation (if expense relates to a job)
    job_id INTEGER,
    is_billable BOOLEAN DEFAULT FALSE,

    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(30), -- checking, savings, credit_card
    bank_name VARCHAR(100),
    account_number_last4 VARCHAR(4),
    current_balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bank_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_account_id INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- deposit, withdrawal, transfer, fee
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(12,2),
    transaction_date DATE NOT NULL,
    description VARCHAR(500),

    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP,

    -- Link to source
    payment_id INTEGER,
    expense_id INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id),
    FOREIGN KEY (expense_id) REFERENCES expenses(id)
);

-- =============================================
-- COMMUNICATION
-- =============================================

CREATE TABLE communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    job_id INTEGER,

    -- Type
    channel VARCHAR(20) NOT NULL, -- email, sms, phone, in_person
    direction VARCHAR(10) NOT NULL, -- inbound, outbound

    -- Content
    subject VARCHAR(255),
    content TEXT NOT NULL,

    -- Email specific
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    cc_addresses JSON,

    -- SMS specific
    phone_number VARCHAR(20),

    -- Status
    status VARCHAR(20) DEFAULT 'sent', -- draft, queued, sent, delivered, failed, read

    -- Template
    template_id INTEGER,

    -- Tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,

    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (template_id) REFERENCES communication_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE communication_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL, -- email, sms
    category VARCHAR(50), -- quote, invoice, job_update, reminder, marketing
    subject VARCHAR(255),
    content TEXT NOT NULL,
    variables JSON, -- List of available merge variables
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE communication_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    communication_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    FOREIGN KEY (communication_id) REFERENCES communications(id) ON DELETE CASCADE
);

-- =============================================
-- EQUIPMENT & MAINTENANCE
-- =============================================

CREATE TABLE equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    equipment_type VARCHAR(50), -- dyno, cnc, mill, lathe, press, etc.
    make VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),

    -- Location
    location VARCHAR(100),
    bay_id INTEGER,

    -- Dates
    purchase_date DATE,
    warranty_expiry DATE,

    -- Value
    purchase_price DECIMAL(10,2),
    current_value DECIMAL(10,2),

    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_interval_days INTEGER,

    -- Status
    status VARCHAR(20) DEFAULT 'operational', -- operational, maintenance, repair, retired

    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bay_id) REFERENCES shop_bays(id)
);

CREATE TABLE equipment_maintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL,
    maintenance_type VARCHAR(50), -- routine, repair, calibration, inspection
    description TEXT NOT NULL,

    -- Timing
    scheduled_date DATE,
    performed_date DATE,

    -- Details
    performed_by INTEGER,
    vendor_name VARCHAR(200),

    -- Cost
    labor_cost DECIMAL(10,2) DEFAULT 0,
    parts_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,

    -- Downtime
    downtime_hours DECIMAL(5,2),

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES employees(id)
);

-- =============================================
-- DYNO SPECIFIC
-- =============================================

CREATE TABLE dyno_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    equipment_id INTEGER NOT NULL, -- Which dyno

    -- Session Info
    session_number VARCHAR(20) UNIQUE NOT NULL,
    session_date TIMESTAMP NOT NULL,

    -- Operator
    operator_id INTEGER NOT NULL,

    -- Conditions
    ambient_temp DECIMAL(5,2),
    humidity DECIMAL(5,2),
    barometric_pressure DECIMAL(7,2),

    -- Results (Peak)
    peak_hp DECIMAL(7,2),
    peak_hp_rpm INTEGER,
    peak_torque DECIMAL(7,2),
    peak_torque_rpm INTEGER,

    -- Correction Factor
    correction_factor VARCHAR(20), -- SAE, STD, None

    -- Files
    data_file_url VARCHAR(500),
    chart_file_url VARCHAR(500),

    notes TEXT,
    is_baseline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (vehicle_id) REFERENCES customer_vehicles(id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (operator_id) REFERENCES employees(id)
);

CREATE TABLE dyno_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    run_number INTEGER NOT NULL,

    -- Results
    peak_hp DECIMAL(7,2),
    peak_hp_rpm INTEGER,
    peak_torque DECIMAL(7,2),
    peak_torque_rpm INTEGER,

    -- Additional Data
    boost_pressure DECIMAL(5,2),
    air_fuel_ratio DECIMAL(5,2),

    -- Raw Data
    data_points JSON, -- Array of {rpm, hp, torque, afr, boost, etc.}

    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES dyno_sessions(id) ON DELETE CASCADE
);

-- =============================================
-- SETTINGS & CONFIGURATION
-- =============================================

CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    category VARCHAR(50),
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tax_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE labor_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    rate_type VARCHAR(30), -- machining, dyno, assembly, diagnostic
    hourly_rate DECIMAL(10,2) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================
-- AUDIT & LOGGING
-- =============================================

CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL, -- create, update, delete, login, logout, etc.
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE system_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_number ON customers(customer_number);
CREATE INDEX idx_jobs_number ON jobs(job_number);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_start_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_quotes_number ON quotes(quote_number);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_schedule_dates ON schedule_events(start_datetime, end_datetime);
CREATE INDEX idx_schedule_employee ON schedule_events(employee_id);
CREATE INDEX idx_inventory_sku ON inventory_items(sku);
CREATE INDEX idx_time_entries_employee ON time_entries(employee_id);
CREATE INDEX idx_time_entries_date ON time_entries(clock_in);
CREATE INDEX idx_communications_customer ON communications(customer_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_payments_date ON payments(payment_date);
```

---

## 2. API Endpoints (FastAPI)

### Authentication & Users
```
POST   /api/v1/auth/login                 - User login
POST   /api/v1/auth/logout                - User logout
POST   /api/v1/auth/refresh               - Refresh token
POST   /api/v1/auth/forgot-password       - Request password reset
POST   /api/v1/auth/reset-password        - Reset password

GET    /api/v1/users/me                   - Get current user
PUT    /api/v1/users/me                   - Update current user
PUT    /api/v1/users/me/password          - Change password

# Admin
GET    /api/v1/admin/users                - List users
POST   /api/v1/admin/users                - Create user
GET    /api/v1/admin/users/{id}           - Get user
PUT    /api/v1/admin/users/{id}           - Update user
DELETE /api/v1/admin/users/{id}           - Deactivate user
```

### Employees
```
GET    /api/v1/employees                  - List employees
POST   /api/v1/employees                  - Create employee
GET    /api/v1/employees/{id}             - Get employee details
PUT    /api/v1/employees/{id}             - Update employee
DELETE /api/v1/employees/{id}             - Deactivate employee
GET    /api/v1/employees/{id}/schedule    - Get employee schedule
GET    /api/v1/employees/{id}/time-entries - Get time entries
GET    /api/v1/employees/{id}/availability - Get availability
PUT    /api/v1/employees/{id}/availability - Update availability
```

### Time Tracking
```
POST   /api/v1/time-tracking/clock-in     - Clock in
POST   /api/v1/time-tracking/clock-out    - Clock out
GET    /api/v1/time-tracking/current      - Get current status
GET    /api/v1/time-entries               - List time entries (filterable)
POST   /api/v1/time-entries               - Create manual entry
PUT    /api/v1/time-entries/{id}          - Update entry
DELETE /api/v1/time-entries/{id}          - Delete entry
POST   /api/v1/time-entries/{id}/approve  - Approve entry
GET    /api/v1/time-entries/report        - Time report
```

### Customers (CRM)
```
GET    /api/v1/customers                  - List customers (search, filter, paginate)
POST   /api/v1/customers                  - Create customer
GET    /api/v1/customers/{id}             - Get customer details
PUT    /api/v1/customers/{id}             - Update customer
DELETE /api/v1/customers/{id}             - Deactivate customer
GET    /api/v1/customers/{id}/vehicles    - Get customer vehicles
POST   /api/v1/customers/{id}/vehicles    - Add vehicle
PUT    /api/v1/customers/{id}/vehicles/{v_id} - Update vehicle
DELETE /api/v1/customers/{id}/vehicles/{v_id} - Remove vehicle
GET    /api/v1/customers/{id}/contacts    - Get contacts
POST   /api/v1/customers/{id}/contacts    - Add contact
PUT    /api/v1/customers/{id}/contacts/{c_id} - Update contact
DELETE /api/v1/customers/{id}/contacts/{c_id} - Remove contact
GET    /api/v1/customers/{id}/notes       - Get customer notes
POST   /api/v1/customers/{id}/notes       - Add note
GET    /api/v1/customers/{id}/jobs        - Get customer jobs
GET    /api/v1/customers/{id}/invoices    - Get customer invoices
GET    /api/v1/customers/{id}/quotes      - Get customer quotes
GET    /api/v1/customers/{id}/communications - Get communications
GET    /api/v1/customers/{id}/history     - Get full history
GET    /api/v1/customers/export           - Export customers CSV
POST   /api/v1/customers/import           - Import customers
```

### Service Requests (Customer Portal)
```
GET    /api/v1/service-requests           - List requests
POST   /api/v1/service-requests           - Create request (portal/admin)
GET    /api/v1/service-requests/{id}      - Get request details
PUT    /api/v1/service-requests/{id}      - Update request
DELETE /api/v1/service-requests/{id}      - Delete request
POST   /api/v1/service-requests/{id}/files - Upload files
DELETE /api/v1/service-requests/{id}/files/{f_id} - Delete file
POST   /api/v1/service-requests/{id}/convert-to-quote - Convert to quote
POST   /api/v1/service-requests/{id}/convert-to-job - Convert to job

# Service Types
GET    /api/v1/service-types              - List service types
POST   /api/v1/service-types              - Create service type
PUT    /api/v1/service-types/{id}         - Update service type
DELETE /api/v1/service-types/{id}         - Delete service type
```

### Quotes
```
GET    /api/v1/quotes                     - List quotes
POST   /api/v1/quotes                     - Create quote
GET    /api/v1/quotes/{id}                - Get quote details
PUT    /api/v1/quotes/{id}                - Update quote
DELETE /api/v1/quotes/{id}                - Delete quote
POST   /api/v1/quotes/{id}/items          - Add item
PUT    /api/v1/quotes/{id}/items/{i_id}   - Update item
DELETE /api/v1/quotes/{id}/items/{i_id}   - Remove item
POST   /api/v1/quotes/{id}/send           - Send to customer
POST   /api/v1/quotes/{id}/accept         - Customer accepts
POST   /api/v1/quotes/{id}/decline        - Customer declines
POST   /api/v1/quotes/{id}/revise         - Create revision
POST   /api/v1/quotes/{id}/convert-to-job - Convert to job
GET    /api/v1/quotes/{id}/pdf            - Generate PDF
POST   /api/v1/quotes/{id}/duplicate      - Duplicate quote
```

### Jobs
```
GET    /api/v1/jobs                       - List jobs (filterable)
POST   /api/v1/jobs                       - Create job
GET    /api/v1/jobs/{id}                  - Get job details
PUT    /api/v1/jobs/{id}                  - Update job
DELETE /api/v1/jobs/{id}                  - Cancel job
PUT    /api/v1/jobs/{id}/status           - Update status
POST   /api/v1/jobs/{id}/assign           - Assign technician

# Tasks
GET    /api/v1/jobs/{id}/tasks            - Get tasks
POST   /api/v1/jobs/{id}/tasks            - Add task
PUT    /api/v1/jobs/{id}/tasks/{t_id}     - Update task
DELETE /api/v1/jobs/{id}/tasks/{t_id}     - Remove task
PUT    /api/v1/jobs/{id}/tasks/{t_id}/status - Update task status
PUT    /api/v1/jobs/{id}/tasks/reorder    - Reorder tasks

# Parts
GET    /api/v1/jobs/{id}/parts            - Get parts
POST   /api/v1/jobs/{id}/parts            - Add part
PUT    /api/v1/jobs/{id}/parts/{p_id}     - Update part
DELETE /api/v1/jobs/{id}/parts/{p_id}     - Remove part
PUT    /api/v1/jobs/{id}/parts/{p_id}/status - Update part status

# Labor
GET    /api/v1/jobs/{id}/labor            - Get labor entries
POST   /api/v1/jobs/{id}/labor            - Add labor entry
PUT    /api/v1/jobs/{id}/labor/{l_id}     - Update labor
DELETE /api/v1/jobs/{id}/labor/{l_id}     - Remove labor

# Notes & Files
GET    /api/v1/jobs/{id}/notes            - Get notes
POST   /api/v1/jobs/{id}/notes            - Add note
GET    /api/v1/jobs/{id}/files            - Get files
POST   /api/v1/jobs/{id}/files            - Upload file
DELETE /api/v1/jobs/{id}/files/{f_id}     - Delete file

# Actions
POST   /api/v1/jobs/{id}/create-invoice   - Create invoice
GET    /api/v1/jobs/{id}/history          - Get status history
GET    /api/v1/jobs/board                 - Get job board view
GET    /api/v1/jobs/export                - Export jobs
```

### Scheduling
```
GET    /api/v1/schedule/events            - List events (date range, filters)
POST   /api/v1/schedule/events            - Create event
GET    /api/v1/schedule/events/{id}       - Get event
PUT    /api/v1/schedule/events/{id}       - Update event
DELETE /api/v1/schedule/events/{id}       - Delete event
POST   /api/v1/schedule/events/{id}/complete - Complete event

GET    /api/v1/schedule/calendar          - Calendar view (day/week/month)
GET    /api/v1/schedule/timeline          - Timeline view
GET    /api/v1/schedule/availability      - Check availability

# Shop Schedule
GET    /api/v1/schedule/shop-hours        - Get shop hours
PUT    /api/v1/schedule/shop-hours        - Update shop hours
GET    /api/v1/schedule/closures          - List closures
POST   /api/v1/schedule/closures          - Add closure
DELETE /api/v1/schedule/closures/{id}     - Remove closure

# Bays
GET    /api/v1/schedule/bays              - List bays
POST   /api/v1/schedule/bays              - Create bay
PUT    /api/v1/schedule/bays/{id}         - Update bay
GET    /api/v1/schedule/bays/{id}/availability - Bay availability
```

### Invoicing
```
GET    /api/v1/invoices                   - List invoices
POST   /api/v1/invoices                   - Create invoice
GET    /api/v1/invoices/{id}              - Get invoice details
PUT    /api/v1/invoices/{id}              - Update invoice
DELETE /api/v1/invoices/{id}              - Delete/void invoice
POST   /api/v1/invoices/{id}/items        - Add item
PUT    /api/v1/invoices/{id}/items/{i_id} - Update item
DELETE /api/v1/invoices/{id}/items/{i_id} - Remove item
POST   /api/v1/invoices/{id}/send         - Send invoice
GET    /api/v1/invoices/{id}/pdf          - Generate PDF
POST   /api/v1/invoices/{id}/duplicate    - Duplicate invoice
POST   /api/v1/invoices/{id}/void         - Void invoice
GET    /api/v1/invoices/overdue           - List overdue invoices
GET    /api/v1/invoices/export            - Export invoices
```

### Payments
```
GET    /api/v1/payments                   - List payments
POST   /api/v1/payments                   - Record payment
GET    /api/v1/payments/{id}              - Get payment details
PUT    /api/v1/payments/{id}              - Update payment
DELETE /api/v1/payments/{id}              - Delete payment
POST   /api/v1/payments/{id}/refund       - Process refund
GET    /api/v1/payments/report            - Payment report
```

### Inventory
```
GET    /api/v1/inventory                  - List inventory items
POST   /api/v1/inventory                  - Create item
GET    /api/v1/inventory/{id}             - Get item details
PUT    /api/v1/inventory/{id}             - Update item
DELETE /api/v1/inventory/{id}             - Deactivate item
PUT    /api/v1/inventory/{id}/adjust      - Adjust quantity
GET    /api/v1/inventory/{id}/transactions - Get transactions
GET    /api/v1/inventory/low-stock        - Low stock items
GET    /api/v1/inventory/reorder          - Reorder list
GET    /api/v1/inventory/export           - Export inventory
POST   /api/v1/inventory/import           - Import inventory

# Categories
GET    /api/v1/inventory/categories       - List categories
POST   /api/v1/inventory/categories       - Create category
PUT    /api/v1/inventory/categories/{id}  - Update category
DELETE /api/v1/inventory/categories/{id}  - Delete category

# Suppliers
GET    /api/v1/suppliers                  - List suppliers
POST   /api/v1/suppliers                  - Create supplier
GET    /api/v1/suppliers/{id}             - Get supplier
PUT    /api/v1/suppliers/{id}             - Update supplier
DELETE /api/v1/suppliers/{id}             - Delete supplier

# Purchase Orders
GET    /api/v1/purchase-orders            - List POs
POST   /api/v1/purchase-orders            - Create PO
GET    /api/v1/purchase-orders/{id}       - Get PO
PUT    /api/v1/purchase-orders/{id}       - Update PO
DELETE /api/v1/purchase-orders/{id}       - Delete PO
POST   /api/v1/purchase-orders/{id}/send  - Send to supplier
POST   /api/v1/purchase-orders/{id}/receive - Receive items
```

### Bookkeeping & Expenses
```
GET    /api/v1/expenses                   - List expenses
POST   /api/v1/expenses                   - Create expense
GET    /api/v1/expenses/{id}              - Get expense
PUT    /api/v1/expenses/{id}              - Update expense
DELETE /api/v1/expenses/{id}              - Delete expense
POST   /api/v1/expenses/{id}/receipt      - Upload receipt

# Categories
GET    /api/v1/expenses/categories        - List categories
POST   /api/v1/expenses/categories        - Create category
PUT    /api/v1/expenses/categories/{id}   - Update category

# Bank Accounts
GET    /api/v1/banking/accounts           - List accounts
POST   /api/v1/banking/accounts           - Add account
PUT    /api/v1/banking/accounts/{id}      - Update account
GET    /api/v1/banking/accounts/{id}/transactions - Get transactions
POST   /api/v1/banking/accounts/{id}/transactions - Add transaction
PUT    /api/v1/banking/transactions/{id}/reconcile - Reconcile
```

### Communications
```
GET    /api/v1/communications             - List communications
POST   /api/v1/communications/email       - Send email
POST   /api/v1/communications/sms         - Send SMS
GET    /api/v1/communications/{id}        - Get details
POST   /api/v1/communications/{id}/resend - Resend

# Templates
GET    /api/v1/communications/templates   - List templates
POST   /api/v1/communications/templates   - Create template
PUT    /api/v1/communications/templates/{id} - Update template
DELETE /api/v1/communications/templates/{id} - Delete template
POST   /api/v1/communications/templates/{id}/preview - Preview
```

### Equipment & Maintenance
```
GET    /api/v1/equipment                  - List equipment
POST   /api/v1/equipment                  - Add equipment
GET    /api/v1/equipment/{id}             - Get details
PUT    /api/v1/equipment/{id}             - Update equipment
DELETE /api/v1/equipment/{id}             - Remove equipment
GET    /api/v1/equipment/{id}/maintenance - Maintenance history
POST   /api/v1/equipment/{id}/maintenance - Log maintenance
GET    /api/v1/equipment/maintenance-due  - Due for maintenance
```

### Dyno Operations
```
GET    /api/v1/dyno/sessions              - List sessions
POST   /api/v1/dyno/sessions              - Create session
GET    /api/v1/dyno/sessions/{id}         - Get session
PUT    /api/v1/dyno/sessions/{id}         - Update session
DELETE /api/v1/dyno/sessions/{id}         - Delete session
GET    /api/v1/dyno/sessions/{id}/runs    - Get runs
POST   /api/v1/dyno/sessions/{id}/runs    - Add run
GET    /api/v1/dyno/sessions/{id}/chart   - Generate chart
GET    /api/v1/dyno/sessions/{id}/export  - Export data
POST   /api/v1/dyno/sessions/{id}/upload  - Upload data file
GET    /api/v1/dyno/compare               - Compare sessions
```

### Analytics & Reports
```
GET    /api/v1/analytics/dashboard        - Dashboard metrics
GET    /api/v1/analytics/revenue          - Revenue analytics
GET    /api/v1/analytics/jobs             - Job analytics
GET    /api/v1/analytics/customers        - Customer analytics
GET    /api/v1/analytics/employees        - Employee productivity
GET    /api/v1/analytics/inventory        - Inventory analytics

GET    /api/v1/reports/profit-loss        - P&L report
GET    /api/v1/reports/accounts-receivable - A/R report
GET    /api/v1/reports/accounts-payable   - A/P report
GET    /api/v1/reports/sales-tax          - Sales tax report
GET    /api/v1/reports/labor              - Labor report
GET    /api/v1/reports/inventory-valuation - Inventory value
GET    /api/v1/reports/customer-aging     - Customer aging
```

### Settings
```
GET    /api/v1/settings                   - Get all settings
PUT    /api/v1/settings                   - Update settings
GET    /api/v1/settings/{key}             - Get setting
PUT    /api/v1/settings/{key}             - Update setting

# Tax Rates
GET    /api/v1/settings/tax-rates         - List tax rates
POST   /api/v1/settings/tax-rates         - Create rate
PUT    /api/v1/settings/tax-rates/{id}    - Update rate

# Labor Rates
GET    /api/v1/settings/labor-rates       - List labor rates
POST   /api/v1/settings/labor-rates       - Create rate
PUT    /api/v1/settings/labor-rates/{id}  - Update rate
```

### Customer Portal
```
# For authenticated customers only
GET    /api/v1/portal/profile             - Get profile
PUT    /api/v1/portal/profile             - Update profile
GET    /api/v1/portal/vehicles            - My vehicles
POST   /api/v1/portal/vehicles            - Add vehicle
PUT    /api/v1/portal/vehicles/{id}       - Update vehicle

GET    /api/v1/portal/requests            - My service requests
POST   /api/v1/portal/requests            - Submit request
GET    /api/v1/portal/requests/{id}       - Request details
POST   /api/v1/portal/requests/{id}/files - Upload files

GET    /api/v1/portal/quotes              - My quotes
GET    /api/v1/portal/quotes/{id}         - Quote details
POST   /api/v1/portal/quotes/{id}/accept  - Accept quote
POST   /api/v1/portal/quotes/{id}/decline - Decline quote

GET    /api/v1/portal/jobs                - My jobs
GET    /api/v1/portal/jobs/{id}           - Job status/details
GET    /api/v1/portal/jobs/{id}/files     - Job files/photos
POST   /api/v1/portal/jobs/{id}/approve   - Approve additional work

GET    /api/v1/portal/invoices            - My invoices
GET    /api/v1/portal/invoices/{id}       - Invoice details
GET    /api/v1/portal/invoices/{id}/pdf   - Download PDF
POST   /api/v1/portal/invoices/{id}/pay   - Online payment

GET    /api/v1/portal/dyno/{job_id}       - Dyno results
GET    /api/v1/portal/communications      - My messages
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
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Modal/
│   │   ├── Dropdown/
│   │   ├── Pagination/
│   │   ├── LoadingSpinner/
│   │   ├── Toast/
│   │   ├── Badge/
│   │   ├── Card/
│   │   ├── Avatar/
│   │   ├── Tabs/
│   │   ├── DatePicker/
│   │   ├── TimePicker/
│   │   ├── DateRangePicker/
│   │   ├── FileUpload/
│   │   ├── ImagePreview/
│   │   ├── RichTextEditor/
│   │   ├── DataTable/
│   │   │   ├── DataTable.tsx
│   │   │   ├── TableHeader.tsx
│   │   │   ├── TableRow.tsx
│   │   │   ├── TableFilters.tsx
│   │   │   ├── TablePagination.tsx
│   │   │   └── ColumnSelector.tsx
│   │   ├── SearchInput/
│   │   ├── FilterPanel/
│   │   ├── ConfirmDialog/
│   │   ├── EmptyState/
│   │   ├── StatusBadge/
│   │   └── MoneyInput/
│   │
│   ├── layout/
│   │   ├── MainLayout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidebarNav.tsx
│   │   │   ├── UserMenu.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   └── Breadcrumb.tsx
│   │   ├── PortalLayout/
│   │   │   ├── PortalLayout.tsx
│   │   │   ├── PortalHeader.tsx
│   │   │   └── PortalNav.tsx
│   │   └── AuthLayout/
│   │
│   ├── dashboard/
│   │   ├── DashboardStats/
│   │   ├── RevenueChart/
│   │   ├── JobsOverview/
│   │   ├── UpcomingSchedule/
│   │   ├── RecentActivity/
│   │   ├── OverdueInvoices/
│   │   ├── LowStockAlert/
│   │   └── QuickActions/
│   │
│   ├── customers/
│   │   ├── CustomerList/
│   │   ├── CustomerCard/
│   │   ├── CustomerForm/
│   │   ├── CustomerDetail/
│   │   │   ├── CustomerHeader.tsx
│   │   │   ├── CustomerInfo.tsx
│   │   │   ├── CustomerVehicles.tsx
│   │   │   ├── CustomerContacts.tsx
│   │   │   ├── CustomerNotes.tsx
│   │   │   ├── CustomerJobs.tsx
│   │   │   ├── CustomerInvoices.tsx
│   │   │   └── CustomerTimeline.tsx
│   │   ├── VehicleForm/
│   │   ├── ContactForm/
│   │   └── CustomerSearch/
│   │
│   ├── jobs/
│   │   ├── JobBoard/
│   │   │   ├── JobBoard.tsx
│   │   │   ├── JobColumn.tsx
│   │   │   ├── JobCard.tsx
│   │   │   └── JobDragHandle.tsx
│   │   ├── JobList/
│   │   ├── JobForm/
│   │   ├── JobDetail/
│   │   │   ├── JobHeader.tsx
│   │   │   ├── JobInfo.tsx
│   │   │   ├── JobTasks.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   ├── JobParts.tsx
│   │   │   ├── PartItem.tsx
│   │   │   ├── JobLabor.tsx
│   │   │   ├── LaborEntry.tsx
│   │   │   ├── JobFiles.tsx
│   │   │   ├── JobNotes.tsx
│   │   │   ├── JobTimeline.tsx
│   │   │   └── JobActions.tsx
│   │   ├── TaskForm/
│   │   ├── PartForm/
│   │   ├── LaborForm/
│   │   └── JobStatusSelect/
│   │
│   ├── quotes/
│   │   ├── QuoteList/
│   │   ├── QuoteForm/
│   │   ├── QuoteDetail/
│   │   │   ├── QuoteHeader.tsx
│   │   │   ├── QuoteInfo.tsx
│   │   │   ├── QuoteItems.tsx
│   │   │   ├── QuoteItemForm.tsx
│   │   │   ├── QuoteTotals.tsx
│   │   │   └── QuoteActions.tsx
│   │   ├── QuotePDF/
│   │   └── QuoteStatusBadge/
│   │
│   ├── service-requests/
│   │   ├── RequestList/
│   │   ├── RequestForm/
│   │   ├── RequestDetail/
│   │   └── RequestStatusBadge/
│   │
│   ├── scheduling/
│   │   ├── Calendar/
│   │   │   ├── Calendar.tsx
│   │   │   ├── CalendarHeader.tsx
│   │   │   ├── CalendarDay.tsx
│   │   │   ├── CalendarWeek.tsx
│   │   │   ├── CalendarMonth.tsx
│   │   │   ├── EventItem.tsx
│   │   │   └── EventPopover.tsx
│   │   ├── Timeline/
│   │   │   ├── Timeline.tsx
│   │   │   ├── TimelineRow.tsx
│   │   │   └── TimelineEvent.tsx
│   │   ├── EventForm/
│   │   ├── BaySchedule/
│   │   └── AvailabilityChecker/
│   │
│   ├── invoices/
│   │   ├── InvoiceList/
│   │   ├── InvoiceForm/
│   │   ├── InvoiceDetail/
│   │   │   ├── InvoiceHeader.tsx
│   │   │   ├── InvoiceItems.tsx
│   │   │   ├── InvoiceTotals.tsx
│   │   │   ├── PaymentHistory.tsx
│   │   │   └── InvoiceActions.tsx
│   │   ├── InvoicePDF/
│   │   ├── PaymentForm/
│   │   └── InvoiceStatusBadge/
│   │
│   ├── inventory/
│   │   ├── InventoryList/
│   │   ├── InventoryForm/
│   │   ├── InventoryDetail/
│   │   ├── AdjustmentForm/
│   │   ├── LowStockList/
│   │   ├── ReorderList/
│   │   └── TransactionHistory/
│   │
│   ├── purchase-orders/
│   │   ├── POList/
│   │   ├── POForm/
│   │   ├── PODetail/
│   │   └── ReceiveItems/
│   │
│   ├── accounting/
│   │   ├── ExpenseList/
│   │   ├── ExpenseForm/
│   │   ├── BankAccounts/
│   │   ├── TransactionList/
│   │   └── ReconciliationView/
│   │
│   ├── employees/
│   │   ├── EmployeeList/
│   │   ├── EmployeeForm/
│   │   ├── EmployeeDetail/
│   │   ├── AvailabilityEditor/
│   │   └── EmployeeSchedule/
│   │
│   ├── time-tracking/
│   │   ├── ClockInOut/
│   │   ├── TimeEntryList/
│   │   ├── TimeEntryForm/
│   │   ├── TimesheetView/
│   │   └── ApprovalQueue/
│   │
│   ├── communications/
│   │   ├── MessageList/
│   │   ├── EmailComposer/
│   │   ├── SMSComposer/
│   │   ├── TemplateManager/
│   │   └── TemplateEditor/
│   │
│   ├── equipment/
│   │   ├── EquipmentList/
│   │   ├── EquipmentForm/
│   │   ├── EquipmentDetail/
│   │   ├── MaintenanceLog/
│   │   └── MaintenanceSchedule/
│   │
│   ├── dyno/
│   │   ├── SessionList/
│   │   ├── SessionForm/
│   │   ├── SessionDetail/
│   │   │   ├── SessionHeader.tsx
│   │   │   ├── RunList.tsx
│   │   │   ├── RunForm.tsx
│   │   │   └── DynoChart.tsx
│   │   ├── DynoChart/
│   │   │   ├── DynoChart.tsx
│   │   │   ├── ChartOptions.tsx
│   │   │   └── ChartLegend.tsx
│   │   ├── CompareView/
│   │   └── DataUpload/
│   │
│   ├── reports/
│   │   ├── ReportLayout/
│   │   ├── ProfitLossReport/
│   │   ├── SalesTaxReport/
│   │   ├── ARAgingReport/
│   │   ├── LaborReport/
│   │   ├── InventoryReport/
│   │   ├── CustomerReport/
│   │   ├── ReportFilters/
│   │   └── ReportExport/
│   │
│   ├── analytics/
│   │   ├── AnalyticsDashboard/
│   │   ├── RevenueChart/
│   │   ├── JobMetrics/
│   │   ├── CustomerMetrics/
│   │   ├── EmployeeMetrics/
│   │   └── TrendChart/
│   │
│   └── settings/
│       ├── SettingsLayout/
│       ├── GeneralSettings/
│       ├── CompanySettings/
│       ├── TaxRateSettings/
│       ├── LaborRateSettings/
│       ├── ShopHoursSettings/
│       ├── BaySettings/
│       ├── UserManagement/
│       ├── TemplateSettings/
│       └── IntegrationSettings/
│
├── portal/                          # Customer Portal
│   ├── PortalApp.tsx
│   ├── components/
│   │   ├── PortalDashboard/
│   │   ├── RequestForm/
│   │   ├── RequestList/
│   │   ├── RequestDetail/
│   │   ├── QuoteView/
│   │   ├── QuoteActions/
│   │   ├── JobTracking/
│   │   ├── JobTimeline/
│   │   ├── InvoiceList/
│   │   ├── InvoiceView/
│   │   ├── PaymentForm/
│   │   ├── VehicleManager/
│   │   ├── ProfileEditor/
│   │   └── DynoResults/
│   └── pages/
│       ├── PortalHome/
│       ├── MyRequests/
│       ├── MyQuotes/
│       ├── MyJobs/
│       ├── MyInvoices/
│       ├── MyVehicles/
│       └── MyProfile/
│
├── pages/
│   ├── Dashboard/
│   ├── Customers/
│   │   ├── CustomerListPage.tsx
│   │   └── CustomerDetailPage.tsx
│   ├── Jobs/
│   │   ├── JobBoardPage.tsx
│   │   ├── JobListPage.tsx
│   │   └── JobDetailPage.tsx
│   ├── Quotes/
│   │   ├── QuoteListPage.tsx
│   │   └── QuoteDetailPage.tsx
│   ├── ServiceRequests/
│   │   ├── RequestListPage.tsx
│   │   └── RequestDetailPage.tsx
│   ├── Schedule/
│   │   └── SchedulePage.tsx
│   ├── Invoices/
│   │   ├── InvoiceListPage.tsx
│   │   └── InvoiceDetailPage.tsx
│   ├── Payments/
│   │   └── PaymentsPage.tsx
│   ├── Inventory/
│   │   ├── InventoryListPage.tsx
│   │   └── InventoryDetailPage.tsx
│   ├── PurchaseOrders/
│   │   ├── POListPage.tsx
│   │   └── PODetailPage.tsx
│   ├── Accounting/
│   │   ├── ExpensesPage.tsx
│   │   └── BankingPage.tsx
│   ├── Employees/
│   │   ├── EmployeeListPage.tsx
│   │   └── EmployeeDetailPage.tsx
│   ├── TimeTracking/
│   │   └── TimeTrackingPage.tsx
│   ├── Equipment/
│   │   ├── EquipmentListPage.tsx
│   │   └── EquipmentDetailPage.tsx
│   ├── Dyno/
│   │   ├── DynoSessionsPage.tsx
│   │   └── DynoSessionDetailPage.tsx
│   ├── Reports/
│   │   └── ReportsPage.tsx
│   ├── Analytics/
│   │   └── AnalyticsPage.tsx
│   ├── Settings/
│   │   └── SettingsPage.tsx
│   └── Auth/
│       ├── LoginPage.tsx
│       └── ForgotPasswordPage.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useCustomers.ts
│   ├── useJobs.ts
│   ├── useQuotes.ts
│   ├── useInvoices.ts
│   ├── useInventory.ts
│   ├── useSchedule.ts
│   ├── useEmployees.ts
│   ├── useTimeTracking.ts
│   ├── useDyno.ts
│   ├── useAnalytics.ts
│   ├── usePagination.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── usePermissions.ts
│
├── context/
│   ├── AuthContext.tsx
│   ├── ToastContext.tsx
│   ├── SettingsContext.tsx
│   └── ThemeContext.tsx
│
├── services/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── customers.ts
│   │   ├── jobs.ts
│   │   ├── quotes.ts
│   │   ├── serviceRequests.ts
│   │   ├── invoices.ts
│   │   ├── payments.ts
│   │   ├── inventory.ts
│   │   ├── purchaseOrders.ts
│   │   ├── expenses.ts
│   │   ├── employees.ts
│   │   ├── timeTracking.ts
│   │   ├── schedule.ts
│   │   ├── communications.ts
│   │   ├── equipment.ts
│   │   ├── dyno.ts
│   │   ├── analytics.ts
│   │   ├── reports.ts
│   │   └── settings.ts
│   └── pdf.ts
│
├── store/
│   ├── index.ts
│   └── slices/
│       ├── authSlice.ts
│       ├── uiSlice.ts
│       └── settingsSlice.ts
│
├── types/
│   ├── customer.ts
│   ├── job.ts
│   ├── quote.ts
│   ├── invoice.ts
│   ├── inventory.ts
│   ├── employee.ts
│   ├── schedule.ts
│   ├── dyno.ts
│   └── api.ts
│
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   ├── dateHelpers.ts
│   ├── moneyHelpers.ts
│   ├── permissions.ts
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
│   ├── main.py
│   ├── config.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── endpoints/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── employees.py
│   │   │   │   ├── time_tracking.py
│   │   │   │   ├── customers.py
│   │   │   │   ├── service_requests.py
│   │   │   │   ├── quotes.py
│   │   │   │   ├── jobs.py
│   │   │   │   ├── schedule.py
│   │   │   │   ├── invoices.py
│   │   │   │   ├── payments.py
│   │   │   │   ├── inventory.py
│   │   │   │   ├── purchase_orders.py
│   │   │   │   ├── suppliers.py
│   │   │   │   ├── expenses.py
│   │   │   │   ├── banking.py
│   │   │   │   ├── communications.py
│   │   │   │   ├── equipment.py
│   │   │   │   ├── dyno.py
│   │   │   │   ├── analytics.py
│   │   │   │   ├── reports.py
│   │   │   │   ├── settings.py
│   │   │   │   └── portal.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── exceptions.py
│   │   ├── permissions.py
│   │   └── logging.py
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── base.py
│   │   └── session.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── employee.py
│   │   ├── time_entry.py
│   │   ├── customer.py
│   │   ├── service_request.py
│   │   ├── quote.py
│   │   ├── job.py
│   │   ├── schedule.py
│   │   ├── invoice.py
│   │   ├── payment.py
│   │   ├── inventory.py
│   │   ├── purchase_order.py
│   │   ├── supplier.py
│   │   ├── expense.py
│   │   ├── bank_account.py
│   │   ├── communication.py
│   │   ├── equipment.py
│   │   ├── dyno.py
│   │   ├── settings.py
│   │   └── audit.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── employee.py
│   │   ├── time_entry.py
│   │   ├── customer.py
│   │   ├── service_request.py
│   │   ├── quote.py
│   │   ├── job.py
│   │   ├── schedule.py
│   │   ├── invoice.py
│   │   ├── payment.py
│   │   ├── inventory.py
│   │   ├── purchase_order.py
│   │   ├── supplier.py
│   │   ├── expense.py
│   │   ├── banking.py
│   │   ├── communication.py
│   │   ├── equipment.py
│   │   ├── dyno.py
│   │   ├── analytics.py
│   │   ├── reports.py
│   │   ├── settings.py
│   │   └── common.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── employee_service.py
│   │   ├── time_tracking_service.py
│   │   ├── customer_service.py
│   │   ├── service_request_service.py
│   │   ├── quote_service.py
│   │   ├── job_service.py
│   │   ├── schedule_service.py
│   │   ├── invoice_service.py
│   │   ├── payment_service.py
│   │   ├── inventory_service.py
│   │   ├── purchase_order_service.py
│   │   ├── expense_service.py
│   │   ├── communication_service.py
│   │   ├── equipment_service.py
│   │   ├── dyno_service.py
│   │   ├── analytics_service.py
│   │   └── report_service.py
│   │
│   ├── integrations/
│   │   ├── __init__.py
│   │   ├── email/
│   │   │   ├── __init__.py
│   │   │   ├── sendgrid.py
│   │   │   ├── smtp.py
│   │   │   └── templates.py
│   │   ├── sms/
│   │   │   ├── __init__.py
│   │   │   └── twilio.py
│   │   ├── payment/
│   │   │   ├── __init__.py
│   │   │   ├── stripe.py
│   │   │   └── square.py
│   │   └── storage/
│   │       ├── __init__.py
│   │       ├── local.py
│   │       └── s3.py
│   │
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py
│   │   ├── notifications.py
│   │   ├── reminders.py
│   │   ├── reports.py
│   │   └── cleanup.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── pagination.py
│       ├── validators.py
│       ├── number_generator.py
│       ├── pdf_generator.py
│       ├── csv_export.py
│       └── helpers.py
│
├── migrations/
│   ├── versions/
│   └── env.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_customers.py
│   ├── test_jobs.py
│   ├── test_quotes.py
│   ├── test_invoices.py
│   ├── test_inventory.py
│   └── test_scheduling.py
│
├── scripts/
│   ├── init_db.py
│   ├── seed_data.py
│   └── create_admin.py
│
├── templates/
│   ├── email/
│   │   ├── quote_sent.html
│   │   ├── invoice_sent.html
│   │   ├── job_update.html
│   │   ├── payment_received.html
│   │   └── reminder.html
│   ├── sms/
│   │   ├── job_update.txt
│   │   └── reminder.txt
│   └── pdf/
│       ├── quote.html
│       ├── invoice.html
│       └── work_order.html
│
├── alembic.ini
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

---

This completes the comprehensive architecture for App 2: Precision Engine and Dyno, LLC.
