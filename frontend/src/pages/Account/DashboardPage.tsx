import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Wrench,
  FileText,
  CreditCard,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/utils/formatters';
import { useAuth } from '@/context/AuthContext';
import { ordersApi, servicesApi } from '@/services/api';
import { Card, Badge, Button } from '@/components/common';
import type { Order, Job, Invoice } from '@/types';

interface DashboardStats {
  pendingOrders: number;
  activeJobs: number;
  pendingInvoices: number;
  totalSpent: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingOrders: 0,
    activeJobs: 0,
    pendingInvoices: 0,
    totalSpent: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [ordersRes, jobsRes, invoicesRes] = await Promise.all([
          ordersApi.getOrders(1, 3),
          servicesApi.getJobs({ status: 'in_progress' as const }),
          servicesApi.getInvoices(1, 10),
        ]);

        setRecentOrders(ordersRes.items);
        setActiveJobs(jobsRes.items.slice(0, 3));
        setPendingInvoices(invoicesRes.items.slice(0, 3));

        setStats({
          pendingOrders: ordersRes.items.filter((o) => o.status === 'processing' || o.status === 'pending').length,
          activeJobs: jobsRes.total,
          pendingInvoices: invoicesRes.total,
          totalSpent: 0, // Would come from API
        });
      } catch {
        // Mock data for demo
        const mockOrders = [
          {
            id: 1,
            orderNumber: 'ORD-2024-001',
            status: 'shipped' as const,
            paymentStatus: 'paid' as const,
            subtotal: 1699.99,
            shippingAmount: 0,
            taxAmount: 140.25,
            discountAmount: 0,
            total: 1840.24,
            items: [],
            shippingAddress: { id: 1, userId: 1, addressType: 'shipping' as const, isDefault: true, firstName: 'John', lastName: 'Doe', addressLine1: '123 Main St', city: 'Austin', state: 'TX', postalCode: '78701', country: 'US' },
            billingAddress: { id: 2, userId: 1, addressType: 'billing' as const, isDefault: true, firstName: 'John', lastName: 'Doe', addressLine1: '123 Main St', city: 'Austin', state: 'TX', postalCode: '78701', country: 'US' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 2,
            orderNumber: 'ORD-2024-002',
            status: 'processing' as const,
            paymentStatus: 'paid' as const,
            subtotal: 899.99,
            shippingAmount: 9.99,
            taxAmount: 75.08,
            discountAmount: 0,
            total: 985.06,
            items: [],
            shippingAddress: { id: 1, userId: 1, addressType: 'shipping' as const, isDefault: true, firstName: 'John', lastName: 'Doe', addressLine1: '123 Main St', city: 'Austin', state: 'TX', postalCode: '78701', country: 'US' },
            billingAddress: { id: 2, userId: 1, addressType: 'billing' as const, isDefault: true, firstName: 'John', lastName: 'Doe', addressLine1: '123 Main St', city: 'Austin', state: 'TX', postalCode: '78701', country: 'US' },
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        setRecentOrders(mockOrders as Order[]);

        const mockJobs = [
          {
            id: 1,
            jobNumber: 'JOB-2024-001',
            customerId: 1,
            title: 'Engine Build - B18C1',
            description: 'Complete engine build - B18C1',
            status: 'in_progress' as const,
            priority: 'normal' as const,
            scheduledEndDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            actualLaborCost: 2500,
            actualPartsCost: 1200,
            actualTotal: 3700,
            tasks: [],
            parts: [],
            labor: [],
            notes: [],
            files: [],
            createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setActiveJobs(mockJobs as Job[]);

        const mockInvoices = [
          {
            id: 1,
            invoiceNumber: 'INV-2024-001',
            customerId: 1,
            status: 'sent' as const,
            invoiceDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            subtotal: 3500,
            taxRate: 0.0825,
            taxAmount: 288.75,
            discountAmount: 0,
            total: 3788.75,
            amountPaid: 0,
            balanceDue: 3788.75,
            items: [],
            payments: [],
            createdAt: new Date().toISOString(),
          },
        ];
        setPendingInvoices(mockInvoices as Invoice[]);

        setStats({
          pendingOrders: 1,
          activeJobs: 1,
          pendingInvoices: 1,
          totalSpent: 5628.30,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'info';
      case 'processing':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'on_hold':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-chrome-100">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-chrome-400 mt-1">
          Here&apos;s an overview of your account activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-chrome-400">Pending Orders</p>
            <p className="text-2xl font-bold text-chrome-100">{stats.pendingOrders}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Wrench className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-chrome-400">Active Jobs</p>
            <p className="text-2xl font-bold text-chrome-100">{stats.activeJobs}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-chrome-400">Pending Invoices</p>
            <p className="text-2xl font-bold text-chrome-100">{stats.pendingInvoices}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-chrome-400">Total Spent</p>
            <p className="text-2xl font-bold text-chrome-100">{formatPrice(stats.totalSpent)}</p>
          </div>
        </Card>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-chrome-100">Recent Orders</h2>
            <Link to="/account/orders" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/account/orders/${order.id}`}
                  className="flex items-center justify-between p-3 bg-black rounded-lg hover:bg-chrome-900 transition-colors"
                >
                  <div>
                    <p className="font-medium text-chrome-100">{order.orderNumber}</p>
                    <p className="text-sm text-chrome-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={getOrderStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <p className="text-sm font-medium text-chrome-100 mt-1">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-chrome-400">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent orders</p>
              <Link to="/shop" className="text-primary-600 hover:text-primary-700 text-sm">
                Start Shopping
              </Link>
            </div>
          )}
        </Card>

        {/* Active Jobs */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-chrome-100">Active Jobs</h2>
            <Link to="/account/jobs" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {activeJobs.length > 0 ? (
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/account/jobs/${job.id}`}
                  className="flex items-center justify-between p-3 bg-black rounded-lg hover:bg-chrome-900 transition-colors"
                >
                  <div>
                    <p className="font-medium text-chrome-100">{job.jobNumber}</p>
                    <p className="text-sm text-chrome-400 line-clamp-1">{job.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={getJobStatusColor(job.status)}>
                      {job.status.replace('_', ' ').charAt(0).toUpperCase() + job.status.replace('_', ' ').slice(1)}
                    </Badge>
                    {job.scheduledEndDate && (
                      <p className="text-xs text-chrome-400 mt-1 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        Est. {formatDate(job.scheduledEndDate)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-chrome-400">
              <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active jobs</p>
              <Link to="/services/request" className="text-primary-600 hover:text-primary-700 text-sm">
                Request Service
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-chrome-100">Pending Invoices</h2>
            <Link to="/account/invoices" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-chrome-400 border-b border-chrome-700">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Amount Due</th>
                  <th className="pb-3 font-medium">Due Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {pendingInvoices.map((invoice) => {
                  const isOverdue = new Date(invoice.dueDate) < new Date();
                  return (
                    <tr key={invoice.id} className="border-b border-chrome-800">
                      <td className="py-4 font-medium text-chrome-100">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="py-4 font-semibold text-chrome-100">
                        {formatPrice(invoice.balanceDue)}
                      </td>
                      <td className="py-4">
                        <span className={isOverdue ? 'text-red-600' : 'text-chrome-300'}>
                          {formatDate(invoice.dueDate)}
                          {isOverdue && (
                            <AlertCircle className="h-4 w-4 inline ml-1" />
                          )}
                        </span>
                      </td>
                      <td className="py-4">
                        <Badge variant={isOverdue ? 'danger' : 'warning'}>
                          {isOverdue ? 'Overdue' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-4 text-right">
                        <Link to={`/account/invoices/${invoice.id}`}>
                          <Button size="sm">Pay Now</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-chrome-100 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/shop">
            <Button variant="outline" className="w-full" leftIcon={<Package className="h-4 w-4" />}>
              Shop Parts
            </Button>
          </Link>
          <Link to="/services/request">
            <Button variant="outline" className="w-full" leftIcon={<Wrench className="h-4 w-4" />}>
              Request Service
            </Button>
          </Link>
          <Link to="/account/vehicles">
            <Button variant="outline" className="w-full" leftIcon={<FileText className="h-4 w-4" />}>
              Manage Vehicles
            </Button>
          </Link>
          <Link to="/account/settings">
            <Button variant="outline" className="w-full" leftIcon={<CheckCircle className="h-4 w-4" />}>
              Update Profile
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
