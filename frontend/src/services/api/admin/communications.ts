import client from '../client';

export interface Message {
  id: number;
  customerId: number;
  customerName: string;
  channel: 'email' | 'sms' | 'phone';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  timestamp: string;
  read: boolean;
  relatedTo?: {
    type: 'job' | 'quote' | 'invoice' | 'service_request';
    id: number;
    number: string;
  };
  attachments?: {
    id: number;
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }[];
}

export interface MessageFilters {
  search?: string;
  channel?: 'email' | 'sms' | 'phone';
  direction?: 'inbound' | 'outbound';
  customerId?: number;
  read?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface SendEmailData {
  customerId: number;
  to: string;
  subject: string;
  body: string;
  templateId?: number;
  attachments?: File[];
  relatedTo?: {
    type: 'job' | 'quote' | 'invoice' | 'service_request';
    id: number;
  };
  scheduledAt?: string;
}

export interface SendSmsData {
  customerId: number;
  to: string;
  message: string;
  templateId?: number;
  relatedTo?: {
    type: 'job' | 'quote' | 'invoice' | 'service_request';
    id: number;
  };
  scheduledAt?: string;
}

export interface LogPhoneCallData {
  customerId: number;
  phone: string;
  direction: 'inbound' | 'outbound';
  duration?: number;
  notes: string;
  relatedTo?: {
    type: 'job' | 'quote' | 'invoice' | 'service_request';
    id: number;
  };
}

export interface Template {
  id: number;
  name: string;
  type: 'email' | 'sms';
  category: 'quote' | 'invoice' | 'job' | 'general';
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateData {
  name: string;
  type: 'email' | 'sms';
  category: 'quote' | 'invoice' | 'job' | 'general';
  subject?: string;
  body: string;
}

export const communicationsApi = {
  // Messages
  getMessages: async (filters: MessageFilters = {}): Promise<{ items: Message[]; total: number }> => {
    const response = await client.get('/admin/communications/messages', { params: filters });
    return response.data;
  },

  getMessageById: async (id: number): Promise<Message> => {
    const response = await client.get(`/admin/communications/messages/${id}`);
    return response.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await client.patch(`/admin/communications/messages/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await client.post('/admin/communications/messages/mark-all-read');
  },

  // Sending
  sendEmail: async (data: SendEmailData): Promise<Message> => {
    const formData = new FormData();
    formData.append('customerId', data.customerId.toString());
    formData.append('to', data.to);
    formData.append('subject', data.subject);
    formData.append('body', data.body);
    if (data.templateId) formData.append('templateId', data.templateId.toString());
    if (data.relatedTo) formData.append('relatedTo', JSON.stringify(data.relatedTo));
    if (data.scheduledAt) formData.append('scheduledAt', data.scheduledAt);
    if (data.attachments) {
      data.attachments.forEach((file, i) => formData.append(`attachments[${i}]`, file));
    }

    const response = await client.post('/admin/communications/email', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  sendSms: async (data: SendSmsData): Promise<Message> => {
    const response = await client.post('/admin/communications/sms', data);
    return response.data;
  },

  logPhoneCall: async (data: LogPhoneCallData): Promise<Message> => {
    const response = await client.post('/admin/communications/phone', data);
    return response.data;
  },

  // Templates
  getTemplates: async (type?: 'email' | 'sms'): Promise<Template[]> => {
    const response = await client.get('/admin/communications/templates', { params: { type } });
    return response.data;
  },

  getTemplateById: async (id: number): Promise<Template> => {
    const response = await client.get(`/admin/communications/templates/${id}`);
    return response.data;
  },

  createTemplate: async (data: CreateTemplateData): Promise<Template> => {
    const response = await client.post('/admin/communications/templates', data);
    return response.data;
  },

  updateTemplate: async (id: number, data: Partial<CreateTemplateData>): Promise<Template> => {
    const response = await client.put(`/admin/communications/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await client.delete(`/admin/communications/templates/${id}`);
  },

  // Preview template with variables replaced
  previewTemplate: async (templateId: number, variables: Record<string, string>): Promise<{ subject?: string; body: string }> => {
    const response = await client.post(`/admin/communications/templates/${templateId}/preview`, { variables });
    return response.data;
  },
};

export default communicationsApi;
