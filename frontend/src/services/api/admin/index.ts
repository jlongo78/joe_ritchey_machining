export { default as analyticsApi } from './analytics';
export { default as customersApi } from './customers';
export { default as jobsApi } from './jobs';
export { default as quotesApi } from './quotes';
export { default as invoicesApi } from './invoices';
export { default as scheduleApi } from './schedule';
export { default as communicationsApi } from './communications';
export { default as usersApi } from './users';

// Re-export types
export type { DashboardStats, RevenueData, TopService, CustomerAnalytics } from './analytics';
export type { CustomerFilters, CreateCustomerData, CreateVehicleData } from './customers';
export type { JobFilters, CreateJobData, CreateTaskData, CreatePartData, CreateLaborData, CreateNoteData } from './jobs';
export type { QuoteFilters, CreateQuoteData, CreateQuoteItemData } from './quotes';
export type { InvoiceFilters, CreateInvoiceData, CreateInvoiceItemData, RecordPaymentData } from './invoices';
export type { ScheduleEvent, ScheduleFilters, CreateEventData, UpdateEventData, Bay, Technician } from './schedule';
export type { Message, MessageFilters, SendEmailData, SendSmsData, LogPhoneCallData, Template, CreateTemplateData } from './communications';
export type { AdminUser, UserFilters, CreateUserData, UpdateUserData } from './users';
