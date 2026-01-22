import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/utils/formatters';
import { servicesApi } from '@/services/api';
import { Card, Badge, Button, Input, Select, Pagination, EmptyState } from '@/components/common';
import type { Invoice } from '@/types';

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const response = await servicesApi.getInvoices(currentPage, 10);
        setInvoices(response.items);
        setTotalPages(response.totalPages);
      } catch {
        // Mock data for demo
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
            items: [
              { id: 1, invoiceId: 1, itemType: 'labor' as const, description: 'Engine Build - Labor', quantity: 1, unitPrice: 2500, totalPrice: 2500, isTaxable: true, displayOrder: 1 },
              { id: 2, invoiceId: 1, itemType: 'parts' as const, description: 'Parts & Materials', quantity: 1, unitPrice: 1000, totalPrice: 1000, isTaxable: true, displayOrder: 2 },
            ],
            payments: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            invoiceNumber: 'INV-2024-002',
            customerId: 1,
            status: 'paid' as const,
            invoiceDate: new Date(Date.now() - 15 * 86400000).toISOString(),
            dueDate: new Date(Date.now() - 7 * 86400000).toISOString(),
            subtotal: 800,
            taxRate: 0.0825,
            taxAmount: 66,
            discountAmount: 0,
            total: 866,
            amountPaid: 866,
            balanceDue: 0,
            paidAt: new Date(Date.now() - 10 * 86400000).toISOString(),
            items: [
              { id: 3, invoiceId: 2, itemType: 'labor' as const, description: 'Cylinder Head Porting', quantity: 1, unitPrice: 800, totalPrice: 800, isTaxable: true, displayOrder: 1 },
            ],
            payments: [
              { id: 1, invoiceId: 2, customerId: 1, amount: 866, paymentMethod: 'credit_card' as const, paymentDate: new Date(Date.now() - 10 * 86400000).toISOString(), status: 'completed' as const, createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
            ],
            createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
          },
          {
            id: 3,
            invoiceNumber: 'INV-2024-003',
            customerId: 1,
            status: 'overdue' as const,
            invoiceDate: new Date(Date.now() - 20 * 86400000).toISOString(),
            dueDate: new Date(Date.now() - 5 * 86400000).toISOString(),
            subtotal: 1500,
            taxRate: 0.0825,
            taxAmount: 123.75,
            discountAmount: 0,
            total: 1623.75,
            amountPaid: 0,
            balanceDue: 1623.75,
            items: [
              { id: 4, invoiceId: 3, itemType: 'labor' as const, description: 'Block Machining', quantity: 1, unitPrice: 1500, totalPrice: 1500, isTaxable: true, displayOrder: 1 },
            ],
            payments: [],
            createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          },
          {
            id: 4,
            invoiceNumber: 'INV-2024-004',
            customerId: 1,
            status: 'partial' as const,
            invoiceDate: new Date(Date.now() - 10 * 86400000).toISOString(),
            dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            subtotal: 4000,
            taxRate: 0.0825,
            taxAmount: 330,
            discountAmount: 0,
            total: 4330,
            amountPaid: 2000,
            balanceDue: 2330,
            items: [
              { id: 5, invoiceId: 4, itemType: 'labor' as const, description: 'LS3 Short Block Build', quantity: 1, unitPrice: 4000, totalPrice: 4000, isTaxable: true, displayOrder: 1 },
            ],
            payments: [
              { id: 2, invoiceId: 4, customerId: 1, amount: 2000, paymentMethod: 'credit_card' as const, paymentDate: new Date(Date.now() - 3 * 86400000).toISOString(), status: 'completed' as const, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
            ],
            createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          },
        ];
        setInvoices(mockInvoices as Invoice[]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [currentPage, statusFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'sent':
      case 'viewed':
      case 'draft':
        return 'warning';
      case 'overdue':
        return 'danger';
      case 'partial':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'sent':
      case 'viewed':
      case 'draft':
      case 'partial':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const statusOptions = [
    { value: '', label: 'All Invoices' },
    { value: 'sent', label: 'Sent' },
    { value: 'partial', label: 'Partially Paid' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
  ];

  // Calculate totals
  const totalPending = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.balanceDue, 0);

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
        <h1 className="text-2xl font-bold text-secondary-900">Invoices</h1>
      </div>

      {/* Summary Cards */}
      {totalPending > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-800">Total Amount Due</p>
                <p className="text-2xl font-bold text-yellow-900">{formatPrice(totalPending)}</p>
              </div>
            </div>
            <Link to="/account/invoices?status=pending">
              <Button size="sm">
                Pay Now
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by invoice number..."
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

      {/* Invoices List */}
      {invoices.length > 0 ? (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const isOverdue = invoice.status === 'overdue' || (invoice.status !== 'paid' && new Date(invoice.dueDate) < new Date());
            return (
              <Card key={invoice.id}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-secondary-900">{invoice.invoiceNumber}</h3>
                      <Badge variant={getStatusColor(invoice.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(invoice.status)}
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </Badge>
                    </div>
                    <div className="text-sm text-secondary-500 space-y-1">
                      <p>Issued: {formatDate(invoice.createdAt)}</p>
                      <p className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        Due: {formatDate(invoice.dueDate)}
                        {isOverdue && ' (Overdue)'}
                      </p>
                      {invoice.paidAt && (
                        <p className="text-green-600">
                          Paid: {formatDate(invoice.paidAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-secondary-500">Total</p>
                      <p className="text-lg font-bold text-secondary-900">{formatPrice(invoice.total)}</p>
                      {invoice.balanceDue > 0 && invoice.balanceDue < invoice.total && (
                        <p className="text-sm text-secondary-600">
                          Remaining: <span className="font-medium text-primary-600">{formatPrice(invoice.balanceDue)}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/account/invoices/${invoice.id}`}>
                        <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={() => {/* Download PDF */}}
                      >
                        PDF
                      </Button>
                      {invoice.balanceDue > 0 && (
                        <Link to={`/account/invoices/${invoice.id}/pay`}>
                          <Button size="sm">
                            Pay
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="mt-4 pt-4 border-t border-secondary-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-secondary-500">
                          <th className="pb-2 font-medium">Description</th>
                          <th className="pb-2 font-medium text-right">Qty</th>
                          <th className="pb-2 font-medium text-right">Price</th>
                          <th className="pb-2 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.items.slice(0, 3).map((item) => (
                          <tr key={item.id} className="text-secondary-700">
                            <td className="py-1">{item.description}</td>
                            <td className="py-1 text-right">{item.quantity}</td>
                            <td className="py-1 text-right">{formatPrice(item.unitPrice)}</td>
                            <td className="py-1 text-right font-medium">{formatPrice(item.totalPrice)}</td>
                          </tr>
                        ))}
                        {invoice.items.length > 3 && (
                          <tr>
                            <td colSpan={4} className="py-1 text-secondary-500">
                              +{invoice.items.length - 3} more items
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment History */}
                {invoice.payments && invoice.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-secondary-200">
                    <p className="text-sm font-medium text-secondary-700 mb-2">Payment History</p>
                    <div className="space-y-1">
                      {invoice.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between text-sm">
                          <span className="text-secondary-600">
                            {formatDate(payment.paymentDate)} - {payment.paymentMethod.replace('_', ' ')}
                          </span>
                          <span className="font-medium text-green-600">
                            {formatPrice(payment.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

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
          icon={<CreditCard className="h-16 w-16" />}
          title="No invoices found"
          description="You don't have any invoices yet."
        />
      )}
    </div>
  );
};

export default InvoicesPage;
