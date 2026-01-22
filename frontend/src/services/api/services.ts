import apiClient, { uploadFile } from './client';
import type {
  ServiceType,
  ServiceRequest,
  ServiceRequestFilters,
  PaginatedResponse,
  Quote,
  Job,
  JobFilters,
  Invoice,
  CustomerVehicle,
} from '@/types';

export const servicesApi = {
  // Service Types
  getServiceTypes: async (): Promise<ServiceType[]> => {
    const response = await apiClient.get<ServiceType[]>('/service-types');
    return response.data;
  },

  // Service Requests
  getServiceRequests: async (
    filters?: ServiceRequestFilters
  ): Promise<PaginatedResponse<ServiceRequest>> => {
    const response = await apiClient.get<PaginatedResponse<ServiceRequest>>('/service-requests', {
      params: filters,
    });
    return response.data;
  },

  getServiceRequestById: async (id: number): Promise<ServiceRequest> => {
    const response = await apiClient.get<ServiceRequest>(`/service-requests/${id}`);
    return response.data;
  },

  createServiceRequest: async (data: {
    title: string;
    description?: string;
    customerNotes?: string;
    vehicleId?: number;
    requestedStartDate?: string;
    requestedCompletionDate?: string;
    isFlexibleTiming?: boolean;
    priority?: string;
    items: Array<{ serviceTypeId?: number; description: string; quantity?: number }>;
  }): Promise<ServiceRequest> => {
    const response = await apiClient.post<ServiceRequest>('/service-requests', data);
    return response.data;
  },

  updateServiceRequest: async (
    id: number,
    data: Partial<ServiceRequest>
  ): Promise<ServiceRequest> => {
    const response = await apiClient.put<ServiceRequest>(`/service-requests/${id}`, data);
    return response.data;
  },

  uploadServiceRequestFile: async (
    requestId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ fileUrl: string; fileName: string }> => {
    const response = await uploadFile(
      `/service-requests/${requestId}/files`,
      file,
      onProgress
    );
    return response.data;
  },

  // Quotes (Portal)
  getQuotes: async (page?: number, pageSize?: number): Promise<PaginatedResponse<Quote>> => {
    const response = await apiClient.get<PaginatedResponse<Quote>>('/portal/quotes', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getQuoteById: async (id: number): Promise<Quote> => {
    const response = await apiClient.get<Quote>(`/portal/quotes/${id}`);
    return response.data;
  },

  acceptQuote: async (id: number): Promise<Quote> => {
    const response = await apiClient.post<Quote>(`/portal/quotes/${id}/accept`);
    return response.data;
  },

  declineQuote: async (id: number, reason?: string): Promise<Quote> => {
    const response = await apiClient.post<Quote>(`/portal/quotes/${id}/decline`, { reason });
    return response.data;
  },

  // Jobs (Portal)
  getJobs: async (filters?: JobFilters): Promise<PaginatedResponse<Job>> => {
    const response = await apiClient.get<PaginatedResponse<Job>>('/portal/jobs', {
      params: filters,
    });
    return response.data;
  },

  getJobById: async (id: number): Promise<Job> => {
    const response = await apiClient.get<Job>(`/portal/jobs/${id}`);
    return response.data;
  },

  getJobFiles: async (jobId: number): Promise<Job['files']> => {
    const response = await apiClient.get<Job['files']>(`/portal/jobs/${jobId}/files`);
    return response.data;
  },

  approveAdditionalWork: async (jobId: number, approved: boolean): Promise<Job> => {
    const response = await apiClient.post<Job>(`/portal/jobs/${jobId}/approve`, { approved });
    return response.data;
  },

  // Invoices (Portal)
  getInvoices: async (page?: number, pageSize?: number): Promise<PaginatedResponse<Invoice>> => {
    const response = await apiClient.get<PaginatedResponse<Invoice>>('/portal/invoices', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getInvoiceById: async (id: number): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/portal/invoices/${id}`);
    return response.data;
  },

  downloadInvoicePdf: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/portal/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  payInvoice: async (
    id: number,
    paymentData: { paymentMethodId: string; amount: number }
  ): Promise<{ success: boolean; invoice: Invoice }> => {
    const response = await apiClient.post(`/portal/invoices/${id}/pay`, paymentData);
    return response.data;
  },

  // Vehicles (Portal)
  getVehicles: async (): Promise<CustomerVehicle[]> => {
    const response = await apiClient.get<CustomerVehicle[]>('/portal/vehicles');
    return response.data;
  },

  addVehicle: async (vehicle: Omit<CustomerVehicle, 'id' | 'customerId'>): Promise<CustomerVehicle> => {
    const response = await apiClient.post<CustomerVehicle>('/portal/vehicles', vehicle);
    return response.data;
  },

  updateVehicle: async (
    id: number,
    vehicle: Partial<CustomerVehicle>
  ): Promise<CustomerVehicle> => {
    const response = await apiClient.put<CustomerVehicle>(`/portal/vehicles/${id}`, vehicle);
    return response.data;
  },

  deleteVehicle: async (id: number): Promise<void> => {
    await apiClient.delete(`/portal/vehicles/${id}`);
  },
};
