import client from '../client';
import type { Job, JobTask, JobPart, JobLabor, JobNote, JobFile, PaginatedResponse, JobStatus, Priority } from '@/types';

export interface JobFilters {
  search?: string;
  status?: JobStatus;
  priority?: Priority;
  customerId?: number;
  technicianId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateJobData {
  customerId: number;
  vehicleId?: number;
  quoteId?: number;
  title: string;
  description?: string;
  priority?: Priority;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
  assignedTechnicianId?: number;
  assignedBay?: string;
  quotedAmount?: number;
}

export interface CreateTaskData {
  serviceTypeId?: number;
  title: string;
  description?: string;
  estimatedHours?: number;
  assignedTo?: number;
}

export interface CreatePartData {
  partNumber?: string;
  description: string;
  quantity: number;
  unitCost?: number;
  unitPrice?: number;
  source?: 'inventory' | 'ordered' | 'customer_supplied';
}

export interface CreateLaborData {
  taskId?: number;
  employeeId: number;
  description?: string;
  hours: number;
  hourlyRate: number;
  laborType?: 'regular' | 'overtime' | 'warranty';
  isBillable?: boolean;
  performedDate: string;
}

export interface CreateNoteData {
  noteType: 'internal' | 'customer_visible' | 'issue' | 'resolution';
  content: string;
}

export const jobsApi = {
  // Jobs
  getJobs: async (filters: JobFilters = {}): Promise<PaginatedResponse<Job>> => {
    const response = await client.get('/admin/jobs', { params: filters });
    return response.data;
  },

  getJobById: async (id: number): Promise<Job> => {
    const response = await client.get(`/admin/jobs/${id}`);
    return response.data;
  },

  createJob: async (data: CreateJobData): Promise<Job> => {
    const response = await client.post('/admin/jobs', data);
    return response.data;
  },

  updateJob: async (id: number, data: Partial<CreateJobData>): Promise<Job> => {
    const response = await client.put(`/admin/jobs/${id}`, data);
    return response.data;
  },

  updateJobStatus: async (id: number, status: JobStatus): Promise<Job> => {
    const response = await client.patch(`/admin/jobs/${id}/status`, { status });
    return response.data;
  },

  deleteJob: async (id: number): Promise<void> => {
    await client.delete(`/admin/jobs/${id}`);
  },

  // Tasks
  addTask: async (jobId: number, data: CreateTaskData): Promise<JobTask> => {
    const response = await client.post(`/admin/jobs/${jobId}/tasks`, data);
    return response.data;
  },

  updateTask: async (jobId: number, taskId: number, data: Partial<CreateTaskData>): Promise<JobTask> => {
    const response = await client.put(`/admin/jobs/${jobId}/tasks/${taskId}`, data);
    return response.data;
  },

  updateTaskStatus: async (jobId: number, taskId: number, status: string): Promise<JobTask> => {
    const response = await client.patch(`/admin/jobs/${jobId}/tasks/${taskId}/status`, { status });
    return response.data;
  },

  deleteTask: async (jobId: number, taskId: number): Promise<void> => {
    await client.delete(`/admin/jobs/${jobId}/tasks/${taskId}`);
  },

  // Parts
  addPart: async (jobId: number, data: CreatePartData): Promise<JobPart> => {
    const response = await client.post(`/admin/jobs/${jobId}/parts`, data);
    return response.data;
  },

  updatePart: async (jobId: number, partId: number, data: Partial<CreatePartData>): Promise<JobPart> => {
    const response = await client.put(`/admin/jobs/${jobId}/parts/${partId}`, data);
    return response.data;
  },

  updatePartStatus: async (jobId: number, partId: number, status: string): Promise<JobPart> => {
    const response = await client.patch(`/admin/jobs/${jobId}/parts/${partId}/status`, { status });
    return response.data;
  },

  deletePart: async (jobId: number, partId: number): Promise<void> => {
    await client.delete(`/admin/jobs/${jobId}/parts/${partId}`);
  },

  // Labor
  addLabor: async (jobId: number, data: CreateLaborData): Promise<JobLabor> => {
    const response = await client.post(`/admin/jobs/${jobId}/labor`, data);
    return response.data;
  },

  updateLabor: async (jobId: number, laborId: number, data: Partial<CreateLaborData>): Promise<JobLabor> => {
    const response = await client.put(`/admin/jobs/${jobId}/labor/${laborId}`, data);
    return response.data;
  },

  deleteLabor: async (jobId: number, laborId: number): Promise<void> => {
    await client.delete(`/admin/jobs/${jobId}/labor/${laborId}`);
  },

  // Notes
  addNote: async (jobId: number, data: CreateNoteData): Promise<JobNote> => {
    const response = await client.post(`/admin/jobs/${jobId}/notes`, data);
    return response.data;
  },

  deleteNote: async (jobId: number, noteId: number): Promise<void> => {
    await client.delete(`/admin/jobs/${jobId}/notes/${noteId}`);
  },

  // Files
  uploadFile: async (jobId: number, file: File, category?: string, taskId?: number): Promise<JobFile> => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) formData.append('category', category);
    if (taskId) formData.append('taskId', taskId.toString());

    const response = await client.post(`/admin/jobs/${jobId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteFile: async (jobId: number, fileId: number): Promise<void> => {
    await client.delete(`/admin/jobs/${jobId}/files/${fileId}`);
  },
};

export default jobsApi;
