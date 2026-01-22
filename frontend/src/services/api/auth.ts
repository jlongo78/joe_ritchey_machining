import apiClient from './client';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';

// Backend returns snake_case, frontend expects camelCase
interface BackendTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    const tokenResponse = await apiClient.post<BackendTokenResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // Store tokens temporarily to fetch user
    const accessToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token;

    // Fetch user with the new token
    const userResponse = await apiClient.get<User>('/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return {
      accessToken,
      refreshToken,
      user: userResponse.data
    };
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<User>('/auth/register', data);
    // Registration doesn't return tokens, need to login after
    const loginResponse = await authApi.login({ email: data.email, password: data.password });
    return loginResponse;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post<BackendTokenResponse>('/auth/refresh', { refreshToken });
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token
    };
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/users/me', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.put('/users/me/password', { currentPassword, newPassword });
    return response.data;
  },
};
