import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Plus,
  FileText,
  Wrench,
  Receipt,
  Car,
  Clock,
  DollarSign,
  MoreHorizontal,
} from 'lucide-react';
import type { Customer, Job, Quote, Invoice, CustomerVehicle } from '@/types';

type TabType = 'overview' | 'vehicles' | 'jobs' | 'quotes' | 'invoices' | 'notes';

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock related data
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const loadCustomer = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock customer data
      setCustomer({
        id: Number(id),
        customerNumber: 'CUST-0001',
        customerType: 'business',
        companyName: 'Performance Motors',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@performancemotors.com',
        phone: '(555) 123-4567',
        mobilePhone: '(555) 987-6543',
        addressLine1: '123 Main Street',
        addressLine2: 'Suite 100',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
        paymentTerms: 'net_30',
        totalRevenue: 45000,
        totalJobs: 12,
        lastServiceDate: '2024-01-15',
        isActive: true,
        vehicles: [],
      });

      setVehicles([
        {
          id: 1,
          customerId: Number(id),
          year: 1969,
          make: 'Chevrolet',
          model: 'Camaro',
          submodel: 'SS',
          engine: '350 SBC',
          vin: '1G1YY22G965000001',
          color: 'Red',
          mileage: 45000,
          isActive: true,
        },
        {
          id: 2,
          customerId: Number(id),
          year: 1970,
          make: 'Ford',
          model: 'Mustang',
          submodel: 'Boss 302',
          engine: '302 Windsor',
          color: 'Blue',
          mileage: 32000,
          isActive: true,
        },
      ]);

      setJobs([
        {
          id: 1,
          jobNumber: 'JOB-2024-0156',
          customerId: Number(id),
          title: '350 SBC Full Rebuild',
          status: 'in_progress',
          priority: 'high',
          scheduledStartDate: '2024-01-20',
          scheduledEndDate: '2024-01-28',
          quotedAmount: 4500,
          actualLaborCost: 0,
          actualPartsCost: 0,
          actualTotal: 0,
          tasks: [],
          parts: [],
          labor: [],
          notes: [],
          files: [],
          createdAt: '2024-01-15',
          updatedAt: '2024-01-20',
        },
      ]);

      setIsLoading(false);
    };

    loadCustomer();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'vehicles', label: 'Vehicles', count: vehicles.length },
    { key: 'jobs', label: 'Jobs', count: jobs.length },
    { key: 'quotes', label: 'Quotes', count: quotes.length },
    { key: 'invoices', label: 'Invoices', count: invoices.length },
    { key: 'notes', label: 'Notes' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-chrome-400">Customer not found</p>
        <Link to="/admin/customers" className="text-electric-400 hover:text-electric-300 mt-2 inline-block">
          Back to customers
        </Link>
      </div>
    );
  }

  const getCustomerName = () => {
    if (customer.companyName) return customer.companyName;
    return `${customer.firstName} ${customer.lastName}`;
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/customers')}
          className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-card rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-admin-bg-card flex items-center justify-center border border-admin-border">
              {customer.customerType === 'individual' ? (
                <User size={24} className="text-chrome-400" />
              ) : (
                <Building2 size={24} className="text-electric-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{getCustomerName()}</h1>
              <p className="text-chrome-400">{customer.customerNumber}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/quotes/new?customerId=${customer.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-admin-bg-card hover:bg-admin-bg-hover border border-admin-border rounded-lg text-sm text-chrome-300 hover:text-white transition-colors"
          >
            <FileText size={16} />
            New Quote
          </Link>
          <Link
            to={`/admin/jobs/new?customerId=${customer.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Wrench size={16} />
            New Job
          </Link>
          <button className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-card rounded-lg transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(customer.totalRevenue)}
              </p>
              <p className="text-sm text-chrome-400">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-electric-500/20">
              <Wrench size={20} className="text-electric-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{customer.totalJobs}</p>
              <p className="text-sm text-chrome-400">Total Jobs</p>
            </div>
          </div>
        </div>
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Car size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{vehicles.length}</p>
              <p className="text-sm text-chrome-400">Vehicles</p>
            </div>
          </div>
        </div>
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Clock size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {customer.lastServiceDate || 'N/A'}
              </p>
              <p className="text-sm text-chrome-400">Last Service</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-admin-border">
        <nav className="flex gap-4 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-electric-500 text-electric-400'
                  : 'border-transparent text-chrome-400 hover:text-white hover:border-chrome-600'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-admin-bg-card text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-admin-bg-card border border-admin-border rounded-xl">
              <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                <Link
                  to={`/admin/customers/${customer.id}/edit`}
                  className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-hover rounded-lg transition-colors"
                >
                  <Edit size={16} />
                </Link>
              </div>
              <div className="p-6 space-y-4">
                {customer.email && (
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-chrome-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-chrome-400">Email</p>
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-white hover:text-electric-400 transition-colors"
                      >
                        {customer.email}
                      </a>
                    </div>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-chrome-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-chrome-400">Phone</p>
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-white hover:text-electric-400 transition-colors"
                      >
                        {customer.phone}
                      </a>
                    </div>
                  </div>
                )}
                {customer.addressLine1 && (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-chrome-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-chrome-400">Address</p>
                      <p className="text-white">
                        {customer.addressLine1}
                        {customer.addressLine2 && <br />}
                        {customer.addressLine2}
                        <br />
                        {customer.city}, {customer.state} {customer.postalCode}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Business Details */}
            <div className="bg-admin-bg-card border border-admin-border rounded-xl">
              <div className="px-6 py-4 border-b border-admin-border">
                <h3 className="text-lg font-semibold text-white">Business Details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-chrome-400">Customer Type</p>
                  <p className="text-white capitalize">{customer.customerType}</p>
                </div>
                <div>
                  <p className="text-sm text-chrome-400">Payment Terms</p>
                  <p className="text-white">{customer.paymentTerms.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-chrome-400">Status</p>
                  <span
                    className={cn(
                      'inline-flex px-2 py-1 text-xs font-medium rounded-full border',
                      customer.isActive
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    )}
                  >
                    {customer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="bg-admin-bg-card border border-admin-border rounded-xl">
            <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Vehicles</h3>
              <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors">
                <Plus size={16} />
                Add Vehicle
              </button>
            </div>
            <div className="divide-y divide-admin-border">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-6 flex items-center justify-between hover:bg-admin-bg-hover transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-admin-bg flex items-center justify-center border border-admin-border">
                      <Car size={24} className="text-chrome-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-sm text-chrome-400">
                        {vehicle.submodel} - {vehicle.engine}
                      </p>
                      {vehicle.vin && (
                        <p className="text-xs text-chrome-500 mt-1">VIN: {vehicle.vin}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg rounded-lg transition-colors">
                      <Edit size={16} />
                    </button>
                    <Link
                      to={`/admin/jobs/new?customerId=${customer.id}&vehicleId=${vehicle.id}`}
                      className="p-2 text-chrome-400 hover:text-electric-400 hover:bg-admin-bg rounded-lg transition-colors"
                    >
                      <Wrench size={16} />
                    </Link>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && (
                <div className="p-12 text-center text-chrome-400">
                  No vehicles on file
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-admin-bg-card border border-admin-border rounded-xl">
            <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Jobs</h3>
              <Link
                to={`/admin/jobs/new?customerId=${customer.id}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                New Job
              </Link>
            </div>
            <div className="divide-y divide-admin-border">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/admin/jobs/${job.id}`}
                  className="p-6 flex items-center justify-between hover:bg-admin-bg-hover transition-colors block"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-electric-400 font-medium">{job.jobNumber}</span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full border bg-electric-500/10 text-electric-400 border-electric-500/20">
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-white mt-1">{job.title}</p>
                    <p className="text-sm text-chrome-400">
                      Scheduled: {job.scheduledStartDate} - {job.scheduledEndDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">
                      {formatCurrency(job.quotedAmount || 0)}
                    </p>
                    <p className="text-sm text-chrome-400">Quoted</p>
                  </div>
                </Link>
              ))}
              {jobs.length === 0 && (
                <div className="p-12 text-center text-chrome-400">
                  No jobs found
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quotes' && (
          <div className="bg-admin-bg-card border border-admin-border rounded-xl p-12 text-center text-chrome-400">
            No quotes found
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-admin-bg-card border border-admin-border rounded-xl p-12 text-center text-chrome-400">
            No invoices found
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-admin-bg-card border border-admin-border rounded-xl p-12 text-center text-chrome-400">
            No notes yet
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailPage;
