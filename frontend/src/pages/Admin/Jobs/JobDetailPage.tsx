import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  ArrowLeft,
  Edit,
  MoreHorizontal,
  User,
  Car,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  Circle,
  Plus,
  FileImage,
  MessageSquare,
  Wrench,
  Package,
  Receipt,
} from 'lucide-react';
import type { Job, JobTask, JobPart, JobNote } from '@/types';

type TabType = 'overview' | 'tasks' | 'parts' | 'labor' | 'files' | 'notes' | 'timeline';

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJob = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setJob({
        id: Number(id),
        jobNumber: 'JOB-2024-0156',
        customerId: 1,
        customer: {
          id: 1,
          customerNumber: 'CUST-0001',
          customerType: 'business',
          companyName: 'Performance Motors',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@performancemotors.com',
          phone: '(555) 123-4567',
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
          submodel: 'SS',
          engine: '350 SBC',
          vin: '1G1YY22G965000001',
          color: 'Red',
          isActive: true,
        },
        title: '350 SBC Full Rebuild',
        description: 'Complete engine rebuild including new pistons, rings, bearings, timing chain, and gasket set. Customer requested performance cam upgrade.',
        status: 'in_progress',
        priority: 'high',
        scheduledStartDate: '2024-01-20',
        scheduledEndDate: '2024-01-28',
        actualStartDate: '2024-01-20',
        assignedTechnicianId: 1,
        assignedBay: 'Bay 1',
        quotedAmount: 4500,
        actualLaborCost: 1200,
        actualPartsCost: 1800,
        actualTotal: 3000,
        tasks: [
          { id: 1, jobId: Number(id), title: 'Disassembly & Inspection', status: 'completed', estimatedHours: 4, actualHours: 3.5, displayOrder: 1 },
          { id: 2, jobId: Number(id), title: 'Machine Work - Block', status: 'completed', estimatedHours: 6, actualHours: 5, displayOrder: 2 },
          { id: 3, jobId: Number(id), title: 'Machine Work - Heads', status: 'in_progress', estimatedHours: 4, actualHours: 2, displayOrder: 3 },
          { id: 4, jobId: Number(id), title: 'Assembly - Short Block', status: 'pending', estimatedHours: 6, actualHours: 0, displayOrder: 4 },
          { id: 5, jobId: Number(id), title: 'Assembly - Long Block', status: 'pending', estimatedHours: 4, actualHours: 0, displayOrder: 5 },
          { id: 6, jobId: Number(id), title: 'Final Testing', status: 'pending', estimatedHours: 2, actualHours: 0, displayOrder: 6 },
        ],
        parts: [
          { id: 1, jobId: Number(id), partNumber: 'SP-1234', description: 'Forged Pistons (Set of 8)', quantity: 1, unitCost: 450, unitPrice: 550, totalPrice: 550, source: 'ordered', status: 'received' },
          { id: 2, jobId: Number(id), partNumber: 'SP-2345', description: 'Performance Rings Set', quantity: 1, unitCost: 120, unitPrice: 150, totalPrice: 150, source: 'inventory', status: 'installed' },
          { id: 3, jobId: Number(id), partNumber: 'SP-3456', description: 'Main Bearings', quantity: 1, unitCost: 85, unitPrice: 110, totalPrice: 110, source: 'inventory', status: 'installed' },
          { id: 4, jobId: Number(id), partNumber: 'SP-4567', description: 'Rod Bearings', quantity: 1, unitCost: 75, unitPrice: 95, totalPrice: 95, source: 'ordered', status: 'pending' },
          { id: 5, jobId: Number(id), partNumber: 'CAM-001', description: 'Performance Camshaft', quantity: 1, unitCost: 280, unitPrice: 350, totalPrice: 350, source: 'ordered', status: 'received' },
        ],
        labor: [
          { id: 1, jobId: Number(id), employeeId: 1, description: 'Disassembly', hours: 3.5, hourlyRate: 85, totalAmount: 297.5, laborType: 'regular', isBillable: true, performedDate: '2024-01-20' },
          { id: 2, jobId: Number(id), employeeId: 1, description: 'Block Machining', hours: 5, hourlyRate: 85, totalAmount: 425, laborType: 'regular', isBillable: true, performedDate: '2024-01-21' },
          { id: 3, jobId: Number(id), employeeId: 1, description: 'Head Work', hours: 2, hourlyRate: 85, totalAmount: 170, laborType: 'regular', isBillable: true, performedDate: '2024-01-22' },
        ],
        notes: [
          { id: 1, jobId: Number(id), userId: 1, noteType: 'internal', content: 'Customer approved cam upgrade. Added to quote.', createdAt: '2024-01-18T10:30:00Z' },
          { id: 2, jobId: Number(id), userId: 1, noteType: 'customer_visible', content: 'Block passed mag inspection. Proceeding with machining.', createdAt: '2024-01-20T14:00:00Z' },
        ],
        files: [],
        createdAt: '2024-01-15',
        updatedAt: '2024-01-22',
      });

      setIsLoading(false);
    };

    loadJob();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
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
    };
    return colors[status] || 'bg-chrome-500/10 text-chrome-400 border-chrome-500/20';
  };

  const getTaskStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle size={18} className="text-green-400" />;
    if (status === 'in_progress') return <Clock size={18} className="text-electric-400" />;
    return <Circle size={18} className="text-chrome-500" />;
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Wrench size={16} /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckCircle size={16} /> },
    { key: 'parts', label: 'Parts', icon: <Package size={16} /> },
    { key: 'labor', label: 'Labor', icon: <Clock size={16} /> },
    { key: 'files', label: 'Files', icon: <FileImage size={16} /> },
    { key: 'notes', label: 'Notes', icon: <MessageSquare size={16} /> },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-chrome-400">Job not found</p>
        <Link to="/admin/jobs" className="text-electric-400 hover:text-electric-300 mt-2 inline-block">
          Back to jobs
        </Link>
      </div>
    );
  }

  const completedTasks = job.tasks.filter((t) => t.status === 'completed').length;
  const totalTasks = job.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/jobs')}
          className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-card rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{job.jobNumber}</h1>
            <span
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-full border',
                getStatusColor(job.status)
              )}
            >
              {job.status.replace('_', ' ')}
            </span>
            <span
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                job.priority === 'high' ? 'bg-amber-500/10 text-amber-400' :
                job.priority === 'urgent' ? 'bg-red-500/10 text-red-400' :
                'bg-chrome-500/10 text-chrome-400'
              )}
            >
              {job.priority} priority
            </span>
          </div>
          <p className="text-chrome-400 mt-1">{job.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/invoices/new?jobId=${job.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-admin-bg-card hover:bg-admin-bg-hover border border-admin-border rounded-lg text-sm text-chrome-300 hover:text-white transition-colors"
          >
            <Receipt size={16} />
            Create Invoice
          </Link>
          <Link
            to={`/admin/jobs/${job.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Edit size={16} />
            Edit
          </Link>
          <button className="p-2 text-chrome-400 hover:text-white hover:bg-admin-bg-card rounded-lg transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-chrome-400">Progress</span>
          <span className="text-sm text-white">{completedTasks} of {totalTasks} tasks completed</span>
        </div>
        <div className="h-2 bg-admin-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-electric-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <DollarSign size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{formatCurrency(job.quotedAmount || 0)}</p>
              <p className="text-sm text-chrome-400">Quoted</p>
            </div>
          </div>
        </div>
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-electric-500/20">
              <Clock size={20} className="text-electric-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{formatCurrency(job.actualLaborCost)}</p>
              <p className="text-sm text-chrome-400">Labor Cost</p>
            </div>
          </div>
        </div>
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Package size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{formatCurrency(job.actualPartsCost)}</p>
              <p className="text-sm text-chrome-400">Parts Cost</p>
            </div>
          </div>
        </div>
        <div className="bg-admin-bg-card border border-admin-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{formatCurrency(job.actualTotal)}</p>
              <p className="text-sm text-chrome-400">Actual Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-admin-border">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-electric-500 text-electric-400'
                  : 'border-transparent text-chrome-400 hover:text-white hover:border-chrome-600'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer & Vehicle */}
            <div className="bg-admin-bg-card border border-admin-border rounded-xl">
              <div className="px-6 py-4 border-b border-admin-border">
                <h3 className="text-lg font-semibold text-white">Customer & Vehicle</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <User size={18} className="text-chrome-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-chrome-400">Customer</p>
                    <Link
                      to={`/admin/customers/${job.customerId}`}
                      className="text-white hover:text-electric-400"
                    >
                      {job.customer?.companyName || `${job.customer?.firstName} ${job.customer?.lastName}`}
                    </Link>
                    {job.customer?.phone && (
                      <p className="text-sm text-chrome-500">{job.customer.phone}</p>
                    )}
                  </div>
                </div>
                {job.vehicle && (
                  <div className="flex items-start gap-3">
                    <Car size={18} className="text-chrome-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-chrome-400">Vehicle</p>
                      <p className="text-white">
                        {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                      </p>
                      <p className="text-sm text-chrome-500">{job.vehicle.engine}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-admin-bg-card border border-admin-border rounded-xl">
              <div className="px-6 py-4 border-b border-admin-border">
                <h3 className="text-lg font-semibold text-white">Schedule</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-chrome-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-chrome-400">Scheduled</p>
                    <p className="text-white">
                      {job.scheduledStartDate} - {job.scheduledEndDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Wrench size={18} className="text-chrome-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-chrome-400">Assigned</p>
                    <p className="text-white">{job.assignedBay || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {job.description && (
              <div className="lg:col-span-2 bg-admin-bg-card border border-admin-border rounded-xl">
                <div className="px-6 py-4 border-b border-admin-border">
                  <h3 className="text-lg font-semibold text-white">Description</h3>
                </div>
                <div className="p-6">
                  <p className="text-chrome-300 whitespace-pre-wrap">{job.description}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-admin-bg-card border border-admin-border rounded-xl">
            <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Tasks</h3>
              <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors">
                <Plus size={16} />
                Add Task
              </button>
            </div>
            <div className="divide-y divide-admin-border">
              {job.tasks.map((task) => (
                <div key={task.id} className="px-6 py-4 flex items-center justify-between hover:bg-admin-bg-hover transition-colors">
                  <div className="flex items-center gap-4">
                    {getTaskStatusIcon(task.status)}
                    <div>
                      <p className={cn('text-white', task.status === 'completed' && 'line-through text-chrome-500')}>
                        {task.title}
                      </p>
                      {task.estimatedHours && (
                        <p className="text-sm text-chrome-500">
                          Est: {task.estimatedHours}h | Actual: {task.actualHours}h
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full border',
                    getStatusColor(task.status)
                  )}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'parts' && (
          <div className="bg-admin-bg-card border border-admin-border rounded-xl">
            <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Parts</h3>
              <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors">
                <Plus size={16} />
                Add Part
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-chrome-400 uppercase">Part #</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-chrome-400 uppercase">Description</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-chrome-400 uppercase">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-chrome-400 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-chrome-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {job.parts.map((part) => (
                  <tr key={part.id} className="hover:bg-admin-bg-hover">
                    <td className="px-6 py-4 text-sm text-electric-400">{part.partNumber}</td>
                    <td className="px-6 py-4 text-sm text-white">{part.description}</td>
                    <td className="px-6 py-4 text-sm text-chrome-300 text-center">{part.quantity}</td>
                    <td className="px-6 py-4 text-sm text-white text-right">{formatCurrency(part.totalPrice || 0)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full border',
                        part.status === 'installed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        part.status === 'received' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      )}>
                        {part.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'labor' && (
          <div className="bg-admin-bg-card border border-admin-border rounded-xl">
            <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Labor</h3>
              <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors">
                <Plus size={16} />
                Add Labor Entry
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-chrome-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-chrome-400 uppercase">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-chrome-400 uppercase">Hours</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-chrome-400 uppercase">Rate</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-chrome-400 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {job.labor.map((entry) => (
                  <tr key={entry.id} className="hover:bg-admin-bg-hover">
                    <td className="px-6 py-4 text-sm text-chrome-300">{entry.performedDate}</td>
                    <td className="px-6 py-4 text-sm text-white">{entry.description}</td>
                    <td className="px-6 py-4 text-sm text-chrome-300 text-right">{entry.hours}h</td>
                    <td className="px-6 py-4 text-sm text-chrome-300 text-right">{formatCurrency(entry.hourlyRate)}/h</td>
                    <td className="px-6 py-4 text-sm text-white text-right">{formatCurrency(entry.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-admin-border bg-admin-bg">
                  <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-white text-right">Total Labor</td>
                  <td className="px-6 py-3 text-sm font-semibold text-white text-right">{formatCurrency(job.actualLaborCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="bg-admin-bg-card border border-admin-border rounded-xl p-12 text-center">
            <FileImage size={48} className="mx-auto text-chrome-600 mb-4" />
            <p className="text-chrome-400">No files uploaded yet</p>
            <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} />
              Upload Files
            </button>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-admin-bg-card border border-admin-border rounded-xl">
            <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Notes</h3>
              <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-electric-500 hover:bg-electric-600 text-white rounded-lg text-sm font-medium transition-colors">
                <Plus size={16} />
                Add Note
              </button>
            </div>
            <div className="divide-y divide-admin-border">
              {job.notes.map((note) => (
                <div key={note.id} className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      note.noteType === 'customer_visible' ? 'bg-green-500/10 text-green-400' : 'bg-chrome-500/10 text-chrome-400'
                    )}>
                      {note.noteType.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-chrome-500">{new Date(note.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-chrome-300">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailPage;
