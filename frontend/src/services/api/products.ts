import apiClient from './client';
import type {
  Product,
  Category,
  Brand,
  ProductFilters,
  PaginatedResponse,
  Review,
  VehicleMake,
  VehicleModel,
  VehicleYear,
} from '@/types';

export const productsApi = {
  // Products
  getProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/products', {
      params: filters,
    });
    return response.data;
  },

  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/slug/${slug}`);
    return response.data;
  },

  getFeaturedProducts: async (limit?: number): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/products/featured', {
      params: { limit },
    });
    return response.data;
  },

  getNewArrivals: async (limit?: number): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/products/new-arrivals', {
      params: { limit },
    });
    return response.data;
  },

  getRelatedProducts: async (productId: number, limit?: number): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(`/products/${productId}/related`, {
      params: { limit },
    });
    return response.data;
  },

  searchProducts: async (query: string, filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/products/search', {
      params: { query, ...filters },
    });
    return response.data;
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/categories');
    return response.data;
  },

  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const response = await apiClient.get<Category>(`/categories/slug/${slug}`);
    return response.data;
  },

  getCategoryProducts: async (
    categoryId: number,
    filters?: ProductFilters
  ): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>(
      `/categories/${categoryId}/products`,
      { params: filters }
    );
    return response.data;
  },

  // Brands
  getBrands: async (): Promise<Brand[]> => {
    const response = await apiClient.get<Brand[]>('/brands');
    return response.data;
  },

  getBrandBySlug: async (slug: string): Promise<Brand> => {
    const response = await apiClient.get<Brand>(`/brands/slug/${slug}`);
    return response.data;
  },

  getBrandProducts: async (
    brandId: number,
    filters?: ProductFilters
  ): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>(
      `/brands/${brandId}/products`,
      { params: filters }
    );
    return response.data;
  },

  // Reviews
  getProductReviews: async (
    productId: number,
    page?: number,
    pageSize?: number
  ): Promise<PaginatedResponse<Review>> => {
    const response = await apiClient.get<PaginatedResponse<Review>>(
      `/products/${productId}/reviews`,
      { params: { page, pageSize } }
    );
    return response.data;
  },

  createReview: async (
    productId: number,
    review: { rating: number; title?: string; content?: string; pros?: string; cons?: string }
  ): Promise<Review> => {
    const response = await apiClient.post<Review>('/reviews', {
      productId,
      ...review,
    });
    return response.data;
  },

  markReviewHelpful: async (reviewId: number): Promise<void> => {
    await apiClient.post(`/reviews/${reviewId}/helpful`);
  },

  // Vehicle Fitment
  getVehicleMakes: async (): Promise<VehicleMake[]> => {
    const response = await apiClient.get<VehicleMake[]>('/vehicles/makes');
    return response.data;
  },

  getVehicleModels: async (makeId: number): Promise<VehicleModel[]> => {
    const response = await apiClient.get<VehicleModel[]>(`/vehicles/makes/${makeId}/models`);
    return response.data;
  },

  getVehicleYears: async (modelId: number): Promise<VehicleYear[]> => {
    const response = await apiClient.get<VehicleYear[]>(`/vehicles/models/${modelId}/years`);
    return response.data;
  },

  getProductsByFitment: async (
    yearId: number,
    filters?: ProductFilters
  ): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/vehicles/fitment', {
      params: { yearId, ...filters },
    });
    return response.data;
  },
};
