import client from '../client';
import type { User } from '@/types';

export interface AdminUser extends User {
  lastLogin?: string;
}

export interface UserFilters {
  search?: string;
  role?: 'admin' | 'manager' | 'technician';
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateUserData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'manager' | 'technician';
  sendInvite?: boolean;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'admin' | 'manager' | 'technician';
  isActive?: boolean;
}

export const usersApi = {
  getUsers: async (filters: UserFilters = {}): Promise<{ items: AdminUser[]; total: number }> => {
    const response = await client.get('/admin/users', { params: filters });
    return response.data;
  },

  getUserById: async (id: number): Promise<AdminUser> => {
    const response = await client.get(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (data: CreateUserData): Promise<AdminUser> => {
    const response = await client.post('/admin/users', data);
    return response.data;
  },

  inviteUser: async (email: string, role: 'admin' | 'manager' | 'technician'): Promise<{ message: string }> => {
    const response = await client.post('/admin/users/invite', { email, role });
    return response.data;
  },

  updateUser: async (id: number, data: UpdateUserData): Promise<AdminUser> => {
    const response = await client.put(`/admin/users/${id}`, data);
    return response.data;
  },

  updateRole: async (id: number, role: 'admin' | 'manager' | 'technician'): Promise<AdminUser> => {
    const response = await client.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  deactivateUser: async (id: number): Promise<AdminUser> => {
    const response = await client.patch(`/admin/users/${id}/deactivate`);
    return response.data;
  },

  activateUser: async (id: number): Promise<AdminUser> => {
    const response = await client.patch(`/admin/users/${id}/activate`);
    return response.data;
  },

  resetPassword: async (id: number): Promise<{ message: string }> => {
    const response = await client.post(`/admin/users/${id}/reset-password`);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await client.delete(`/admin/users/${id}`);
  },
};

export default usersApi;
