import apiClient from './client';
import type { Order, PaginatedResponse, CheckoutData, ShippingRate } from '@/types';

export const ordersApi = {
  // Checkout
  validateCart: async (): Promise<{ valid: boolean; errors?: string[] }> => {
    const response = await apiClient.post('/checkout/validate');
    return response.data;
  },

  getShippingRates: async (address: {
    postalCode: string;
    city: string;
    state: string;
    country: string;
  }): Promise<ShippingRate[]> => {
    const response = await apiClient.post<ShippingRate[]>('/checkout/shipping-rates', address);
    return response.data;
  },

  calculateTax: async (address: {
    postalCode: string;
    city: string;
    state: string;
    country: string;
  }): Promise<{ taxRate: number; taxAmount: number }> => {
    const response = await apiClient.post('/checkout/tax-calculate', address);
    return response.data;
  },

  createOrder: async (data: CheckoutData): Promise<Order> => {
    const response = await apiClient.post<Order>('/checkout/create-order', data);
    return response.data;
  },

  processPayment: async (orderId: number, paymentData: {
    paymentMethodId: string;
    saveCard?: boolean;
  }): Promise<{ success: boolean; order: Order }> => {
    const response = await apiClient.post(`/checkout/payment`, {
      orderId,
      ...paymentData,
    });
    return response.data;
  },

  // Orders
  getOrders: async (page?: number, pageSize?: number): Promise<PaginatedResponse<Order>> => {
    const response = await apiClient.get<PaginatedResponse<Order>>('/orders', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getOrderById: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  getOrderByNumber: async (orderNumber: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/number/${orderNumber}`);
    return response.data;
  },

  cancelOrder: async (orderId: number, reason?: string): Promise<Order> => {
    const response = await apiClient.post<Order>(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  getOrderTracking: async (orderId: number): Promise<{
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    events: Array<{ date: string; status: string; location: string }>;
  }> => {
    const response = await apiClient.get(`/orders/${orderId}/tracking`);
    return response.data;
  },
};
