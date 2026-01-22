import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  Search,
  Plus,
  Download,
  Send,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Wrench,
} from 'lucide-react';
import type { Quote } from '@/types';

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'viewed', label: 'Viewed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'declined', label: 'Declined' },
  { key: 'expired', label: 'Expired' },
];

const QuoteListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadQuotes = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockQuotes: Quote[] = [
        {
          id: 1,
          quoteNumber: 'QT-2024-0089',
          customerId: 1,
          customer: { id: 1, customerNumber: 'CUST-0001', customerType: 'business', companyName: 'Performance Motors', country: 'US', paymentTerms: 'net_30', totalRevenue: 45000, totalJobs: 12, isActive: true, vehicles: [] },
          status: 'accepted',
          title: 'Complete 350 SBC Rebuild',
          subtotal: 4200,
          taxRate: 8.25,
          taxAmount: 346.50,
          discountAmount: 0,
          total: 4546.50,
          validUntil: '2024-02-15',
          items: [],
          version: 1,
          createdAt: '2024-01-10',
          updatedAt: '2024-01-15',
          sentAt: '2024-01-10',
        },
        {
          id: 2,
          quoteNumber: 'QT-2024-0090',
          customerId: 2,
          customer: { id: 2, customerNumber: 'CUST-0002', customerType: 'individual', firstName: 'Mike', lastName: 'Johnson', country: 'US', paymentTerms: 'due_on_receipt', totalRevenue: 8500, totalJobs: 3, isActive: true, vehicles: [] },
          status: 'sent',
          title: 'LS3 Performance Tune',
          subtotal: 850,
          taxRate: 8.25,
          taxAmount: 70.13,
          discountAmount: 0,
          total: 920.13,
          validUntil: '2024-02-20',
          items: [],
          version: 1,
          createdAt: '2024-01-18',
          updatedAt: '2024-01-18',
          sentAt: '2024-01-18',
        },
        {
          id: 3,
          quoteNumber: 'QT-2024-0091',
          customerId: 3,
          customer: { id: 3, customerNumber: 'CUST-0003', customerType: 'shop', companyName: 'Track Day Garage', country: 'US', paymentTerms: 'net_15', totalRevenue: 32000, totalJobs: 8, isActive: true, vehicles: [] },
          status: 'draft',
          title: 'BBC Head Porting Package',
          subtotal: 1800,
          taxRate: 8.25,
          taxAmount: 148.50,
          discountAmount: 100,
          total: 1848.50,
          validUntil: '2024-02-28',
          items: [],
          version: 1,
          createdAt: '2024-01-20',
          updatedAt: '2024-01-20',
        },
        {
          id: 4,
          quoteNumber: 'QT-2024-0088',
          customerId: 4,
          customer: { id: 4, customerNumber: 'CUST-0004', customerType: 'individual', firstName: 'Robert', lastName: 'Davis', country: 'US', paymentTerms: 'due_on_receipt', totalRevenue: 4200, totalJobs: 2, isActive: true, vehicles: [] },
          status: 'declined',
          title: 'Rotating Assembly Balance',
          subtotal: 450,
          taxRate: 8.25,
          taxAmount: 37.13,
          discountAmount: 0,
          total: 487.13,
          validUntil: '2024-01-25',
          items: [],
          version: 1,
          createdAt: '2024-01-05',
          updatedAt: '2024-01-12',
          sentAt: '2024-01-05',
        },
      ];

      const filtered = activeStatus === 'all'
        ? mockQuotes
        : mockQuotes.filter((q) => q.status === activeStatus);

      setQuotes(filtered);
      setIsLoading(false);
    };

    loadQuotes();
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
      accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
      declined: 'bg-red-500/10 text-red-400 border-red-500/20',
      expired: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      revised: 'bg-electric-500/10 text-electric-400 border-electric-500/20',
    };
    return colors[status] || 'bg-chrome-500/10 text-chrome-400 border-chrome-500/20';
  };

  const getCustomerName = (quote: Quote) => {
    if (quote.customer?.companyName) return quote.customer.companyName;
    if (quote.customer?.firstName) return `${quote.customer.firstName} ${quote.customer.lastName}`;
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quotes</h1>
          <p className="text-chrome-400 mt-1">Create and manage customer quotes</p>
        </div>
        <Link
          to="/admin/quotes/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          New Quote
        </Link>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search quotes..."
          className="w-full pl-10 pr-4 py-2 bg-admin-bg-card rounded-lg border border-admin-border text-sm text-white placeholder-chrome-500 focus:outline-none focus:border-electric-500"
        />
      </div>

      {/* Quotes Table */}
      <div className="bg-admin-bg-card border border-admin-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-admin-border">
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Quote #</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Customer</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Title</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-chrome-400 uppercase">Total</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase">Valid Until</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-chrome-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="w-6 h-6 border-2 border-electric-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-chrome-400">
                  No quotes found
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-admin-bg-hover transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/admin/quotes/${quote.id}`}
                      className="text-electric-400 font-medium hover:text-electric-300"
                    >
                      {quote.quoteNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/admin/customers/${quote.customerId}`}
                      className="text-sm text-chrome-300 hover:text-white"
                    >
                      {getCustomerName(quote)}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{quote.title}</td>
                  <td className="px-6 py-4">
                    <span className={cn('px-2 py-1 text-xs font-medium rounded-full border', getStatusColor(quote.status))}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white text-right font-medium">
                    {formatCurrency(quote.total)}
                  </td>
                  <td className="px-6 py-4 text-sm text-chrome-400">
                    {quote.validUntil || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/quotes/${quote.id}`}
                        className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </Link>
                      {quote.status === 'draft' && (
                        <button
                          className="p-2 text-chrome-400 hover:text-electric-400 hover:bg-admin-bg rounded-lg transition-colors"
                          title="Send"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      <button
                        className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                      {quote.status === 'accepted' && (
                        <Link
                          to={`/admin/jobs/new?quoteId=${quote.id}`}
                          className="p-2 text-chrome-400 hover:text-green-400 hover:bg-admin-bg rounded-lg transition-colors"
                          title="Convert to Job"
                        >
                          <Wrench size={16} />
                        </Link>
                      )}
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

export default QuoteListPage;
