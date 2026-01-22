import client from '../client';

export interface DashboardStats {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueYTD: number;
  activeJobs: number;
  pendingQuotes: number;
  overdueInvoices: number;
  lowStockItems: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  jobs: number;
}

export interface TopService {
  serviceId: number;
  name: string;
  count: number;
  revenue: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  topCustomers: {
    customerId: number;
    name: string;
    revenue: number;
    jobCount: number;
  }[];
}

export const analyticsApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await client.get('/admin/analytics/dashboard');
    return response.data;
  },

  getRevenueData: async (period: 'week' | 'month' | 'year'): Promise<RevenueData[]> => {
    const response = await client.get('/admin/analytics/revenue', { params: { period } });
    return response.data;
  },

  getTopServices: async (limit: number = 10): Promise<TopService[]> => {
    const response = await client.get('/admin/analytics/services/top', { params: { limit } });
    return response.data;
  },

  getJobsAnalytics: async (period: 'week' | 'month' | 'year') => {
    const response = await client.get('/admin/analytics/jobs', { params: { period } });
    return response.data;
  },

  getCustomerAnalytics: async (): Promise<CustomerAnalytics> => {
    const response = await client.get('/admin/analytics/customers');
    return response.data;
  },
};

export default analyticsApi;
