import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  List,
  Plus,
  User,
  Clock,
  AlertCircle,
  GripVertical,
} from 'lucide-react';
import type { Job, JobStatus } from '@/types';

interface Column {
  id: JobStatus;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'pending', title: 'Pending', color: 'border-amber-500' },
  { id: 'scheduled', title: 'Scheduled', color: 'border-blue-500' },
  { id: 'in_progress', title: 'In Progress', color: 'border-electric-500' },
  { id: 'on_hold', title: 'On Hold', color: 'border-red-500' },
  { id: 'quality_check', title: 'QC', color: 'border-purple-500' },
  { id: 'completed', title: 'Completed', color: 'border-green-500' },
];

const JobBoardPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedJob, setDraggedJob] = useState<Job | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockJobs: Job[] = [
        {
          id: 1,
          jobNumber: 'JOB-2024-0156',
          customerId: 1,
          customer: { id: 1, customerNumber: 'CUST-0001', customerType: 'business', companyName: 'Performance Motors', country: 'US', paymentTerms: 'net_30', totalRevenue: 45000, totalJobs: 12, isActive: true, vehicles: [] },
          title: '350 SBC Full Rebuild',
          status: 'in_progress',
          priority: 'high',
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
        {
          id: 2,
          jobNumber: 'JOB-2024-0155',
          customerId: 2,
          customer: { id: 2, customerNumber: 'CUST-0002', customerType: 'individual', firstName: 'Mike', lastName: 'Johnson', country: 'US', paymentTerms: 'due_on_receipt', totalRevenue: 8500, totalJobs: 3, isActive: true, vehicles: [] },
          title: 'LS3 Dyno Tune',
          status: 'quality_check',
          priority: 'normal',
          scheduledEndDate: '2024-01-24',
          quotedAmount: 850,
          actualLaborCost: 0,
          actualPartsCost: 0,
          actualTotal: 0,
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
          customer: { id: 3, customerNumber: 'CUST-0003', customerType: 'shop', companyName: 'Track Day Garage', country: 'US', paymentTerms: 'net_15', totalRevenue: 32000, totalJobs: 8, isActive: true, vehicles: [] },
          title: 'Head Porting - BBC',
          status: 'in_progress',
          priority: 'normal',
          scheduledEndDate: '2024-01-26',
          quotedAmount: 1200,
          actualLaborCost: 0,
          actualPartsCost: 0,
          actualTotal: 0,
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
          customer: { id: 4, customerNumber: 'CUST-0004', customerType: 'individual', firstName: 'Robert', lastName: 'Davis', country: 'US', paymentTerms: 'due_on_receipt', totalRevenue: 4200, totalJobs: 2, isActive: true, vehicles: [] },
          title: 'Rotating Assembly Balance',
          status: 'scheduled',
          priority: 'low',
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
          customer: { id: 5, customerNumber: 'CUST-0005', customerType: 'business', companyName: 'Classic Car Restorations', country: 'US', paymentTerms: 'net_30', totalRevenue: 78000, totalJobs: 15, isActive: true, vehicles: [] },
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
        {
          id: 6,
          jobNumber: 'JOB-2024-0151',
          customerId: 1,
          customer: { id: 1, customerNumber: 'CUST-0001', customerType: 'business', companyName: 'Performance Motors', country: 'US', paymentTerms: 'net_30', totalRevenue: 45000, totalJobs: 12, isActive: true, vehicles: [] },
          title: 'Valve Job - SBC',
          status: 'completed',
          priority: 'normal',
          scheduledEndDate: '2024-01-20',
          quotedAmount: 600,
          actualLaborCost: 0,
          actualPartsCost: 0,
          actualTotal: 0,
          tasks: [],
          parts: [],
          labor: [],
          notes: [],
          files: [],
          createdAt: '2024-01-08',
          updatedAt: '2024-01-20',
        },
      ];

      setJobs(mockJobs);
      setIsLoading(false);
    };

    loadJobs();
  }, []);

  const getJobsByStatus = (status: JobStatus) => {
    return jobs.filter((job) => job.status === status);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-chrome-500',
      normal: 'bg-electric-500',
      high: 'bg-amber-500',
      urgent: 'bg-red-500',
    };
    return colors[priority] || 'bg-chrome-500';
  };

  const getCustomerName = (job: Job) => {
    if (job.customer?.companyName) return job.customer.companyName;
    if (job.customer?.firstName) return `${job.customer.firstName} ${job.customer.lastName}`;
    return 'Unknown';
  };

  const handleDragStart = (e: React.DragEvent, job: Job) => {
    setDraggedJob(job);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: JobStatus) => {
    e.preventDefault();
    if (draggedJob && draggedJob.status !== newStatus) {
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === draggedJob.id ? { ...job, status: newStatus } : job
        )
      );
    }
    setDraggedJob(null);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Board</h1>
          <p className="text-chrome-400 mt-1">Drag and drop to update job status</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-admin-bg-card hover:bg-admin-bg-hover border border-admin-border rounded-lg text-sm text-chrome-300 hover:text-white transition-colors"
          >
            <List size={18} />
            List View
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

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-72"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={cn('bg-admin-bg-card border-t-2 rounded-xl', column.color)}>
              {/* Column Header */}
              <div className="p-4 border-b border-admin-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{column.title}</h3>
                  <span className="px-2 py-1 bg-admin-bg rounded-full text-xs text-chrome-400">
                    {getJobsByStatus(column.id).length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="p-2 space-y-2 min-h-[400px]">
                {getJobsByStatus(column.id).map((job) => (
                  <Link
                    key={job.id}
                    to={`/admin/jobs/${job.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, job)}
                    className={cn(
                      'block bg-admin-bg border border-admin-border rounded-lg p-3 cursor-grab hover:border-electric-500/50 transition-colors',
                      draggedJob?.id === job.id && 'opacity-50'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-1">
                        <GripVertical size={14} className="text-chrome-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-electric-400 font-medium">
                            {job.jobNumber}
                          </span>
                          <div className={cn('w-2 h-2 rounded-full', getPriorityColor(job.priority))} />
                        </div>
                        <p className="text-sm text-white mt-1 line-clamp-2">{job.title}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-chrome-500">
                          <User size={12} />
                          <span className="truncate">{getCustomerName(job)}</span>
                        </div>
                        {job.scheduledEndDate && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-chrome-500">
                            <Clock size={12} />
                            <span>Due {job.scheduledEndDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                {getJobsByStatus(column.id).length === 0 && (
                  <div className="flex items-center justify-center h-24 border-2 border-dashed border-admin-border rounded-lg">
                    <p className="text-sm text-chrome-500">No jobs</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobBoardPage;
