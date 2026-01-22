import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  DollarSign,
  Wrench,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle,
  Package,
  Calendar,
  ArrowRight,
  MoreHorizontal,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color,
}) => {
  const colorClasses = {
    blue: 'bg-electric-500/10 text-electric-400 border-electric-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const iconBgClasses = {
    blue: 'bg-electric-500/20',
    green: 'bg-green-500/20',
    amber: 'bg-amber-500/20',
    purple: 'bg-purple-500/20',
    red: 'bg-red-500/20',
  };

  return (
    <div className="bg-admin-bg-card border border-admin-border rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-chrome-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change >= 0 ? (
                <TrendingUp size={14} className="text-green-400" />
              ) : (
                <TrendingDown size={14} className="text-red-400" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  change >= 0 ? 'text-green-400' : 'text-red-400'
                )}
              >
                {change >= 0 ? '+' : ''}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-chrome-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', iconBgClasses[color])}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface Activity {
  id: number;
  type: 'job' | 'quote' | 'invoice' | 'customer';
  title: string;
  description: string;
  time: string;
  status?: string;
}

interface JobSummary {
  id: number;
  jobNumber: string;
  customer: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
}

const AdminDashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    revenueToday: 0,
    revenueWeek: 0,
    revenueMonth: 0,
    revenueYTD: 0,
    activeJobs: 0,
    pendingQuotes: 0,
    overdueInvoices: 0,
    lowStockItems: 0,
  });

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [activeJobs, setActiveJobs] = useState<JobSummary[]>([]);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      // In production, this would fetch from the API
      await new Promise((resolve) => setTimeout(resolve, 500));

      setStats({
        revenueToday: 3250,
        revenueWeek: 18750,
        revenueMonth: 67500,
        revenueYTD: 542000,
        activeJobs: 12,
        pendingQuotes: 8,
        overdueInvoices: 3,
        lowStockItems: 5,
      });

      setRecentActivity([
        {
          id: 1,
          type: 'job',
          title: 'JOB-2024-0156',
          description: 'Engine rebuild for 1969 Camaro started',
          time: '15 min ago',
          status: 'in_progress',
        },
        {
          id: 2,
          type: 'quote',
          title: 'QT-2024-0089',
          description: 'Quote accepted by Performance Motors',
          time: '1 hour ago',
          status: 'accepted',
        },
        {
          id: 3,
          type: 'invoice',
          title: 'INV-2024-0234',
          description: 'Payment received - $4,500',
          time: '2 hours ago',
          status: 'paid',
        },
        {
          id: 4,
          type: 'customer',
          title: 'New Customer',
          description: 'Track Day Garage registered',
          time: '3 hours ago',
        },
        {
          id: 5,
          type: 'job',
          title: 'JOB-2024-0155',
          description: 'Dyno tuning completed',
          time: '4 hours ago',
          status: 'completed',
        },
      ]);

      setActiveJobs([
        {
          id: 1,
          jobNumber: 'JOB-2024-0156',
          customer: 'Mike Johnson',
          title: '350 SBC Rebuild',
          status: 'in_progress',
          priority: 'high',
          dueDate: '2024-01-25',
        },
        {
          id: 2,
          jobNumber: 'JOB-2024-0155',
          customer: 'Performance Motors',
          title: 'LS3 Dyno Tune',
          status: 'quality_check',
          priority: 'normal',
          dueDate: '2024-01-24',
        },
        {
          id: 3,
          jobNumber: 'JOB-2024-0154',
          customer: 'Track Day Garage',
          title: 'Head Porting - BBC',
          status: 'in_progress',
          priority: 'normal',
          dueDate: '2024-01-26',
        },
        {
          id: 4,
          jobNumber: 'JOB-2024-0153',
          customer: 'John Smith',
          title: 'Rotating Assembly Balance',
          status: 'scheduled',
          priority: 'low',
          dueDate: '2024-01-28',
        },
      ]);

      setIsLoading(false);
    };

    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      in_progress: 'bg-electric-500/10 text-electric-400 border-electric-500/20',
      quality_check: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
      paid: 'bg-green-500/10 text-green-400 border-green-500/20',
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

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      job: <Wrench size={16} className="text-electric-400" />,
      quote: <FileText size={16} className="text-purple-400" />,
      invoice: <DollarSign size={16} className="text-green-400" />,
      customer: <Users size={16} className="text-amber-400" />,
    };
    return icons[type] || <Clock size={16} className="text-chrome-400" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-chrome-400 mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-admin-bg-card border border-admin-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-electric-500">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.revenueToday)}
          change={12}
          changeLabel="vs yesterday"
          icon={<DollarSign size={24} className="text-green-400" />}
          color="green"
        />
        <StatCard
          title="This Week"
          value={formatCurrency(stats.revenueWeek)}
          change={8}
          changeLabel="vs last week"
          icon={<TrendingUp size={24} className="text-electric-400" />}
          color="blue"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats.revenueMonth)}
          change={-3}
          changeLabel="vs last month"
          icon={<Calendar size={24} className="text-amber-400" />}
          color="amber"
        />
        <StatCard
          title="Year to Date"
          value={formatCurrency(stats.revenueYTD)}
          change={15}
          changeLabel="vs last year"
          icon={<DollarSign size={24} className="text-purple-400" />}
          color="purple"
        />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/jobs"
          className="bg-admin-bg-card border border-admin-border rounded-xl p-4 hover:border-electric-500/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-electric-500/20">
                <Wrench size={20} className="text-electric-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.activeJobs}</p>
                <p className="text-sm text-chrome-400">Active Jobs</p>
              </div>
            </div>
            <ArrowRight
              size={20}
              className="text-chrome-600 group-hover:text-electric-400 transition-colors"
            />
          </div>
        </Link>

        <Link
          to="/admin/quotes"
          className="bg-admin-bg-card border border-admin-border rounded-xl p-4 hover:border-purple-500/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FileText size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pendingQuotes}</p>
                <p className="text-sm text-chrome-400">Pending Quotes</p>
              </div>
            </div>
            <ArrowRight
              size={20}
              className="text-chrome-600 group-hover:text-purple-400 transition-colors"
            />
          </div>
        </Link>

        <Link
          to="/admin/invoices?status=overdue"
          className="bg-admin-bg-card border border-admin-border rounded-xl p-4 hover:border-red-500/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.overdueInvoices}</p>
                <p className="text-sm text-chrome-400">Overdue Invoices</p>
              </div>
            </div>
            <ArrowRight
              size={20}
              className="text-chrome-600 group-hover:text-red-400 transition-colors"
            />
          </div>
        </Link>

        <Link
          to="/admin/inventory?stock=low"
          className="bg-admin-bg-card border border-admin-border rounded-xl p-4 hover:border-amber-500/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Package size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.lowStockItems}</p>
                <p className="text-sm text-chrome-400">Low Stock Items</p>
              </div>
            </div>
            <ArrowRight
              size={20}
              className="text-chrome-600 group-hover:text-amber-400 transition-colors"
            />
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Jobs */}
        <div className="lg:col-span-2 bg-admin-bg-card border border-admin-border rounded-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
            <h2 className="text-lg font-semibold text-white">Active Jobs</h2>
            <Link
              to="/admin/jobs"
              className="text-sm text-electric-400 hover:text-electric-300 transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-admin-border">
            {activeJobs.map((job) => (
              <Link
                key={job.id}
                to={`/admin/jobs/${job.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-admin-bg-hover transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-electric-400">
                      {job.jobNumber}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full border',
                        getStatusColor(job.status)
                      )}
                    >
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-white mt-1 truncate">{job.title}</p>
                  <p className="text-xs text-chrome-500">{job.customer}</p>
                </div>
                <div className="text-right ml-4">
                  <p className={cn('text-sm font-medium', getPriorityColor(job.priority))}>
                    {job.priority}
                  </p>
                  <p className="text-xs text-chrome-500">Due {job.dueDate}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-admin-bg-card border border-admin-border rounded-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-admin-border">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <button className="p-1 text-chrome-400 hover:text-white transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="divide-y divide-admin-border">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 px-6 py-4 hover:bg-admin-bg-hover transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-admin-bg-secondary">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {activity.title}
                    </span>
                    {activity.status && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-[10px] font-medium rounded border',
                          getStatusColor(activity.status)
                        )}
                      >
                        {activity.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-chrome-400 mt-0.5 truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-chrome-600 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-admin-bg-card border border-admin-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/admin/jobs/new"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-admin-bg hover:bg-admin-bg-hover border border-admin-border hover:border-electric-500/50 transition-colors group"
          >
            <div className="p-3 rounded-full bg-electric-500/10 group-hover:bg-electric-500/20 transition-colors">
              <Wrench size={24} className="text-electric-400" />
            </div>
            <span className="text-sm text-chrome-300 group-hover:text-white transition-colors">
              New Job
            </span>
          </Link>
          <Link
            to="/admin/quotes/new"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-admin-bg hover:bg-admin-bg-hover border border-admin-border hover:border-purple-500/50 transition-colors group"
          >
            <div className="p-3 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <FileText size={24} className="text-purple-400" />
            </div>
            <span className="text-sm text-chrome-300 group-hover:text-white transition-colors">
              New Quote
            </span>
          </Link>
          <Link
            to="/admin/invoices/new"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-admin-bg hover:bg-admin-bg-hover border border-admin-border hover:border-green-500/50 transition-colors group"
          >
            <div className="p-3 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <DollarSign size={24} className="text-green-400" />
            </div>
            <span className="text-sm text-chrome-300 group-hover:text-white transition-colors">
              New Invoice
            </span>
          </Link>
          <Link
            to="/admin/customers/new"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-admin-bg hover:bg-admin-bg-hover border border-admin-border hover:border-amber-500/50 transition-colors group"
          >
            <div className="p-3 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
              <Users size={24} className="text-amber-400" />
            </div>
            <span className="text-sm text-chrome-300 group-hover:text-white transition-colors">
              New Customer
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
