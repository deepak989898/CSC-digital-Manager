import { BaseRecord } from "./index";

export type StaffRole = "manager" | "operator" | "accountant";
export type Permission =
  | "customers_view"
  | "customers_create"
  | "customers_edit"
  | "customers_delete"
  | "applications_view"
  | "applications_create"
  | "applications_edit"
  | "payments_view"
  | "payments_create"
  | "reports_view"
  | "documents_view"
  | "documents_upload";

export type SubscriptionStatus = "active" | "expired" | "trial" | "cancelled" | "suspended";
export type BillingCycle = "monthly" | "yearly";
export type ReminderType =
  | "follow_up"
  | "payment_due"
  | "document_missing"
  | "application_status";
export type ReminderStatus = "pending" | "completed" | "cancelled";
export type NotificationChannel = "in_app" | "email" | "sms" | "whatsapp";
export type NotificationEvent =
  | "application_created"
  | "application_status_changed"
  | "payment_received"
  | "payment_pending"
  | "document_missing"
  | "subscription_expiring"
  | "subscription_expired"
  | "announcement";

export type DocumentVerificationStatus = "pending" | "verified" | "rejected";

export interface Plan extends BaseRecord {
  name: string;
  slug: string;
  monthlyPrice: number;
  yearlyPrice: number;
  customerLimit: number;
  applicationLimit: number;
  storageLimitMB: number;
  staffLimit: number;
  features: string[];
  status: "active" | "inactive";
  isTrial?: boolean;
  trialDays?: number;
}

export interface Subscription extends BaseRecord {
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  expiryDate: string;
  amount: number;
  transactionId?: string;
  autoRenew: boolean;
}

export interface StaffMember extends BaseRecord {
  name: string;
  email: string;
  mobile: string;
  role: StaffRole;
  permissions: Permission[];
  status: "invited" | "active" | "inactive";
  linkedUserId?: string;
}

export interface Notification extends BaseRecord {
  title: string;
  message: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  read: boolean;
  link?: string;
  metadata?: Record<string, string>;
}

export interface Reminder extends BaseRecord {
  customerId: string;
  customerName: string;
  applicationId?: string;
  applicationRef?: string;
  type: ReminderType;
  reminderDate: string;
  message: string;
  status: ReminderStatus;
  staffId?: string;
  staffName?: string;
}

export interface NotificationSettings extends BaseRecord {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  inAppEnabled: boolean;
  events: Partial<Record<NotificationEvent, NotificationChannel[]>>;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  emailFrom?: string;
  whatsappApiKey?: string;
  smsApiKey?: string;
}

export interface ReceiptSettings extends BaseRecord {
  showLogo: boolean;
  termsAndConditions: string;
  gstNumber?: string;
  signatureURL?: string;
  footerText: string;
}

export interface Announcement extends BaseRecord {
  title: string;
  message: string;
  target: "all" | "active" | "trial" | "expired";
  status: "draft" | "sent";
  sentAt?: string;
}

export interface UsageLog extends BaseRecord {
  customers: number;
  applications: number;
  storageMB: number;
  staff: number;
  period: string;
}

export interface PlanUsage {
  customers: { used: number; limit: number };
  applications: { used: number; limit: number };
  storageMB: { used: number; limit: number };
  staff: { used: number; limit: number };
}

export interface EmailTemplate {
  id: string;
  event: NotificationEvent;
  subject: string;
  body: string;
}
