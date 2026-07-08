import { BaseRecord } from "./index";

export type ExpenseCategory =
  | "office_rent"
  | "electricity"
  | "internet"
  | "salary"
  | "maintenance"
  | "travel"
  | "miscellaneous";

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type CustomerPriority = "low" | "medium" | "high" | "vip";
export type AttendanceStatus = "checked_in" | "checked_out" | "on_leave";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type MarketingChannel = "email" | "sms" | "whatsapp";
export type CampaignStatus = "draft" | "scheduled" | "sent" | "failed";
export type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "payment" | "status_change" | "export" | "backup";
export type BackupStatus = "completed" | "failed" | "in_progress";

export interface Expense extends BaseRecord {
  amount: number;
  category: ExpenseCategory;
  vendor: string;
  billURL?: string;
  notes?: string;
  paymentMethod: string;
  expenseDate: string;
}

export interface InventoryItem extends BaseRecord {
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  purchaseDate: string;
  warrantyExpiry?: string;
  supplier: string;
  notes?: string;
  unitPrice?: number;
}

export interface Attendance extends BaseRecord {
  staffId: string;
  staffName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  status: AttendanceStatus;
  notes?: string;
}

export interface LeaveRequest extends BaseRecord {
  staffId: string;
  staffName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
}

export interface Ticket extends BaseRecord {
  customerId?: string;
  customerName: string;
  subject: string;
  description: string;
  issueType: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  internalNotes?: string;
  resolution?: string;
  resolvedAt?: string;
}

export interface Appointment extends BaseRecord {
  customerId: string;
  customerName: string;
  serviceId?: string;
  serviceName: string;
  staffId?: string;
  staffName?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
}

export interface CrmActivity extends BaseRecord {
  customerId: string;
  customerName: string;
  type: "note" | "call" | "email" | "follow_up" | "application" | "payment" | "document" | "status_change";
  title: string;
  description: string;
  metadata?: Record<string, string>;
  createdByName: string;
}

export interface CrmNote extends BaseRecord {
  customerId: string;
  content: string;
  createdByName: string;
}

export interface MarketingCampaign extends BaseRecord {
  name: string;
  channel: MarketingChannel;
  templateId?: string;
  subject?: string;
  message: string;
  targetType: "all_customers" | "selected" | "birthday" | "festival";
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
}

export interface AuditLog extends BaseRecord {
  action: AuditAction;
  entity: string;
  entityId: string;
  entityName: string;
  userName: string;
  userEmail: string;
  details?: string;
  ipAddress?: string;
}

export interface BackupRecord extends BaseRecord {
  type: "manual" | "auto";
  status: BackupStatus;
  collections: string[];
  recordCount: number;
  fileSize?: number;
  downloadURL?: string;
}

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AiChat extends BaseRecord {
  title: string;
  messages: AiChatMessage[];
}

export interface AppSettings extends BaseRecord {
  companyLogo?: string;
  theme: "light" | "dark" | "system";
  language: string;
  currency: string;
  timezone: string;
  invoicePrefix: string;
  receiptFooter: string;
  featureToggles?: Record<string, boolean>;
}

export interface MarketingTemplate extends BaseRecord {
  name: string;
  channel: MarketingChannel;
  subject?: string;
  body: string;
  category: "festival" | "birthday" | "promotional" | "general";
}

// Extended customer CRM fields (stored on Customer document)
export interface CustomerCrmFields {
  tags?: string[];
  priority?: CustomerPriority;
  leadStatus?: LeadStatus;
  birthday?: string;
  customFields?: Record<string, string>;
}

export interface SmartDashboardData {
  todayEarnings: number;
  monthlyEarnings: number;
  lastMonthEarnings: number;
  pendingPayments: number;
  todayApplications: number;
  customerGrowth: number;
  topServices: { name: string; revenue: number; count: number }[];
  staffPerformance: { name: string; applications: number; payments: number }[];
  recentActivities: { type: string; description: string; time: string }[];
}
