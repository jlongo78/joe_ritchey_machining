// User Types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'admin' | 'manager' | 'technician';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: number;
  userId: number;
  addressType: 'shipping' | 'billing';
  isDefault: boolean;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Product Types (E-commerce)
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  children?: Category[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  brandId?: number;
  brand?: Brand;
  baseCost: number;
  retailPrice: number;
  salePrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  yearStart?: number;
  yearEnd?: number;
  make?: string;
  model?: string;
  submodel?: string;
  engine?: string;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  images: ProductImage[];
  categories: Category[];
  attributes: ProductAttribute[];
  inventory?: Inventory;
  averageRating?: number;
  reviewCount?: number;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  thumbnailUrl?: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProductAttribute {
  id: number;
  productId: number;
  attributeName: string;
  attributeValue: string;
  displayOrder: number;
}

export interface Inventory {
  id: number;
  productId: number;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
}

// Cart Types
export interface CartItem {
  id: number;
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: number;
  userId?: number;
  sessionId?: string;
  status: 'active' | 'abandoned' | 'converted';
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  couponCode?: string;
}

// Order Types (E-commerce)
export interface Order {
  id: number;
  orderNumber: string;
  userId?: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  shippingMethod?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  shippingAddress: Address;
  billingAddress: Address;
  customerNotes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

// Service Request Types (Machining)
export interface ServiceType {
  id: number;
  name: string;
  category: 'machining' | 'dyno' | 'assembly' | 'general';
  description?: string;
  basePrice?: number;
  estimatedHours?: number;
  isActive: boolean;
  displayOrder: number;
}

export interface ServiceRequest {
  id: number;
  requestNumber: string;
  customerId: number;
  customer?: Customer;
  vehicleId?: number;
  vehicle?: CustomerVehicle;
  status: ServiceRequestStatus;
  priority: Priority;
  title: string;
  description?: string;
  customerNotes?: string;
  requestedStartDate?: string;
  requestedCompletionDate?: string;
  isFlexibleTiming: boolean;
  estimatedCost?: number;
  items: ServiceRequestItem[];
  files: ServiceRequestFile[];
  source: 'website' | 'phone' | 'email' | 'walk_in' | 'referral';
  createdAt: string;
  updatedAt: string;
}

export type ServiceRequestStatus =
  | 'pending'
  | 'reviewing'
  | 'quoted'
  | 'approved'
  | 'declined'
  | 'converted';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface ServiceRequestItem {
  id: number;
  requestId: number;
  serviceTypeId?: number;
  serviceType?: ServiceType;
  description: string;
  quantity: number;
}

export interface ServiceRequestFile {
  id: number;
  requestId: number;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt: string;
}

// Quote Types
export interface Quote {
  id: number;
  quoteNumber: string;
  customerId: number;
  customer?: Customer;
  serviceRequestId?: number;
  vehicleId?: number;
  vehicle?: CustomerVehicle;
  status: QuoteStatus;
  title?: string;
  description?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  discountReason?: string;
  total: number;
  estimatedStartDate?: string;
  estimatedCompletionDate?: string;
  estimatedHours?: number;
  validUntil?: string;
  items: QuoteItem[];
  termsAndConditions?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'revised';

export interface QuoteItem {
  id: number;
  quoteId: number;
  itemType: 'labor' | 'parts' | 'service' | 'other';
  serviceTypeId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  estimatedHours?: number;
  hourlyRate?: number;
  notes?: string;
  displayOrder: number;
  isTaxable: boolean;
}

// Job Types (Machining)
export interface Job {
  id: number;
  jobNumber: string;
  customerId: number;
  customer?: Customer;
  vehicleId?: number;
  vehicle?: CustomerVehicle;
  quoteId?: number;
  title: string;
  description?: string;
  status: JobStatus;
  priority: Priority;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  assignedTechnicianId?: number;
  assignedBay?: string;
  quotedAmount?: number;
  actualLaborCost: number;
  actualPartsCost: number;
  actualTotal: number;
  tasks: JobTask[];
  parts: JobPart[];
  labor: JobLabor[];
  notes: JobNote[];
  files: JobFile[];
  createdAt: string;
  updatedAt: string;
}

export type JobStatus =
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'on_hold'
  | 'quality_check'
  | 'completed'
  | 'picked_up'
  | 'cancelled';

export interface JobTask {
  id: number;
  jobId: number;
  serviceTypeId?: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  estimatedHours?: number;
  actualHours: number;
  assignedTo?: number;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  displayOrder: number;
}

export interface JobPart {
  id: number;
  jobId: number;
  partNumber?: string;
  description: string;
  quantity: number;
  unitCost?: number;
  unitPrice?: number;
  totalPrice?: number;
  source: 'inventory' | 'ordered' | 'customer_supplied';
  status: 'pending' | 'ordered' | 'received' | 'installed' | 'returned';
}

export interface JobLabor {
  id: number;
  jobId: number;
  taskId?: number;
  employeeId: number;
  description?: string;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  laborType: 'regular' | 'overtime' | 'warranty';
  isBillable: boolean;
  performedDate: string;
}

export interface JobNote {
  id: number;
  jobId: number;
  userId: number;
  noteType: 'internal' | 'customer_visible' | 'issue' | 'resolution';
  content: string;
  createdAt: string;
}

export interface JobFile {
  id: number;
  jobId: number;
  taskId?: number;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileCategory?: 'before' | 'after' | 'measurement' | 'dyno_chart';
  description?: string;
  isCustomerVisible: boolean;
  uploadedAt: string;
}

// Customer Types
export interface Customer {
  id: number;
  userId?: number;
  customerNumber: string;
  customerType: 'individual' | 'business' | 'shop';
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  paymentTerms: PaymentTerms;
  totalRevenue: number;
  totalJobs: number;
  lastServiceDate?: string;
  isActive: boolean;
  vehicles: CustomerVehicle[];
}

export type PaymentTerms =
  | 'due_on_receipt'
  | 'net_15'
  | 'net_30'
  | 'net_45'
  | 'net_60';

export interface CustomerVehicle {
  id: number;
  customerId: number;
  year?: number;
  make?: string;
  model?: string;
  submodel?: string;
  engine?: string;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
  notes?: string;
  isActive: boolean;
}

// Invoice Types
export interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number;
  customer?: Customer;
  jobId?: number;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  discountReason?: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  billingAddress?: Address;
  poNumber?: string;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  payments: Payment[];
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
}

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'void';

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  itemType: 'labor' | 'parts' | 'service' | 'other';
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isTaxable: boolean;
  displayOrder: number;
}

export interface Payment {
  id: number;
  invoiceId: number;
  customerId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  cardLastFour?: string;
  cardType?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

export type PaymentMethod =
  | 'cash'
  | 'check'
  | 'credit_card'
  | 'debit_card'
  | 'ach'
  | 'wire'
  | 'paypal';

// Vehicle Fitment Types
export interface VehicleMake {
  id: number;
  name: string;
  logoUrl?: string;
}

export interface VehicleModel {
  id: number;
  makeId: number;
  name: string;
}

export interface VehicleYear {
  id: number;
  modelId: number;
  year: number;
  submodel?: string;
  engine?: string;
}

// Review Types
export interface Review {
  id: number;
  productId: number;
  userId: number;
  user?: Pick<User, 'firstName' | 'lastName'>;
  orderId?: number;
  rating: number;
  title?: string;
  content?: string;
  pros?: string;
  cons?: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Filter Types
export interface ProductFilters {
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  make?: string;
  model?: string;
  year?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'newest' | 'rating';
  page?: number;
  pageSize?: number;
}

export interface ServiceRequestFilters {
  status?: ServiceRequestStatus;
  priority?: Priority;
  customerId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface JobFilters {
  status?: JobStatus;
  priority?: Priority;
  customerId?: number;
  technicianId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// Checkout Types
export interface CheckoutData {
  shippingAddress: Omit<Address, 'id' | 'userId'>;
  billingAddress: Omit<Address, 'id' | 'userId'>;
  sameAsShipping: boolean;
  shippingMethod: string;
  paymentMethodId: string;
  customerNotes?: string;
}

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  name: string;
  description?: string;
  rate: number;
  price: number;
  estimatedDays: number;
}
