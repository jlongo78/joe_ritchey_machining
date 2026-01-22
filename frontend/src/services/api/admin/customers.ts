import client from '../client';
import type { Customer, CustomerVehicle, PaginatedResponse } from '@/types';

export interface CustomerFilters {
  search?: string;
  type?: 'individual' | 'business' | 'shop';
  status?: 'active' | 'inactive';
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCustomerData {
  customerType: 'individual' | 'business' | 'shop';
  companyName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  paymentTerms?: string;
  notes?: string;
}

export interface CreateVehicleData {
  year?: number;
  make?: string;
  model?: string;
  submodel?: string;
  engine?: string;
  vin?: string;
  licensePlate?: string;
  color?: string;
  mileage?: number;
  notes?: string;
}

export const customersApi = {
  // Customers
  getCustomers: async (filters: CustomerFilters = {}): Promise<PaginatedResponse<Customer>> => {
    const response = await client.get('/admin/customers', { params: filters });
    return response.data;
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    const response = await client.get(`/admin/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data: CreateCustomerData): Promise<Customer> => {
    const response = await client.post('/admin/customers', data);
    return response.data;
  },

  updateCustomer: async (id: number, data: Partial<CreateCustomerData>): Promise<Customer> => {
    const response = await client.put(`/admin/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id: number): Promise<void> => {
    await client.delete(`/admin/customers/${id}`);
  },

  // Vehicles
  getCustomerVehicles: async (customerId: number): Promise<CustomerVehicle[]> => {
    const response = await client.get(`/admin/customers/${customerId}/vehicles`);
    return response.data;
  },

  addVehicle: async (customerId: number, data: CreateVehicleData): Promise<CustomerVehicle> => {
    const response = await client.post(`/admin/customers/${customerId}/vehicles`, data);
    return response.data;
  },

  updateVehicle: async (customerId: number, vehicleId: number, data: Partial<CreateVehicleData>): Promise<CustomerVehicle> => {
    const response = await client.put(`/admin/customers/${customerId}/vehicles/${vehicleId}`, data);
    return response.data;
  },

  deleteVehicle: async (customerId: number, vehicleId: number): Promise<void> => {
    await client.delete(`/admin/customers/${customerId}/vehicles/${vehicleId}`);
  },

  // Customer History
  getCustomerJobs: async (customerId: number) => {
    const response = await client.get(`/admin/customers/${customerId}/jobs`);
    return response.data;
  },

  getCustomerQuotes: async (customerId: number) => {
    const response = await client.get(`/admin/customers/${customerId}/quotes`);
    return response.data;
  },

  getCustomerInvoices: async (customerId: number) => {
    const response = await client.get(`/admin/customers/${customerId}/invoices`);
    return response.data;
  },

  getCustomerCommunications: async (customerId: number) => {
    const response = await client.get(`/admin/customers/${customerId}/communications`);
    return response.data;
  },
};

export default customersApi;
