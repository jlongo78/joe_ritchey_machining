import client from '../client';
import type { Invoice, InvoiceItem, InvoiceStatus, Payment, PaymentMethod, PaginatedResponse } from '@/types';

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus;
  customerId?: number;
  jobId?: number;
  dateFrom?: string;
  dateTo?: string;
  overdue?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateInvoiceData {
  customerId: number;
  jobId?: number;
  invoiceDate?: string;
  dueDate: string;
  poNumber?: string;
  notes?: string;
  terms?: string;
  discountAmount?: number;
  discountReason?: string;
  items: CreateInvoiceItemData[];
}

export interface CreateInvoiceItemData {
  itemType: 'labor' | 'parts' | 'service' | 'other';
  description: string;
  quantity: number;
  unitPrice: number;
  isTaxable?: boolean;
}

export interface RecordPaymentData {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  cardLastFour?: string;
  cardType?: string;
}

export const invoicesApi = {
  getInvoices: async (filters: InvoiceFilters = {}): Promise<PaginatedResponse<Invoice>> => {
    const response = await client.get('/admin/invoices', { params: filters });
    return response.data;
  },

  getInvoiceById: async (id: number): Promise<Invoice> => {
    const response = await client.get(`/admin/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await client.post('/admin/invoices', data);
    return response.data;
  },

  createFromJob: async (jobId: number): Promise<Invoice> => {
    const response = await client.post('/admin/invoices/from-job', { jobId });
    return response.data;
  },

  updateInvoice: async (id: number, data: Partial<CreateInvoiceData>): Promise<Invoice> => {
    const response = await client.put(`/admin/invoices/${id}`, data);
    return response.data;
  },

  deleteInvoice: async (id: number): Promise<void> => {
    await client.delete(`/admin/invoices/${id}`);
  },

  // Invoice Items
  addItem: async (invoiceId: number, data: CreateInvoiceItemData): Promise<InvoiceItem> => {
    const response = await client.post(`/admin/invoices/${invoiceId}/items`, data);
    return response.data;
  },

  updateItem: async (invoiceId: number, itemId: number, data: Partial<CreateInvoiceItemData>): Promise<InvoiceItem> => {
    const response = await client.put(`/admin/invoices/${invoiceId}/items/${itemId}`, data);
    return response.data;
  },

  deleteItem: async (invoiceId: number, itemId: number): Promise<void> => {
    await client.delete(`/admin/invoices/${invoiceId}/items/${itemId}`);
  },

  // Invoice Actions
  sendInvoice: async (id: number): Promise<Invoice> => {
    const response = await client.post(`/admin/invoices/${id}/send`);
    return response.data;
  },

  sendReminder: async (id: number): Promise<void> => {
    await client.post(`/admin/invoices/${id}/send-reminder`);
  },

  voidInvoice: async (id: number, reason?: string): Promise<Invoice> => {
    const response = await client.post(`/admin/invoices/${id}/void`, { reason });
    return response.data;
  },

  generatePdf: async (id: number): Promise<Blob> => {
    const response = await client.get(`/admin/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Payments
  recordPayment: async (invoiceId: number, data: RecordPaymentData): Promise<Payment> => {
    const response = await client.post(`/admin/invoices/${invoiceId}/payments`, data);
    return response.data;
  },

  getPayments: async (invoiceId: number): Promise<Payment[]> => {
    const response = await client.get(`/admin/invoices/${invoiceId}/payments`);
    return response.data;
  },

  refundPayment: async (invoiceId: number, paymentId: number, amount?: number): Promise<Payment> => {
    const response = await client.post(`/admin/invoices/${invoiceId}/payments/${paymentId}/refund`, { amount });
    return response.data;
  },
};

export default invoicesApi;
