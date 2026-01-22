import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  Search,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Building2,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  FileText,
  Wrench,
} from 'lucide-react';
import type { Customer } from '@/types';

const CustomerListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data
      const mockCustomers: Customer[] = [
        {
          id: 1,
          customerNumber: 'CUST-0001',
          customerType: 'business',
          companyName: 'Performance Motors',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@performancemotors.com',
          phone: '(555) 123-4567',
          city: 'Los Angeles',
          state: 'CA',
          country: 'US',
          paymentTerms: 'net_30',
          totalRevenue: 45000,
          totalJobs: 12,
          lastServiceDate: '2024-01-15',
          isActive: true,
          vehicles: [],
        },
        {
          id: 2,
          customerNumber: 'CUST-0002',
          customerType: 'individual',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@email.com',
          phone: '(555) 234-5678',
          city: 'San Diego',
          state: 'CA',
          country: 'US',
          paymentTerms: 'due_on_receipt',
          totalRevenue: 8500,
          totalJobs: 3,
          lastServiceDate: '2024-01-18',
          isActive: true,
          vehicles: [],
        },
        {
          id: 3,
          customerNumber: 'CUST-0003',
          customerType: 'shop',
          companyName: 'Track Day Garage',
          firstName: 'Steve',
          lastName: 'Williams',
          email: 'steve@trackdaygarage.com',
          phone: '(555) 345-6789',
          city: 'Phoenix',
          state: 'AZ',
          country: 'US',
          paymentTerms: 'net_15',
          totalRevenue: 32000,
          totalJobs: 8,
          lastServiceDate: '2024-01-10',
          isActive: true,
          vehicles: [],
        },
        {
          id: 4,
          customerNumber: 'CUST-0004',
          customerType: 'individual',
          firstName: 'Robert',
          lastName: 'Davis',
          email: 'robert.davis@email.com',
          phone: '(555) 456-7890',
          city: 'Las Vegas',
          state: 'NV',
          country: 'US',
          paymentTerms: 'due_on_receipt',
          totalRevenue: 4200,
          totalJobs: 2,
          lastServiceDate: '2023-12-20',
          isActive: true,
          vehicles: [],
        },
        {
          id: 5,
          customerNumber: 'CUST-0005',
          customerType: 'business',
          companyName: 'Classic Car Restorations',
          firstName: 'James',
          lastName: 'Wilson',
          email: 'james@classiccarrestorations.com',
          phone: '(555) 567-8901',
          city: 'Scottsdale',
          state: 'AZ',
          country: 'US',
          paymentTerms: 'net_30',
          totalRevenue: 78000,
          totalJobs: 15,
          lastServiceDate: '2024-01-20',
          isActive: true,
          vehicles: [],
        },
      ];

      setCustomers(mockCustomers);
      setTotalPages(3);
      setIsLoading(false);
    };

    loadCustomers();
  }, [searchQuery, filterType, currentPage]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case 'business':
      case 'shop':
        return <Building2 size={16} className="text-electric-400" />;
      default:
        return <User size={16} className="text-chrome-400" />;
    }
  };

  const getCustomerName = (customer: Customer) => {
    if (customer.companyName) {
      return customer.companyName;
    }
    return `${customer.firstName} ${customer.lastName}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-chrome-400 mt-1">
            Manage your customer database
          </p>
        </div>
        <Link
          to="/admin/customers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Add Customer
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-sm text-white placeholder-chrome-500 focus:outline-none focus:border-electric-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-admin-bg rounded-lg border border-admin-border text-sm text-white focus:outline-none focus:border-electric-500"
          >
            <option value="all">All Types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="shop">Shop</option>
          </select>

          {/* Export */}
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-admin-bg hover:bg-admin-bg-hover rounded-lg border border-admin-border text-sm text-chrome-300 hover:text-white transition-colors">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-admin-bg-card border border-admin-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Jobs
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Last Service
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-chrome-400">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-admin-bg-hover transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-admin-bg flex items-center justify-center border border-admin-border">
                          {getCustomerTypeIcon(customer.customerType)}
                        </div>
                        <div>
                          <Link
                            to={`/admin/customers/${customer.id}`}
                            className="text-sm font-medium text-white hover:text-electric-400 transition-colors"
                          >
                            {getCustomerName(customer)}
                          </Link>
                          <p className="text-xs text-chrome-500">
                            {customer.customerNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-chrome-300">
                            <Mail size={14} className="text-chrome-500" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-chrome-300">
                            <Phone size={14} className="text-chrome-500" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-chrome-300">
                        {customer.city}, {customer.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-green-400">
                        {formatCurrency(customer.totalRevenue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-chrome-300">
                        {customer.totalJobs}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-chrome-400">
                        {customer.lastServiceDate || 'Never'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/customers/${customer.id}`}
                          className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/admin/customers/${customer.id}/edit`}
                          className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Link>
                        <Link
                          to={`/admin/quotes/new?customerId=${customer.id}`}
                          className="p-2 text-chrome-400 hover:text-purple-400 hover:bg-admin-bg rounded-lg transition-colors"
                          title="Create Quote"
                        >
                          <FileText size={16} />
                        </Link>
                        <Link
                          to={`/admin/jobs/new?customerId=${customer.id}`}
                          className="p-2 text-chrome-400 hover:text-electric-400 hover:bg-admin-bg rounded-lg transition-colors"
                          title="Create Job"
                        >
                          <Wrench size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-border">
          <p className="text-sm text-chrome-400">
            Showing <span className="font-medium text-white">1</span> to{' '}
            <span className="font-medium text-white">{customers.length}</span> of{' '}
            <span className="font-medium text-white">25</span> customers
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            {[1, 2, 3].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                  currentPage === page
                    ? 'bg-electric-500 text-white'
                    : 'text-chrome-400 hover:text-white hover:bg-admin-bg-hover'
                )}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerListPage;
