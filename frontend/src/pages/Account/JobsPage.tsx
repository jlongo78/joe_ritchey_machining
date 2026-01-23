import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Clock, Search, Eye, CheckCircle } from 'lucide-react';
import { formatPrice, formatDate } from '@/utils/formatters';
import { servicesApi } from '@/services/api';
import { Card, Badge, Button, Input, Select, Pagination, EmptyState } from '@/components/common';
import type { Job } from '@/types';

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const response = await servicesApi.getJobs({
          page: currentPage,
          pageSize: 10,
          status: (statusFilter || undefined) as import('@/types').JobStatus | undefined,
        });
        setJobs(response.items);
        setTotalPages(response.totalPages);
      } catch {
        // Mock data for demo
        const mockJobs = [
          {
            id: 1,
            jobNumber: 'JOB-2024-001',
            customerId: 1,
            title: 'Engine Build - B18C1',
            description: 'Complete engine build - B18C1 with Wiseco pistons, Eagle rods',
            status: 'in_progress' as const,
            priority: 'normal' as const,
            scheduledEndDate: new Date(Date.now() + 7 * 86400000).toISOString(),
            actualLaborCost: 2500,
            actualPartsCost: 1200,
            actualTotal: 3700,
            tasks: [
              { id: 1, jobId: 1, title: 'Disassembly & inspection', status: 'completed' as const, actualHours: 2, displayOrder: 1 },
              { id: 2, jobId: 1, title: 'Block machining', status: 'completed' as const, actualHours: 4, displayOrder: 2 },
              { id: 3, jobId: 1, title: 'Head porting', status: 'in_progress' as const, actualHours: 2, displayOrder: 3 },
              { id: 4, jobId: 1, title: 'Assembly', status: 'pending' as const, actualHours: 0, displayOrder: 4 },
              { id: 5, jobId: 1, title: 'Dyno tuning', status: 'pending' as const, actualHours: 0, displayOrder: 5 },
            ],
            parts: [],
            labor: [],
            notes: [],
            files: [],
            createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 2,
            jobNumber: 'JOB-2024-002',
            customerId: 1,
            title: 'Cylinder head porting - K20A2',
            description: 'Cylinder head porting - K20A2',
            status: 'completed' as const,
            priority: 'normal' as const,
            actualEndDate: new Date(Date.now() - 5 * 86400000).toISOString(),
            actualLaborCost: 800,
            actualPartsCost: 0,
            actualTotal: 800,
            tasks: [],
            parts: [],
            labor: [],
            notes: [],
            files: [],
            createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          },
          {
            id: 3,
            jobNumber: 'JOB-2024-003',
            customerId: 1,
            title: 'LS3 short block build',
            description: 'LS3 short block build',
            status: 'on_hold' as const,
            priority: 'normal' as const,
            scheduledEndDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            actualLaborCost: 1500,
            actualPartsCost: 2500,
            actualTotal: 4000,
            tasks: [],
            parts: [],
            labor: [],
            notes: [],
            files: [],
            createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setJobs(mockJobs as Job[]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [currentPage, statusFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'picked_up':
        return 'success';
      case 'in_progress':
      case 'quality_check':
        return 'info';
      case 'pending':
      case 'scheduled':
        return 'warning';
      case 'on_hold':
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const statusOptions = [
    { value: '', label: 'All Jobs' },
    { value: 'pending', label: 'Pending' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
  ];

  const getTaskProgress = (job: Job) => {
    if (!job.tasks || job.tasks.length === 0) return null;
    const completed = job.tasks.filter((t) => t.status === 'completed').length;
    return { completed, total: job.tasks.length, percent: Math.round((completed / job.tasks.length) * 100) };
  };

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
        <h1 className="text-2xl font-bold text-chrome-100">Active Jobs</h1>
        <Link to="/services/request">
          <Button size="sm" leftIcon={<Wrench className="h-4 w-4" />}>
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by job number..."
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

      {/* Jobs List */}
      {jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((job) => {
            const progress = getTaskProgress(job);
            return (
              <Card key={job.id}>
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-chrome-100">{job.jobNumber}</h3>
                      <Badge variant={getStatusColor(job.status)}>
                        {getStatusLabel(job.status)}
                      </Badge>
                    </div>
                    <p className="text-chrome-300 mb-2">{job.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-chrome-400">
                      <span>Started: {formatDate(job.createdAt)}</span>
                      {job.scheduledEndDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Est. Completion: {formatDate(job.scheduledEndDate)}
                        </span>
                      )}
                      {job.actualEndDate && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Completed: {formatDate(job.actualEndDate)}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {progress && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-chrome-300">Progress</span>
                          <span className="font-medium text-chrome-100">
                            {progress.completed} of {progress.total} tasks
                          </span>
                        </div>
                        <div className="h-2 bg-chrome-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 rounded-full transition-all"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-sm text-chrome-400">Estimated Total</p>
                      <p className="text-xl font-bold text-primary-600">{formatPrice(job.actualTotal)}</p>
                    </div>
                    <Link to={`/account/jobs/${job.id}`}>
                      <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Task List Preview */}
                {job.tasks && job.tasks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-chrome-700">
                    <p className="text-sm font-medium text-chrome-300 mb-2">Tasks</p>
                    <div className="flex flex-wrap gap-2">
                      {job.tasks.slice(0, 5).map((task) => (
                        <span
                          key={task.id}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : task.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-chrome-900 text-chrome-300'
                          }`}
                        >
                          {task.status === 'completed' && <CheckCircle className="h-3 w-3" />}
                          {task.title}
                        </span>
                      ))}
                      {job.tasks.length > 5 && (
                        <span className="text-xs text-chrome-400">
                          +{job.tasks.length - 5} more
                        </span>
                      )}
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
          icon={<Wrench className="h-16 w-16" />}
          title="No jobs found"
          description="You don't have any active jobs. Request a service to get started!"
          action={{
            label: 'Request Service',
            onClick: () => window.location.href = '/services/request',
          }}
        />
      )}
    </div>
  );
};

export default JobsPage;
