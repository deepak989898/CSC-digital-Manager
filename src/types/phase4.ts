import { BaseRecord } from "./index";

// ─── Feature flags ───────────────────────────────────────────────
export type Phase4Feature =
  | "ocr"
  | "scanner"
  | "autoFormFill"
  | "gstInvoice"
  | "eSign"
  | "whiteLabel"
  | "smartReminders"
  | "offlineSync";

export interface FeatureFlags extends BaseRecord {
  ocrEnabled: boolean;
  scannerEnabled: boolean;
  autoFormFillEnabled: boolean;
  gstInvoiceEnabled: boolean;
  eSignEnabled: boolean;
  whiteLabelEnabled: boolean;
  smartRemindersEnabled: boolean;
  offlineSyncEnabled: boolean;
}

export interface PlanFeatures {
  planId: string;
  features: Partial<Record<Phase4Feature, boolean>>;
}

export interface UsageMetrics extends BaseRecord {
  ocrCount: number;
  storageBytes: number;
  invoiceCount: number;
  eSignCount: number;
  syncFailures: number;
  period: string; // YYYY-MM
}

// ─── OCR ───────────────────────────────────────────────────────
export type OcrDocumentType =
  | "aadhaar"
  | "pan"
  | "voter_id"
  | "driving_license"
  | "passport"
  | "marksheet"
  | "income_certificate"
  | "caste_certificate"
  | "domicile_certificate"
  | "bank_passbook"
  | "electricity_bill"
  | "other";

export type OcrProvider = "manual" | "google_vision" | "openai_vision" | "azure";

export type OcrStatus = "pending" | "processing" | "review" | "approved" | "rejected" | "failed";

export interface OcrField {
  key: string;
  label: string;
  value: string;
  maskedValue?: string;
  confidence: number;
  isSensitive?: boolean;
  autoFilled?: boolean;
}

export interface OcrDocument extends BaseRecord {
  customerId?: string;
  customerName?: string;
  applicationId?: string;
  documentType: OcrDocumentType;
  fileName: string;
  fileURL: string;
  fileSize: number;
  mimeType: string;
  provider: OcrProvider;
  status: OcrStatus;
  consentAccepted: boolean;
  disclaimerAccepted: boolean;
  uploadedByName: string;
}

export interface OcrResult extends BaseRecord {
  ocrDocumentId: string;
  documentType: OcrDocumentType;
  fields: OcrField[];
  rawText?: string;
  provider: OcrProvider;
  overallConfidence: number;
  approved: boolean;
  approvedByName?: string;
  approvedAt?: string;
  customerId?: string;
  applicationId?: string;
}

export interface OcrTemplate extends BaseRecord {
  documentType: OcrDocumentType;
  name: string;
  fieldKeys: string[];
  isActive: boolean;
}

// ─── Form templates & auto-fill ────────────────────────────────
export interface FormFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  required: boolean;
  ocrMapping?: string;
  options?: string[];
}

export interface FormTemplate extends BaseRecord {
  serviceId?: string;
  serviceName?: string;
  name: string;
  fields: FormFieldDef[];
  requiredDocuments: OcrDocumentType[];
  isActive: boolean;
}

export interface FieldMapping extends BaseRecord {
  formTemplateId: string;
  ocrDocumentType: OcrDocumentType;
  mappings: { formField: string; ocrField: string }[];
}

export interface FormSubmission extends BaseRecord {
  formTemplateId: string;
  customerId?: string;
  applicationId?: string;
  data: Record<string, string>;
  autoFilledFields: string[];
  confidenceScores: Record<string, number>;
  status: "draft" | "submitted" | "approved";
  submittedByName: string;
}

// ─── Scanner ───────────────────────────────────────────────────
export interface ScannedPage extends BaseRecord {
  customerId?: string;
  applicationId?: string;
  pageNumber: number;
  fileName: string;
  fileURL: string;
  mimeType: string;
  qualityWarnings: string[];
  cropped: boolean;
}

// ─── GST Invoices ──────────────────────────────────────────────
export type InvoiceType = "gst" | "non_gst" | "tax" | "proforma" | "credit_note";
export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";

export interface GstSettings extends BaseRecord {
  gstin?: string;
  legalName: string;
  billingAddress: string;
  state: string;
  stateCode: string;
  invoicePrefix: string;
  invoiceTerms?: string;
  invoiceFooter?: string;
  logoURL?: string;
  signatureURL?: string;
  gstEnabled: boolean;
  defaultCgstRate: number;
  defaultSgstRate: number;
  defaultIgstRate: number;
}

export interface InvoiceItem {
  name: string;
  hsnSac?: string;
  quantity: number;
  rate: number;
  discount: number;
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
}

export interface Invoice extends BaseRecord {
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  customerId?: string;
  customerName: string;
  customerMobile: string;
  customerGstin?: string;
  customerState?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  paymentStatus: "unpaid" | "partial" | "paid";
  amountPaid: number;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  applicationId?: string;
  isInterState: boolean;
}

// ─── eSign ─────────────────────────────────────────────────────
export type ESignProvider = "leegality" | "zoho_sign" | "docusign" | "aadhaar_esign" | "manual";
export type ESignStatus = "draft" | "sent" | "viewed" | "signed" | "declined" | "expired";

export interface ESignProviderConfig extends BaseRecord {
  provider: ESignProvider;
  apiKey?: string;
  webhookSecret?: string;
  isActive: boolean;
  isConfigured: boolean;
}

export interface ESignRequest extends BaseRecord {
  customerId: string;
  customerName: string;
  documentName: string;
  documentURL: string;
  signerName: string;
  signerEmail?: string;
  signerMobile?: string;
  provider: ESignProvider;
  status: ESignStatus;
  consentAccepted: boolean;
  signedDocumentURL?: string;
  sentAt?: string;
  signedAt?: string;
  expiresAt?: string;
  applicationId?: string;
}

export interface ESignAuditLog extends BaseRecord {
  eSignRequestId: string;
  action: string;
  details: string;
  performedByName: string;
}

// ─── White-label / branding ────────────────────────────────────
export interface BrandingSettings extends BaseRecord {
  brandName: string;
  logoURL?: string;
  faviconURL?: string;
  primaryColor: string;
  secondaryColor: string;
  theme: "light" | "dark" | "system";
  invoiceFooter?: string;
  loginTagline?: string;
  emailSenderName?: string;
  footerText?: string;
  isEnabled: boolean;
}

export interface CustomDomain extends BaseRecord {
  domain: string;
  verificationStatus: "pending" | "verified" | "failed";
  dnsRecords?: string;
  verifiedAt?: string;
}

// ─── Automation & smart reminders ──────────────────────────────
export type AutomationTrigger =
  | "payment_pending"
  | "application_stale"
  | "subscription_expiring"
  | "document_missing"
  | "invoice_due"
  | "customer_birthday"
  | "esign_pending"
  | "staff_task";

export interface AutomationRule extends BaseRecord {
  name: string;
  trigger: AutomationTrigger;
  delayDays: number;
  isActive: boolean;
  notifyInApp: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyWhatsapp: boolean;
  templateTitle: string;
  templateBody: string;
  priority: "low" | "medium" | "high";
}

export interface ReminderLog extends BaseRecord {
  reminderId: string;
  channel: "in_app" | "email" | "sms" | "whatsapp";
  status: "sent" | "failed" | "snoozed";
  message: string;
}

export interface NotificationQueueItem extends BaseRecord {
  channel: "in_app" | "email" | "sms" | "whatsapp";
  recipient: string;
  title: string;
  body: string;
  status: "pending" | "sent" | "failed";
  scheduledAt: string;
  sentAt?: string;
  error?: string;
}

// ─── Offline sync ────────────────────────────────────────────────
export type SyncStatus = "pending" | "syncing" | "synced" | "failed" | "conflict";

export interface SyncQueueItem extends BaseRecord {
  collection: string;
  operation: "create" | "update" | "delete";
  payload: Record<string, unknown>;
  localId: string;
  status: SyncStatus;
  retryCount: number;
  error?: string;
  syncedAt?: string;
}

export interface SyncLog extends BaseRecord {
  action: string;
  status: SyncStatus;
  details: string;
  itemCount: number;
}

export interface ConflictLog extends BaseRecord {
  collection: string;
  documentId: string;
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  resolution: "local" | "server" | "pending";
}
