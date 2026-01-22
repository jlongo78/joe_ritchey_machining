import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, Eye, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { servicesApi } from '@/services/api';
import { Card, Badge, Button, Input, Select, Pagination, EmptyState } from '@/components/common';
import type { ServiceRequest } from '@/types';

const ServiceRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const response = await servicesApi.getServiceRequests({
          page: currentPage,
          pageSize: 10,
          status: (statusFilter || undefined) as import('@/types').ServiceRequestStatus | undefined,
        });
        setRequests(response.items);
        setTotalPages(response.totalPages);
      } catch {
        // Mock data for demo
        const mockRequests = [
          {
            id: 1,
            requestNumber: 'REQ-2024-001',
            customerId: 1,
            status: 'pending' as const,
            priority: 'normal' as const,
            title: 'Engine Rebuild Request',
            description: 'Complete engine rebuild - B18C1 with forged internals',
            isFlexibleTiming: true,
            items: [
              { id: 1, requestId: 1, serviceTypeId: 1, description: 'Full build with Wiseco pistons', quantity: 1 },
            ],
            files: [],
            source: 'website' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 2,
            requestNumber: 'REQ-2024-002',
            customerId: 1,
            status: 'quoted' as const,
            priority: 'normal' as const,
            title: 'Cylinder Head Porting',
            description: 'Cylinder head porting for K20A2',
            isFlexibleTiming: true,
            items: [
              { id: 2, requestId: 2, serviceTypeId: 2, description: 'Cylinder Head Porting', quantity: 1 },
            ],
            files: [],
            source: 'website' as const,
            createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          },
          {
            id: 3,
            requestNumber: 'REQ-2024-003',
            customerId: 1,
            status: 'approved' as const,
            priority: 'high' as const,
            title: 'Block Machining & Balancing',
            description: 'Block machining and balancing for LS3',
            isFlexibleTiming: false,
            items: [
              { id: 3, requestId: 3, serviceTypeId: 3, description: 'Block Machining', quantity: 1 },
              { id: 4, requestId: 3, serviceTypeId: 8, description: 'Balancing', quantity: 1 },
            ],
            files: [],
            source: 'website' as const,
            createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          },
          {
            id: 4,
            requestNumber: 'REQ-2024-004',
            customerId: 1,
            status: 'declined' as const,
            priority: 'low' as const,
            title: 'Turbo Install',
            description: 'Turbo install on engine with unknown condition',
            isFlexibleTiming: true,
            items: [
              { id: 5, requestId: 4, serviceTypeId: 1, description: 'Engine Building', quantity: 1 },
            ],
            files: [],
            source: 'phone' as const,
            createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          },
        ];
        setRequests(mockRequests as ServiceRequest[]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [currentPage, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'quoted':
        return 'info';
      case 'pending':
        return 'warning';
      case 'declined':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'declined':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
      case 'quoted':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const statusOptions = [
    { value: '', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'approved', label: 'Approved' },
    { value: 'declined', label: 'Declined' },
  ];

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
        <h1 className="text-2xl font-bold text-secondary-900">Service Requests</h1>
        <Link to="/services/request">
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by request number..."
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

      {/* Requests List */}
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-secondary-900">{request.requestNumber}</h3>
                    <Badge variant={getStatusColor(request.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </Badge>
                  </div>
                  <p className="text-secondary-700 mb-2">{request.description}</p>
                  <p className="text-sm text-secondary-500">
                    Submitted: {formatDate(request.createdAt)}
                  </p>

                  {/* Services List */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {request.items.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center px-2 py-1 bg-secondary-100 text-secondary-700 rounded text-sm"
                      >
                        {item.description}
                        {item.quantity > 1 && ` (x${item.quantity})`}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link to={`/account/service-requests/${request.id}`}>
                    <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                      View Details
                    </Button>
                  </Link>
                  {request.status === 'quoted' && (
                    <Link to={`/account/service-requests/${request.id}/quote`}>
                      <Button size="sm">
                        View Quote
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}

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
          icon={<FileText className="h-16 w-16" />}
          title="No service requests"
          description="You haven't submitted any service requests yet."
          action={{
            label: 'Request Service',
            onClick: () => window.location.href = '/services/request',
          }}
        />
      )}
    </div>
  );
};

export default ServiceRequestsPage;
