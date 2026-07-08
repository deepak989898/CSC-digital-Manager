export type UserRole = "super_admin" | "shop_owner" | "manager" | "operator" | "accountant";

export type ApplicationStatus =
  | "pending"
  | "submitted"
  | "in_progress"
  | "completed"
  | "rejected";

export type PaymentStatus = "unpaid" | "partial" | "paid";
export type PaymentMethod = "cash" | "upi" | "razorpay" | "bank_transfer";
export type DocumentType =
  | "aadhaar"
  | "pan"
  | "photo"
  | "signature"
  | "form_pdf"
  | "other";

export interface BaseRecord {
  id: string;
  userId: string;
  shopId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends BaseRecord {
  email: string;
  role: UserRole;
  displayName: string;
  photoURL?: string;
  isActive: boolean;
  profileComplete: boolean;
  isStaff?: boolean;
  permissions?: string[];
  staffId?: string;
}

export interface Shop extends BaseRecord {
  shopName: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  cscId?: string;
  photoURL?: string;
  isActive: boolean;
}

export interface Customer extends BaseRecord {
  fullName: string;
  mobile: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  aadhaarLast4: string;
  notes?: string;
  tags?: string[];
  priority?: "low" | "medium" | "high" | "vip";
  leadStatus?: "new" | "contacted" | "qualified" | "converted" | "lost";
  birthday?: string;
  customFields?: Record<string, string>;
}

export interface Service extends BaseRecord {
  name: string;
  description: string;
  defaultPrice: number;
  requiredDocuments: string[];
  status: "active" | "inactive";
  isDefault: boolean;
}

export interface Application extends BaseRecord {
  referenceNumber: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  status: ApplicationStatus;
  applicationFee: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  dueDate?: string;
  /** Who last updated / completed this work */
  completedById?: string;
  completedByName?: string;
  completedAt?: string;
  lastUpdatedById?: string;
  lastUpdatedByName?: string;
}

export interface DocumentRecord extends BaseRecord {
  /** Optional — customer KYC docs may not belong to an application */
  applicationId?: string;
  customerId: string;
  customerName: string;
  name: string;
  type: DocumentType;
  category?: string;
  customName?: string;
  fileName: string;
  fileURL: string;
  fileSize: number;
  mimeType: string;
  isMissing?: boolean;
  verificationStatus?: "pending" | "verified" | "rejected";
  notes?: string;
  uploadedByName?: string;
}

export interface Payment extends BaseRecord {
  customerId: string;
  customerName: string;
  applicationId: string;
  applicationRef: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  notes?: string;
  paymentDate: string;
}

export interface Receipt extends BaseRecord {
  receiptNumber: string;
  customerId: string;
  customerName: string;
  applicationId: string;
  applicationRef: string;
  serviceName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId: string;
  shopName: string;
  ownerName: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalApplications: number;
  pendingApplications: number;
  completedApplications: number;
  rejectedApplications: number;
  totalEarnings: number;
  pendingPayments: number;
  todayEarnings: number;
}

export interface PlatformStats {
  totalShops: number;
  activeShops: number;
  totalCustomers: number;
  totalApplications: number;
  totalPayments: number;
  totalEarnings: number;
  trialShops?: number;
  expiredShops?: number;
  subscriptionRevenue?: number;
}

export * from "./phase2";
export * from "./phase3";
