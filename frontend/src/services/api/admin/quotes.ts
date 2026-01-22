import client from '../client';
import type { Quote, QuoteItem, QuoteStatus, PaginatedResponse } from '@/types';

export interface QuoteFilters {
  search?: string;
  status?: QuoteStatus;
  customerId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateQuoteData {
  customerId: number;
  serviceRequestId?: number;
  vehicleId?: number;
  title?: string;
  description?: string;
  estimatedStartDate?: string;
  estimatedCompletionDate?: string;
  estimatedHours?: number;
  validUntil?: string;
  discountAmount?: number;
  discountReason?: string;
  termsAndConditions?: string;
  items: CreateQuoteItemData[];
}

export interface CreateQuoteItemData {
  itemType: 'labor' | 'parts' | 'service' | 'other';
  serviceTypeId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  estimatedHours?: number;
  hourlyRate?: number;
  notes?: string;
  isTaxable?: boolean;
}

export const quotesApi = {
  getQuotes: async (filters: QuoteFilters = {}): Promise<PaginatedResponse<Quote>> => {
    const response = await client.get('/admin/quotes', { params: filters });
    return response.data;
  },

  getQuoteById: async (id: number): Promise<Quote> => {
    const response = await client.get(`/admin/quotes/${id}`);
    return response.data;
  },

  createQuote: async (data: CreateQuoteData): Promise<Quote> => {
    const response = await client.post('/admin/quotes', data);
    return response.data;
  },

  updateQuote: async (id: number, data: Partial<CreateQuoteData>): Promise<Quote> => {
    const response = await client.put(`/admin/quotes/${id}`, data);
    return response.data;
  },

  deleteQuote: async (id: number): Promise<void> => {
    await client.delete(`/admin/quotes/${id}`);
  },

  // Quote Items
  addItem: async (quoteId: number, data: CreateQuoteItemData): Promise<QuoteItem> => {
    const response = await client.post(`/admin/quotes/${quoteId}/items`, data);
    return response.data;
  },

  updateItem: async (quoteId: number, itemId: number, data: Partial<CreateQuoteItemData>): Promise<QuoteItem> => {
    const response = await client.put(`/admin/quotes/${quoteId}/items/${itemId}`, data);
    return response.data;
  },

  deleteItem: async (quoteId: number, itemId: number): Promise<void> => {
    await client.delete(`/admin/quotes/${quoteId}/items/${itemId}`);
  },

  // Quote Actions
  sendQuote: async (id: number): Promise<Quote> => {
    const response = await client.post(`/admin/quotes/${id}/send`);
    return response.data;
  },

  convertToJob: async (id: number): Promise<{ quote: Quote; jobId: number }> => {
    const response = await client.post(`/admin/quotes/${id}/convert-to-job`);
    return response.data;
  },

  duplicateQuote: async (id: number): Promise<Quote> => {
    const response = await client.post(`/admin/quotes/${id}/duplicate`);
    return response.data;
  },

  reviseQuote: async (id: number): Promise<Quote> => {
    const response = await client.post(`/admin/quotes/${id}/revise`);
    return response.data;
  },

  generatePdf: async (id: number): Promise<Blob> => {
    const response = await client.get(`/admin/quotes/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default quotesApi;
