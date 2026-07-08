import { Service, Plan, Permission, EmailTemplate } from "@/types";

export const DEFAULT_SERVICES: Omit<
  Service,
  "id" | "userId" | "shopId" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Aadhaar Update",
    description: "Aadhaar card update and correction services",
    defaultPrice: 50,
    requiredDocuments: ["aadhaar", "photo"],
    status: "active",
    isDefault: true,
  },
  {
    name: "PAN Card",
    description: "New PAN card application and corrections",
    defaultPrice: 107,
    requiredDocuments: ["aadhaar", "photo", "signature"],
    status: "active",
    isDefault: true,
  },
  {
    name: "Income Certificate",
    description: "Income certificate application",
    defaultPrice: 30,
    requiredDocuments: ["aadhaar", "photo"],
    status: "active",
    isDefault: true,
  },
  {
    name: "Caste Certificate",
    description: "Caste certificate application",
    defaultPrice: 30,
    requiredDocuments: ["aadhaar", "photo"],
    status: "active",
    isDefault: true,
  },
  {
    name: "Domicile Certificate",
    description: "Domicile / residence certificate",
    defaultPrice: 30,
    requiredDocuments: ["aadhaar", "photo"],
    status: "active",
    isDefault: true,
  },
  {
    name: "Ayushman Card",
    description: "Ayushman Bharat health card registration",
    defaultPrice: 0,
    requiredDocuments: ["aadhaar", "photo"],
    status: "active",
    isDefault: true,
  },
  {
    name: "Bill Payment",
    description: "Utility and bill payment services",
    defaultPrice: 10,
    requiredDocuments: [],
    status: "active",
    isDefault: true,
  },
  {
    name: "Insurance",
    description: "Insurance policy services",
    defaultPrice: 100,
    requiredDocuments: ["aadhaar", "photo"],
    status: "active",
    isDefault: true,
  },
  {
    name: "Banking Service",
    description: "Banking and financial services",
    defaultPrice: 50,
    requiredDocuments: ["aadhaar", "photo", "signature"],
    status: "active",
    isDefault: true,
  },
  {
    name: "Travel Booking",
    description: "Train, bus and travel ticket booking",
    defaultPrice: 20,
    requiredDocuments: ["aadhaar"],
    status: "active",
    isDefault: true,
  },
];

export const APPLICATION_STATUSES = [
  { value: "pending", label: "Pending", color: "orange" },
  { value: "submitted", label: "Submitted", color: "blue" },
  { value: "in_progress", label: "In Progress", color: "purple" },
  { value: "completed", label: "Completed", color: "green" },
  { value: "rejected", label: "Rejected", color: "red" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "razorpay", label: "Razorpay" },
  { value: "bank_transfer", label: "Bank Transfer" },
] as const;

export const DOCUMENT_TYPES = [
  { value: "aadhaar", label: "Aadhaar Card" },
  { value: "pan", label: "PAN Card" },
  { value: "photo", label: "Photo" },
  { value: "signature", label: "Signature" },
  { value: "form_pdf", label: "Form PDF" },
  { value: "other", label: "Other" },
] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
];

export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ITEMS_PER_PAGE = 10;

export const ALL_PERMISSIONS: { value: Permission; label: string; group: string }[] = [
  { value: "customers_view", label: "View Customers", group: "Customers" },
  { value: "customers_create", label: "Create Customers", group: "Customers" },
  { value: "customers_edit", label: "Edit Customers", group: "Customers" },
  { value: "customers_delete", label: "Delete Customers", group: "Customers" },
  { value: "applications_view", label: "View Applications", group: "Applications" },
  { value: "applications_create", label: "Create Applications", group: "Applications" },
  { value: "applications_edit", label: "Edit Applications", group: "Applications" },
  { value: "payments_view", label: "View Payments", group: "Payments" },
  { value: "payments_create", label: "Create Payments", group: "Payments" },
  { value: "reports_view", label: "View Reports", group: "Reports" },
  { value: "documents_view", label: "View Documents", group: "Documents" },
  { value: "documents_upload", label: "Upload Documents", group: "Documents" },
];

export const STAFF_ROLES = [
  { value: "manager", label: "Manager" },
  { value: "operator", label: "Operator" },
  { value: "accountant", label: "Accountant" },
] as const;

export const DEFAULT_PLANS: Omit<Plan, "id" | "userId" | "shopId" | "createdAt" | "updatedAt">[] = [
  {
    name: "Free Trial",
    slug: "free-trial",
    monthlyPrice: 0,
    yearlyPrice: 0,
    customerLimit: 25,
    applicationLimit: 50,
    storageLimitMB: 100,
    staffLimit: 1,
    features: ["Basic dashboard", "Customer management", "25 customers", "50 applications"],
    status: "active",
    isTrial: true,
    trialDays: 14,
  },
  {
    name: "Basic",
    slug: "basic",
    monthlyPrice: 499,
    yearlyPrice: 4990,
    customerLimit: 100,
    applicationLimit: 200,
    storageLimitMB: 500,
    staffLimit: 2,
    features: ["All Basic features", "Email notifications", "2 staff users", "Reports"],
    status: "active",
  },
  {
    name: "Pro",
    slug: "pro",
    monthlyPrice: 999,
    yearlyPrice: 9990,
    customerLimit: 500,
    applicationLimit: 1000,
    storageLimitMB: 2048,
    staffLimit: 5,
    features: ["All Pro features", "WhatsApp/SMS ready", "5 staff users", "Advanced reports", "Reminders"],
    status: "active",
  },
  {
    name: "Premium",
    slug: "premium",
    monthlyPrice: 1999,
    yearlyPrice: 19990,
    customerLimit: -1,
    applicationLimit: -1,
    storageLimitMB: 10240,
    staffLimit: 15,
    features: ["Unlimited customers & applications", "15 staff users", "Priority support", "Custom receipt", "All features"],
    status: "active",
  },
];

export const REMINDER_TYPES = [
  { value: "follow_up", label: "Follow-up" },
  { value: "payment_due", label: "Payment Due" },
  { value: "document_missing", label: "Document Missing" },
  { value: "application_status", label: "Application Status" },
] as const;

export const DEFAULT_EMAIL_TEMPLATES: Omit<EmailTemplate, "id">[] = [
  { event: "application_created", subject: "Application Submitted - {{applicationRef}}", body: "Dear {{customerName}}, your application for {{serviceName}} has been submitted successfully." },
  { event: "application_status_changed", subject: "Application Status Updated - {{applicationRef}}", body: "Dear {{customerName}}, your application status is now: {{status}}." },
  { event: "payment_received", subject: "Payment Receipt - {{receiptNumber}}", body: "Dear {{customerName}}, we received your payment of {{amount}} for {{serviceName}}." },
  { event: "payment_pending", subject: "Payment Reminder - {{applicationRef}}", body: "Dear {{customerName}}, a payment of {{amount}} is pending for {{serviceName}}." },
  { event: "document_missing", subject: "Documents Required - {{applicationRef}}", body: "Dear {{customerName}}, please submit missing documents for your application." },
  { event: "subscription_expiring", subject: "Subscription Expiring Soon", body: "Your {{planName}} plan expires on {{expiryDate}}. Please renew to continue." },
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  manager: ALL_PERMISSIONS.map((p) => p.value),
  operator: ["customers_view", "customers_create", "applications_view", "applications_create", "documents_view", "documents_upload"],
  accountant: ["customers_view", "applications_view", "payments_view", "payments_create", "reports_view", "documents_view"],
};

// Phase 3
export const EXPENSE_CATEGORIES = [
  { value: "office_rent", label: "Office Rent" },
  { value: "electricity", label: "Electricity" },
  { value: "internet", label: "Internet" },
  { value: "salary", label: "Salary" },
  { value: "maintenance", label: "Maintenance" },
  { value: "travel", label: "Travel" },
  { value: "miscellaneous", label: "Miscellaneous" },
] as const;

export const INVENTORY_CATEGORIES = [
  "Printer", "Paper", "Biometric Device", "Scanner", "Laptop",
  "Camera", "Webcam", "Finger Scanner", "Stationery", "Other",
];

export const TICKET_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

export const TICKET_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

export const APPOINTMENT_STATUSES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
] as const;

export const LEAD_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
] as const;

export const CUSTOMER_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "vip", label: "VIP" },
] as const;

export const AI_SUGGESTED_QUESTIONS = [
  "How many applications completed today?",
  "Who has pending payment?",
  "Which customer needs follow-up?",
  "Which service gives highest income?",
  "Today's earnings?",
  "Monthly report summary?",
  "Pending documents?",
  "Subscription expiry status?",
];

export const BACKUP_COLLECTIONS = [
  "customers", "services", "applications", "documents",
  "payments", "receipts", "expenses", "inventory",
  "attendance", "tickets", "appointments", "reminders",
  "staff", "notifications", "crmActivities",
];

export const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
  const hour = 9 + Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  const h = hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return { value: `${String(hour).padStart(2, "0")}:${min}`, label: `${displayHour}:${min} ${ampm}` };
});

export const MARKETING_TEMPLATES = [
  { name: "Festival Greeting", category: "festival", subject: "Happy {{festival}}!", body: "Dear {{customerName}}, wishing you and your family a wonderful {{festival}}!" },
  { name: "Birthday Wish", category: "birthday", subject: "Happy Birthday!", body: "Dear {{customerName}}, wishing you a very Happy Birthday!" },
  { name: "Service Promotion", category: "promotional", subject: "Special Offer", body: "Dear {{customerName}}, avail our services at special rates this month!" },
];
