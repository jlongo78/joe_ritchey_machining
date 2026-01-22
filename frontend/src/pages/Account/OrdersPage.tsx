import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, Filter, Eye } from 'lucide-react';
import { formatPrice, formatDate } from '@/utils/formatters';
import { ordersApi } from '@/services/api';
import { Card, Badge, Button, Input, Select, Pagination, EmptyState } from '@/components/common';
import type { Order } from '@/types';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const response = await ordersApi.getOrders({
          page: currentPage,
          pageSize: 10,
          status: statusFilter || undefined,
          search: searchQuery || undefined,
        });
        setOrders(response.items);
        setTotalPages(response.totalPages);
      } catch (err) {
        // Mock data for demo
        const mockOrders: Order[] = [
          {
            id: 1,
            orderNumber: 'ORD-2024-001',
            status: 'delivered',
            paymentStatus: 'paid',
            subtotal: 1699.99,
            shippingCost: 0,
            taxAmount: 140.25,
            total: 1840.24,
            items: [
              { id: 1, productId: 1, productName: 'Garrett GTX3582R Gen II Turbocharger', quantity: 1, unitPrice: 1699.99, totalPrice: 1699.99 },
            ],
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            orderNumber: 'ORD-2024-002',
            status: 'shipped',
            paymentStatus: 'paid',
            subtotal: 899.99,
            shippingCost: 9.99,
            taxAmount: 75.08,
            total: 985.06,
            items: [
              { id: 2, productId: 2, productName: 'Skunk2 Ultra Race Intake Manifold', quantity: 1, unitPrice: 899.99, totalPrice: 899.99 },
            ],
            trackingNumber: '1Z999AA10123456784',
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          },
          {
            id: 3,
            orderNumber: 'ORD-2024-003',
            status: 'processing',
            paymentStatus: 'paid',
            subtotal: 1299.99,
            shippingCost: 0,
            taxAmount: 107.25,
            total: 1407.24,
            items: [
              { id: 3, productId: 3, productName: 'Borla S-Type Cat-Back Exhaust System', quantity: 1, unitPrice: 1299.99, totalPrice: 1299.99 },
            ],
            createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          },
        ];
        setOrders(mockOrders);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, statusFilter, searchQuery]);

  const getStatusColor = (status: string) => {
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

  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Parts Orders</h1>
        <Link to="/shop">
          <Button size="sm" leftIcon={<Package className="h-4 w-4" />}>
            Shop Parts
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>
      </Card>

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-secondary-900">{order.orderNumber}</h3>
                    <Badge variant={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-secondary-500">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                  <p className="text-sm text-secondary-600 mt-1">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} - {formatPrice(order.total)}
                  </p>
                  {order.trackingNumber && (
                    <p className="text-sm text-secondary-500 mt-1">
                      Tracking: <span className="font-mono">{order.trackingNumber}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/account/orders/${order.id}`}>
                    <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mt-4 pt-4 border-t border-secondary-200">
                <div className="flex flex-wrap gap-4">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-secondary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900 line-clamp-1">
                          {item.productName}
                        </p>
                        <p className="text-xs text-secondary-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="flex items-center text-sm text-secondary-500">
                      +{order.items.length - 3} more items
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Package className="h-16 w-16" />}
          title="No orders found"
          description="You haven't placed any orders yet. Start shopping to find great performance parts!"
          action={{
            label: 'Shop Parts',
            onClick: () => window.location.href = '/shop',
          }}
        />
      )}
    </div>
  );
};

export default OrdersPage;
