import client from '../client';

export interface ScheduleEvent {
  id: number;
  title: string;
  jobId?: number;
  jobNumber?: string;
  customerId?: number;
  customerName?: string;
  type: 'job' | 'appointment' | 'reminder' | 'blocked';
  start: string;
  end: string;
  allDay?: boolean;
  bay?: string;
  technicianId?: number;
  technicianName?: string;
  status?: string;
  color?: string;
  notes?: string;
}

export interface ScheduleFilters {
  startDate: string;
  endDate: string;
  technicianId?: number;
  bay?: string;
  type?: 'job' | 'appointment' | 'reminder' | 'blocked';
}

export interface CreateEventData {
  title: string;
  type: 'appointment' | 'reminder' | 'blocked';
  start: string;
  end: string;
  allDay?: boolean;
  customerId?: number;
  bay?: string;
  technicianId?: number;
  notes?: string;
}

export interface UpdateEventData {
  title?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  bay?: string;
  technicianId?: number;
  notes?: string;
}

export interface Bay {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Technician {
  id: number;
  name: string;
  color: string;
  isActive: boolean;
}

export const scheduleApi = {
  getEvents: async (filters: ScheduleFilters): Promise<ScheduleEvent[]> => {
    const response = await client.get('/admin/schedule/events', { params: filters });
    return response.data;
  },

  createEvent: async (data: CreateEventData): Promise<ScheduleEvent> => {
    const response = await client.post('/admin/schedule/events', data);
    return response.data;
  },

  updateEvent: async (id: number, data: UpdateEventData): Promise<ScheduleEvent> => {
    const response = await client.put(`/admin/schedule/events/${id}`, data);
    return response.data;
  },

  deleteEvent: async (id: number): Promise<void> => {
    await client.delete(`/admin/schedule/events/${id}`);
  },

  // Reschedule a job
  rescheduleJob: async (jobId: number, start: string, end: string, bay?: string): Promise<ScheduleEvent> => {
    const response = await client.patch(`/admin/schedule/jobs/${jobId}/reschedule`, {
      start,
      end,
      bay,
    });
    return response.data;
  },

  // Resources (bays and technicians)
  getBays: async (): Promise<Bay[]> => {
    const response = await client.get('/admin/schedule/bays');
    return response.data;
  },

  getTechnicians: async (): Promise<Technician[]> => {
    const response = await client.get('/admin/schedule/technicians');
    return response.data;
  },

  // Availability
  checkAvailability: async (start: string, end: string, bay?: string, technicianId?: number): Promise<{
    available: boolean;
    conflicts: ScheduleEvent[];
  }> => {
    const response = await client.get('/admin/schedule/availability', {
      params: { start, end, bay, technicianId },
    });
    return response.data;
  },
};

export default scheduleApi;
