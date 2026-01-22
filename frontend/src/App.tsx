import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { MainLayout, AdminLayout } from '@/components/layout';
import {
  // Home
  HomePage,
  // Shop
  ShopPage,
  ProductDetailPage,
  // Cart & Checkout
  CartPage,
  CheckoutPage,
  // Services
  ServicesPage,
  ServiceRequestPage,
  // Auth
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  // Account
  AccountLayout,
  DashboardPage,
  OrdersPage,
  JobsPage,
  InvoicesPage,
  VehiclesPage,
  SettingsPage,
  ServiceRequestsPage,
  // Admin
  AdminDashboardPage,
  CustomerListPage,
  CustomerDetailPage,
  JobListPage,
  JobBoardPage,
  JobDetailPage,
  QuoteListPage,
  InvoiceListPage,
  SchedulePage,
  MessageListPage,
  InventoryListPage,
  UserListPage,
  AdminSettingsPage,
} from '@/pages';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              {/* Auth Routes (No Layout) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Main Layout Routes */}
              <Route element={<MainLayout />}>
                {/* Home */}
                <Route path="/" element={<HomePage />} />

                {/* Shop Routes */}
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/shop/products/:slug" element={<ProductDetailPage />} />
                <Route path="/shop/categories/:slug" element={<ShopPage />} />
                <Route path="/shop/brands/:slug" element={<ShopPage />} />

                {/* Cart & Checkout */}
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />

                {/* Services */}
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/request" element={<ServiceRequestPage />} />

                {/* Account Routes (Protected) */}
                <Route path="/account" element={<AccountLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="orders/:id" element={<OrdersPage />} />
                  <Route path="service-requests" element={<ServiceRequestsPage />} />
                  <Route path="service-requests/:id" element={<ServiceRequestsPage />} />
                  <Route path="jobs" element={<JobsPage />} />
                  <Route path="jobs/:id" element={<JobsPage />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="invoices/:id" element={<InvoicesPage />} />
                  <Route path="vehicles" element={<VehiclesPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Static Pages */}
                <Route path="/about" element={<div className="container mx-auto px-4 py-16"><h1 className="text-3xl font-bold text-white">About Us</h1><p className="mt-4 text-chrome-400">Coming soon...</p></div>} />
                <Route path="/contact" element={<div className="container mx-auto px-4 py-16"><h1 className="text-3xl font-bold text-white">Contact Us</h1><p className="mt-4 text-chrome-400">Coming soon...</p></div>} />
                <Route path="/terms" element={<div className="container mx-auto px-4 py-16"><h1 className="text-3xl font-bold text-white">Terms of Service</h1><p className="mt-4 text-chrome-400">Coming soon...</p></div>} />
                <Route path="/privacy" element={<div className="container mx-auto px-4 py-16"><h1 className="text-3xl font-bold text-white">Privacy Policy</h1><p className="mt-4 text-chrome-400">Coming soon...</p></div>} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                {/* Customers */}
                <Route path="customers" element={<CustomerListPage />} />
                <Route path="customers/new" element={<CustomerDetailPage />} />
                <Route path="customers/:id" element={<CustomerDetailPage />} />
                <Route path="customers/:id/edit" element={<CustomerDetailPage />} />
                {/* Jobs */}
                <Route path="jobs" element={<JobListPage />} />
                <Route path="jobs/board" element={<JobBoardPage />} />
                <Route path="jobs/new" element={<JobDetailPage />} />
                <Route path="jobs/:id" element={<JobDetailPage />} />
                <Route path="jobs/:id/edit" element={<JobDetailPage />} />
                {/* Quotes */}
                <Route path="quotes" element={<QuoteListPage />} />
                <Route path="quotes/new" element={<QuoteListPage />} />
                <Route path="quotes/:id" element={<QuoteListPage />} />
                {/* Invoices */}
                <Route path="invoices" element={<InvoiceListPage />} />
                <Route path="invoices/new" element={<InvoiceListPage />} />
                <Route path="invoices/:id" element={<InvoiceListPage />} />
                {/* Schedule */}
                <Route path="schedule" element={<SchedulePage />} />
                {/* Inventory */}
                <Route path="inventory" element={<InventoryListPage />} />
                <Route path="inventory/new" element={<InventoryListPage />} />
                <Route path="inventory/:id" element={<InventoryListPage />} />
                {/* Communications */}
                <Route path="messages" element={<MessageListPage />} />
                <Route path="messages/compose" element={<MessageListPage />} />
                <Route path="templates" element={<MessageListPage />} />
                {/* Users */}
                <Route path="users" element={<UserListPage />} />
                <Route path="users/new" element={<UserListPage />} />
                <Route path="users/:id" element={<UserListPage />} />
                {/* Settings */}
                <Route path="settings" element={<AdminSettingsPage />} />
                {/* Analytics */}
                <Route path="analytics" element={<AdminDashboardPage />} />

              </Route>

              {/* Global 404 - Catch all unmatched routes */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-black">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-electric-500 mb-4">404</h1>
                      <p className="text-xl text-chrome-400 mb-8">Page not found</p>
                      <a
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-electric-600 text-white rounded-lg hover:bg-electric-500 transition-colors"
                      >
                        Go Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
