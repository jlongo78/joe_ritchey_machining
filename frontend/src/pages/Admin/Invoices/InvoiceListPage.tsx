import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  Search,
  Plus,
  Download,
  Send,
  DollarSign,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import type { Invoice } from '@/types';

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'partial', label: 'Partial' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

const InvoiceListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadInvoices = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockInvoices: Invoice[] = [
        {
          id: 1,
          invoiceNumber: 'INV-2024-0234',
          customerId: 1,
          customer: { id: 1, customerNumber: 'CUST-0001', customerType: 'business', companyName: 'Performance Motors', country: 'US', paymentTerms: 'net_30', totalRevenue: 45000, totalJobs: 12, isActive: true, vehicles: [] },
          jobId: 1,
          status: 'paid',
          invoiceDate: '2024-01-15',
          dueDate: '2024-02-14',
          subtotal: 4200,
          taxRate: 8.25,
          taxAmount: 346.50,
          discountAmount: 0,
          total: 4546.50,
          amountPaid: 4546.50,
          balanceDue: 0,
          items: [],
          payments: [],
          createdAt: '2024-01-15',
          sentAt: '2024-01-15',
          paidAt: '2024-01-20',
        },
        {
          id: 2,
          invoiceNumber: 'INV-2024-0235',
          customerId: 2,
          customer: { id: 2, customerNumber: 'CUST-0002', customerType: 'individual', firstName: 'Mike', lastName: 'Johnson', country: 'US', paymentTerms: 'due_on_receipt', totalRevenue: 8500, totalJobs: 3, isActive: true, vehicles: [] },
          status: 'sent',
          invoiceDate: '2024-01-18',
          dueDate: '2024-01-18',
          subtotal: 850,
          taxRate: 8.25,
          taxAmount: 70.13,
          discountAmount: 0,
          total: 920.13,
          amountPaid: 0,
          balanceDue: 920.13,
          items: [],
          payments: [],
          createdAt: '2024-01-18',
          sentAt: '2024-01-18',
        },
        {
          id: 3,
          invoiceNumber: 'INV-2024-0230',
          customerId: 3,
          customer: { id: 3, customerNumber: 'CUST-0003', customerType: 'shop', companyName: 'Track Day Garage', country: 'US', paymentTerms: 'net_15', totalRevenue: 32000, totalJobs: 8, isActive: true, vehicles: [] },
          status: 'overdue',
          invoiceDate: '2024-01-01',
          dueDate: '2024-01-16',
          subtotal: 2400,
          taxRate: 8.25,
          taxAmount: 198,
          discountAmount: 0,
          total: 2598,
          amountPaid: 0,
          balanceDue: 2598,
          items: [],
          payments: [],
          createdAt: '2024-01-01',
          sentAt: '2024-01-01',
        },
        {
          id: 4,
          invoiceNumber: 'INV-2024-0236',
          customerId: 5,
          customer: { id: 5, customerNumber: 'CUST-0005', customerType: 'business', companyName: 'Classic Car Restorations', country: 'US', paymentTerms: 'net_30', totalRevenue: 78000, totalJobs: 15, isActive: true, vehicles: [] },
          status: 'partial',
          invoiceDate: '2024-01-10',
          dueDate: '2024-02-09',
          subtotal: 6800,
          taxRate: 8.25,
          taxAmount: 561,
          discountAmount: 200,
          total: 7161,
          amountPaid: 3000,
          balanceDue: 4161,
          items: [],
          payments: [],
          createdAt: '2024-01-10',
          sentAt: '2024-01-10',
        },
        {
          id: 5,
          invoiceNumber: 'INV-2024-0237',
          customerId: 4,
          customer: { id: 4, customerNumber: 'CUST-0004', customerType: 'individual', firstName: 'Robert', lastName: 'Davis', country: 'US', paymentTerms: 'due_on_receipt', totalRevenue: 4200, totalJobs: 2, isActive: true, vehicles: [] },
          status: 'draft',
          invoiceDate: '2024-01-22',
          dueDate: '2024-01-22',
          subtotal: 350,
          taxRate: 8.25,
          taxAmount: 28.88,
          discountAmount: 0,
          total: 378.88,
          amountPaid: 0,
          balanceDue: 378.88,
          items: [],
          payments: [],
          createdAt: '2024-01-22',
        },
      ];

      const filtered = activeStatus === 'all'
        ? mockInvoices
        : mockInvoices.filter((inv) => inv.status === activeStatus);

      setInvoices(filtered);
      setIsLoading(false);
    };

    loadInvoices();
  }, [activeStatus, searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-chrome-500/10 text-chrome-400 border-chrome-500/20',
      sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      viewed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      partial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      paid: 'bg-green-500/10 text-green-400 border-green-500/20',
      overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
      void: 'bg-chrome-500/10 text-chrome-400 border-chrome-500/20',
    };
    return colors[status] || 'bg-chrome-500/10 text-chrome-400 border-chrome-500/20';
  };

  const getCustomerName = (invoice: Invoice) => {
    if (invoice.customer?.companyName) return invoice.customer.companyName;
    if (invoice.customer?.firstName) return `${invoice.customer.firstName} ${invoice.customer.lastName}`;
    return 'Unknown';
  };

  // Calculate summary stats
  const stats = {
    totalOutstanding: invoices.filter((i) => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.balanceDue, 0),
    overdueCount: invoices.filter((i) => i.status === 'overdue').length,
    overdueAmount: invoices.filter((i) => i.status === 'overdue').reduce((sum, i) => sum + i.balanceDue, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-chrome-400 mt-1">Manage billing and payments</p>
        </div>
        <Link
          to="/admin/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          New Invoice
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-electric-500/20">
              <DollarSign size={20} className="text-electric-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalOutstanding)}</p>
              <p className="text-sm text-chrome-400">Total Outstanding</p>
            </div>
          </div>
        </div>
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.overdueCount}</p>
              <p className="text-sm text-chrome-400">Overdue Invoices</p>
            </div>
          </div>
        </div>
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <DollarSign size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.overdueAmount)}</p>
              <p className="text-sm text-chrome-400">Overdue Amount</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-admin-bg-card border border-admin-border rounded-xl p-1">
        <div className="flex flex-wrap gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveStatus(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeStatus === tab.key
                  ? 'bg-electric-500 text-white'
                  : 'text-chrome-400 hover:text-white hover:bg-admin-bg-hover'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-admin-bg-card border border-admin-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-admin-border">
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Invoice #</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Due</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-chrome-400 uppercase">Total</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-chrome-400 uppercase">Balance</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-chrome-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="w-6 h-6 border-2 border-electric-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-chrome-400">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={cn(
                    'hover:bg-admin-bg-hover transition-colors',
                    invoice.status === 'overdue' && 'bg-red-500/5'
                  )}
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/admin/invoices/${invoice.id}`}
                      className="text-electric-400 font-medium hover:text-electric-300"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/admin/customers/${invoice.customerId}`}
                      className="text-sm text-chrome-300 hover:text-white"
                    >
                      {getCustomerName(invoice)}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('px-2 py-1 text-xs font-medium rounded-full border', getStatusColor(invoice.status))}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-chrome-400">{invoice.invoiceDate}</td>
                  <td className="px-6 py-4 text-sm text-chrome-400">{invoice.dueDate}</td>
                  <td className="px-6 py-4 text-sm text-white text-right font-medium">
                    {formatCurrency(invoice.total)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      'text-sm font-medium',
                      invoice.balanceDue > 0 ? 'text-amber-400' : 'text-green-400'
                    )}>
                      {formatCurrency(invoice.balanceDue)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/invoices/${invoice.id}`}
                        className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </Link>
                      {invoice.status !== 'paid' && invoice.status !== 'draft' && (
                        <button
                          className="p-2 text-chrome-400 hover:text-green-400 hover:bg-admin-bg rounded-lg transition-colors"
                          title="Record Payment"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      {invoice.status === 'draft' && (
                        <button
                          className="p-2 text-chrome-400 hover:text-electric-400 hover:bg-admin-bg rounded-lg transition-colors"
                          title="Send"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      <button
                        className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceListPage;
