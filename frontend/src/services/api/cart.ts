import apiClient from './client';
import type { Cart, CartItem, ShippingRate } from '@/types';

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const response = await apiClient.get<Cart>('/cart');
    return response.data;
  },

  addItem: async (productId: number, quantity: number): Promise<Cart> => {
    const response = await apiClient.post<Cart>('/cart/items', {
      productId,
      quantity,
    });
    return response.data;
  },

  updateItem: async (itemId: number, quantity: number): Promise<Cart> => {
    const response = await apiClient.put<Cart>(`/cart/items/${itemId}`, {
      quantity,
    });
    return response.data;
  },

  removeItem: async (itemId: number): Promise<Cart> => {
    const response = await apiClient.delete<Cart>(`/cart/items/${itemId}`);
    return response.data;
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete('/cart');
  },

  applyCoupon: async (couponCode: string): Promise<Cart> => {
    const response = await apiClient.post<Cart>('/cart/apply-coupon', {
      couponCode,
    });
    return response.data;
  },

  removeCoupon: async (): Promise<Cart> => {
    const response = await apiClient.delete<Cart>('/cart/coupon');
    return response.data;
  },

  getShippingEstimate: async (postalCode: string): Promise<ShippingRate[]> => {
    const response = await apiClient.get<ShippingRate[]>('/cart/shipping-estimate', {
      params: { postalCode },
    });
    return response.data;
  },

  mergeCart: async (): Promise<Cart> => {
    const response = await apiClient.post<Cart>('/cart/merge');
    return response.data;
  },
};
