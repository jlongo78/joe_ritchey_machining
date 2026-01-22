import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  Search,
  Plus,
  Filter,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { Job } from '@/types';

const statusTabs = [
  { key: 'all', label: 'All Jobs' },
  { key: 'pending', label: 'Pending' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'quality_check', label: 'QC' },
  { key: 'completed', label: 'Completed' },
];

const JobListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockJobs: Job[] = [
        {
          id: 1,
          jobNumber: 'JOB-2024-0156',
          customerId: 1,
          customer: {
            id: 1,
            customerNumber: 'CUST-0001',
            customerType: 'business',
            companyName: 'Performance Motors',
            country: 'US',
            paymentTerms: 'net_30',
            totalRevenue: 45000,
            totalJobs: 12,
            isActive: true,
            vehicles: [],
          },
          vehicleId: 1,
          vehicle: {
            id: 1,
            customerId: 1,
            year: 1969,
            make: 'Chevrolet',
            model: 'Camaro',
            engine: '350 SBC',
            isActive: true,
          },
          title: '350 SBC Full Rebuild',
          description: 'Complete engine rebuild with performance upgrades',
          status: 'in_progress',
          priority: 'high',
          scheduledStartDate: '2024-01-20',
          scheduledEndDate: '2024-01-28',
          assignedTechnicianId: 1,
          assignedBay: 'Bay 1',
          quotedAmount: 4500,
          actualLaborCost: 1200,
          actualPartsCost: 1800,
          actualTotal: 3000,
          tasks: [],
          parts: [],
          labor: [],
          notes: [],
          files: [],
          createdAt: '2024-01-15',
          updatedAt: '2024-01-20',
        },
        {
          id: 2,
          jobNumber: 'JOB-2024-0155',
          customerId: 2,
          customer: {
            id: 2,
            customerNumber: 'CUST-0002',
            customerType: 'individual',
            firstName: 'Mike',
            lastName: 'Johnson',
            country: 'US',
            paymentTerms: 'due_on_receipt',
            totalRevenue: 8500,
            totalJobs: 3,
            isActive: true,
            vehicles: [],
          },
          title: 'LS3 Dyno Tune',
          status: 'quality_check',
          priority: 'normal',
          scheduledStartDate: '2024-01-18',
          scheduledEndDate: '2024-01-24',
          quotedAmount: 850,
          actualLaborCost: 600,
          actualPartsCost: 0,
          actualTotal: 600,
          tasks: [],
          parts: [],
          labor: [],
          notes: [],
          files: [],
          createdAt: '2024-01-10',
          updatedAt: '2024-01-22',
        },
        {
          id: 3,
          jobNumber: 'JOB-2024-0154',
          customerId: 3,
          customer: {
            id: 3,
            customerNumber: 'CUST-0003',
            customerType: 'shop',
            companyName: 'Track Day Garage',
            country: 'US',
            paymentTerms: 'net_15',
            totalRevenue: 32000,
            totalJobs: 8,
            isActive: true,
            vehicles: [],
          },
          title: 'Head Porting - BBC',
          status: 'in_progress',
          priority: 'normal',
          scheduledStartDate: '2024-01-19',
          scheduledEndDate: '2024-01-26',
          quotedAmount: 1200,
          actualLaborCost: 400,
          actualPartsCost: 0,
          actualTotal: 400,
          tasks: [],
          parts: [],
          labor: [],
          notes: [],
          files: [],
          createdAt: '2024-01-12',
          updatedAt: '2024-01-19',
        },
        {
          id: 4,
          jobNumber: 'JOB-2024-0153',
          customerId: 4,
          customer: {
            id: 4,
            customerNumber: 'CUST-0004',
            customerType: 'individual',
            firstName: 'Robert',
            lastName: 'Davis',
            country: 'US',
            paymentTerms: 'due_on_receipt',
            totalRevenue: 4200,
            totalJobs: 2,
            isActive: true,
            vehicles: [],
          },
          title: 'Rotating Assembly Balance',
          status: 'scheduled',
          priority: 'low',
          scheduledStartDate: '2024-01-25',
          scheduledEndDate: '2024-01-28',
          quotedAmount: 350,
          actualLaborCost: 0,
          actualPartsCost: 0,
          actualTotal: 0,
          tasks: [],
          parts: [],
          labor: [],
          notes: [],
          files: [],
          createdAt: '2024-01-14',
          updatedAt: '2024-01-14',
        },
        {
          id: 5,
          jobNumber: 'JOB-2024-0152',
          customerId: 5,
          customer: {
            id: 5,
            customerNumber: 'CUST-0005',
            customerType: 'business',
            companyName: 'Classic Car Restorations',
            country: 'US',
            paymentTerms: 'net_30',
            totalRevenue: 78000,
            totalJobs: 15,
            isActive: true,
            vehicles: [],
          },
          title: 'Complete 454 Big Block Build',
          status: 'pending',
          priority: 'high',
          quotedAmount: 8500,
          actualLaborCost: 0,
          actualPartsCost: 0,
          actualTotal: 0,
          tasks: [],
          parts: [],
          labor: [],
          notes: [],
          files: [],
          createdAt: '2024-01-20',
          updatedAt: '2024-01-20',
        },
      ];

      const filtered = activeStatus === 'all'
        ? mockJobs
        : mockJobs.filter((j) => j.status === activeStatus);

      setJobs(filtered);
      setIsLoading(false);
    };

    loadJobs();
  }, [activeStatus, searchQuery, currentPage]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      in_progress: 'bg-electric-500/10 text-electric-400 border-electric-500/20',
      on_hold: 'bg-red-500/10 text-red-400 border-red-500/20',
      quality_check: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      picked_up: 'bg-chrome-500/10 text-chrome-400 border-chrome-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status] || 'bg-chrome-500/10 text-chrome-400 border-chrome-500/20';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-chrome-400',
      normal: 'text-electric-400',
      high: 'text-amber-400',
      urgent: 'text-red-400',
    };
    return colors[priority] || 'text-chrome-400';
  };

  const getCustomerName = (job: Job) => {
    if (job.customer?.companyName) return job.customer.companyName;
    if (job.customer?.firstName) return `${job.customer.firstName} ${job.customer.lastName}`;
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="text-chrome-400 mt-1">Manage service jobs and work orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/jobs/board"
            className="inline-flex items-center gap-2 px-4 py-2 bg-admin-bg-card hover:bg-admin-bg-hover border border-admin-border rounded-lg text-sm text-chrome-300 hover:text-white transition-colors"
          >
            <LayoutGrid size={18} />
            Board View
          </Link>
          <Link
            to="/admin/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={18} />
            New Job
          </Link>
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

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-10 pr-4 py-2 bg-admin-bg-card rounded-lg border border-admin-border text-sm text-white placeholder-chrome-500 focus:outline-none focus:border-electric-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'list'
                ? 'bg-electric-500 text-white'
                : 'bg-admin-bg-card text-chrome-400 hover:text-white'
            )}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-electric-500 text-white'
                : 'bg-admin-bg-card text-chrome-400 hover:text-white'
            )}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Jobs List/Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-admin-bg-card border border-admin-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-chrome-400 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-admin-bg-hover transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/admin/jobs/${job.id}`} className="block">
                      <span className="text-electric-400 font-medium hover:text-electric-300">
                        {job.jobNumber}
                      </span>
                      <p className="text-sm text-white mt-1">{job.title}</p>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/admin/customers/${job.customerId}`}
                      className="text-sm text-chrome-300 hover:text-white"
                    >
                      {getCustomerName(job)}
                    </Link>
                    {job.vehicle && (
                      <p className="text-xs text-chrome-500 mt-1">
                        {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex px-2 py-1 text-xs font-medium rounded-full border',
                        getStatusColor(job.status)
                      )}
                    >
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('text-sm font-medium capitalize', getPriorityColor(job.priority))}>
                      {job.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {job.scheduledStartDate ? (
                      <div className="text-sm text-chrome-300">
                        <p>{job.scheduledStartDate}</p>
                        {job.scheduledEndDate && (
                          <p className="text-xs text-chrome-500">to {job.scheduledEndDate}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-chrome-500">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-medium text-white">
                      {formatCurrency(job.quotedAmount || 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <div className="px-6 py-12 text-center text-chrome-400">
              No jobs found
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/admin/jobs/${job.id}`}
              className="bg-admin-bg-card border border-admin-border rounded-xl p-5 hover:border-electric-500/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-electric-400 font-medium">{job.jobNumber}</span>
                  <h3 className="text-white font-medium mt-1">{job.title}</h3>
                </div>
                <span
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full border',
                    getStatusColor(job.status)
                  )}
                >
                  {job.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-chrome-400">
                  <User size={14} />
                  {getCustomerName(job)}
                </div>
                {job.scheduledStartDate && (
                  <div className="flex items-center gap-2 text-sm text-chrome-400">
                    <Calendar size={14} />
                    {job.scheduledStartDate}
                  </div>
                )}
                <div className={cn('flex items-center gap-2 text-sm', getPriorityColor(job.priority))}>
                  <AlertCircle size={14} />
                  {job.priority} priority
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-admin-border flex items-center justify-between">
                <span className="text-lg font-semibold text-white">
                  {formatCurrency(job.quotedAmount || 0)}
                </span>
                <span className="text-xs text-chrome-500">
                  {job.assignedBay || 'Unassigned'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-chrome-400">
          Showing <span className="font-medium text-white">{jobs.length}</span> jobs
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-card rounded-lg transition-colors disabled:opacity-50"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2 bg-admin-bg-card rounded-lg text-sm text-white">
            Page {currentPage}
          </span>
          <button className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-card rounded-lg transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobListPage;
