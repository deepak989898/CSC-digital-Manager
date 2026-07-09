# CSC Digital Manager

A multi-tenant SaaS platform for CSC (Common Service Centre) shop owners. Manage customers, applications, payments, staff, subscriptions, and AI-powered business intelligence — all in one place.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Firebase Authentication, Firestore, Firebase Storage |
| Payments | Razorpay |
| Hosting | Vercel |

## Architecture

- **Multi-tenant:** Each shop is isolated by `shopId` (the shop owner's Firebase UID).
- **Every record** includes `userId`, `shopId`, `createdAt`, `updatedAt`.
- **Roles:** `super_admin`, `shop_owner`, `manager`, `operator`, `accountant`.
- **Super Admin** has platform-wide access; shop users only see their own data.

## Features

### Phase 1 — Core CMS
- Email/Password & Google authentication
- Customer, Service, Application CRUD
- Document upload (Firebase Storage)
- Payment management with Razorpay
- Printable receipts
- Reports with date filters
- Super Admin panel

### Phase 2 — SaaS Platform
- Subscription plans (Free Trial, Basic, Pro, Premium)
- Plan usage limits with upgrade prompts
- Staff management with role-based permissions
- Notifications & reminders
- Advanced reports
- Admin: plans, subscriptions, revenue, usage, announcements

### Phase 3 — AI Smart Business Platform
- **AI Assistant** — Firestore-powered Q&A with conversation history
- **Smart Dashboard** — Revenue, profit, growth, staff performance, quick actions
- **Customer CRM** — Timeline, tags, priority, lead status, notes, payment history
- **Appointments** — Calendar (day/week/month views), staff assignment
- **Expense Management** — Categories, vendor, bill upload, profit reports
- **Inventory** — Stock tracking, low-stock alerts, warranty
- **Staff Attendance** — Check-in/out, leave requests, working hours
- **Help Desk** — Ticket system with priority and assignment
- **Marketing** — Email campaigns, templates (SMS/WhatsApp ready)
- **Audit Logs** — Track all create/update/delete actions
- **Backup** — Manual JSON export of all shop data
- **App Settings** — Dark mode, language, currency, timezone, invoice settings
- **Super Admin Control Panel** — Platform stats, plan management, health status

### Phase 4 — AI Automation & Advanced SaaS
- **AI Document OCR** — Upload/camera scan, field extraction, review & approve, Aadhaar masking
- **Auto Form Filling** — OCR-to-form mapping with confidence scores and audit trail
- **Document Scanner** — Camera capture, quality warnings, compress, multi-format upload
- **GST Invoice System** — CGST/SGST/IGST, invoice builder, print/share, GST settings
- **eSign Workflow** — Provider-ready (Leegality, Zoho Sign, DocuSign, Aadhaar eSign)
- **White-Label Branding** — Logo, colors, theme, custom domain (Vercel-ready)
- **Smart Reminders & Automation** — Rules for payments, documents, invoices, subscriptions
- **Offline Sync / PWA** — Installable app, offline queue, sync status, network banner
- **Super Admin Feature Toggles** — Enable/disable Phase 4 modules per shop

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** → Email/Password and Google
3. Create **Firestore Database** (production mode)
4. Enable **Firebase Storage**
5. Copy web app config to `.env.local` (see `.env.example`)

### 3. Deploy Firebase Rules

```bash
npm install -g firebase-tools
firebase login
firebase init   # select Firestore + Storage
firebase deploy --only firestore:rules,storage
```

Rules are in `firebase/firestore.rules` and `firebase/storage.rules`.

### 4. Create Super Admin

After first signup, update the user document in Firestore:

```
users/{userId}
  role: "super_admin"
```

### 5. Razorpay Setup

1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env.local`
3. Add `FIREBASE_SERVICE_ACCOUNT_KEY` for server-side payment verification

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup, forgot password
│   ├── admin/               # Super Admin control panel
│   ├── ai-assistant/        # AI Business Assistant
│   ├── api/razorpay/        # Payment API routes
│   ├── appointments/        # Appointment booking
│   ├── applications/        # Application management
│   ├── automation/          # Smart automation rules
│   ├── esign/               # eSign requests
│   ├── invoices/            # GST invoices
│   ├── scanner/             # OCR document scanner
│   ├── sync-status/         # Offline sync status
│   ├── attendance/          # Staff attendance
│   ├── audit-logs/          # Audit trail
│   ├── backup/              # Data backup & export
│   ├── customers/           # Customer CRM
│   ├── dashboard/           # Smart dashboard
│   ├── documents/           # Document management
│   ├── expenses/            # Expense management
│   ├── inventory/           # Inventory tracking
│   ├── marketing/           # Marketing campaigns
│   ├── payments/            # Payment records
│   ├── receipts/            # Printable receipts
│   ├── reports/             # Reports & analytics
│   ├── settings/            # Profile, app, receipt, security
│   ├── staff/               # Staff management
│   ├── subscription/        # Plan & billing
│   └── tickets/             # Help desk
├── components/
│   ├── ai/                  # AI Assistant UI
│   ├── layout/              # Sidebar, DashboardLayout, SettingsNav
│   ├── subscription/        # Plan cards, upgrade modal
│   └── ui/                  # Reusable UI components
├── contexts/                # Auth, Theme
├── hooks/                   # useShopCollection, useDashboard, etc.
├── lib/
│   ├── firebase/            # Auth, Firestore, Storage
│   ├── ai-assistant.ts      # AI query engine (OpenAI-ready)
│   ├── audit.ts             # Audit logging
│   ├── backup.ts            # Backup export
│   ├── permissions.ts       # Role-based access
│   └── subscription.ts      # Plan limits
└── types/                   # TypeScript interfaces
firebase/
├── firestore.rules          # Firestore security rules
└── storage.rules            # Storage security rules
```

## Firestore Collections

| Collection | Scope | Description |
|-----------|-------|-------------|
| `users` | Platform | User profiles and roles |
| `shops` | Platform | Shop profiles |
| `plans` | Platform | Subscription plans |
| `subscriptions` | Per shop | Active subscriptions |
| `customers` | Per shop | Customer records + CRM fields |
| `services` | Per shop | CSC services |
| `applications` | Per shop | Service applications |
| `documents` | Per shop | Uploaded documents |
| `payments` | Per shop | Payment records |
| `receipts` | Per shop | Generated receipts |
| `staff` | Per shop | Staff members |
| `notifications` | Per shop | In-app notifications |
| `reminders` | Per shop | Follow-up reminders |
| `notificationSettings` | Per shop | Email/SMS config |
| `receiptSettings` | Per shop | Receipt customization |
| `announcements` | Platform | Super Admin announcements |
| `usageLogs` | Per shop | Plan usage tracking |
| `expenses` | Per shop | Business expenses |
| `inventory` | Per shop | Office inventory |
| `attendance` | Per shop | Staff check-in/out |
| `leaveRequests` | Per shop | Leave requests |
| `tickets` | Per shop | Help desk tickets |
| `appointments` | Per shop | Customer appointments |
| `crmActivities` | Per shop | CRM timeline events |
| `marketing` | Per shop | Marketing campaigns |
| `auditLogs` | Per shop | Action audit trail |
| `backup` | Per shop | Backup records |
| `aiChats` | Per shop | AI conversation history |
| `settings` | Per shop | App settings (theme, currency, etc.) |

### Phase 4 Collections

| Collection | Scope | Description |
|-----------|-------|-------------|
| `ocrDocuments` | Per shop | Uploaded documents for OCR |
| `ocrResults` | Per shop | Approved OCR field extractions |
| `ocrTemplates` | Per shop | Document type field templates |
| `formTemplates` | Per shop | Service form definitions |
| `formSubmissions` | Per shop | Submitted/auto-filled forms |
| `fieldMappings` | Per shop | OCR → form field mappings |
| `gstSettings` | Per shop | GSTIN, tax rates, invoice branding |
| `invoices` | Per shop | GST/tax invoices |
| `eSignRequests` | Per shop | Signature requests |
| `eSignAuditLogs` | Per shop | eSign audit trail |
| `eSignProviders` | Platform | eSign provider configuration |
| `brandingSettings` | Per shop | White-label branding |
| `customDomains` | Per shop | Custom domain requests |
| `automationRules` | Per shop | Smart reminder automation |
| `reminderLogs` | Per shop | Reminder delivery history |
| `notificationQueue` | Per shop | Pending email/SMS/WhatsApp |
| `syncQueue` | Per shop | Offline sync queue (Firestore) |
| `syncLogs` | Per shop | Sync history |
| `conflictLogs` | Per shop | Offline conflict resolution |
| `featureFlags` | Per shop | Phase 4 feature toggles (doc ID = shopId) |
| `planFeatures` | Platform | Plan-level feature flags |
| `usageMetrics` | Per shop | OCR/invoice/storage usage |

## OCR Provider Configuration

1. Add API keys to Vercel environment variables (see `.env.example`)
2. Shop users select provider in **Scanner → New Scan**
3. Without API keys, **Manual / Local Parser** works using pasted text + regex extraction
4. Supported providers: Google Vision, OpenAI Vision, Azure OCR

## eSign Provider Configuration

1. Super Admin → **eSign Settings** — save provider name and API key placeholders
2. Set `ESIGN_PROVIDER`, `ESIGN_API_KEY`, `ESIGN_WEBHOOK_SECRET` in Vercel
3. Shop users create requests at **eSign → New Request**
4. No forged signatures — workflow tracks draft → sent → signed with audit logs

## Firebase Storage Rules

- Shop files stored under `shops/{shopId}/...`
- Only authenticated shop members can read/write their shop paths
- Super Admin has full access
- Deploy: `firebase deploy --only storage`


All shop-scoped collections enforce:

- **Read:** User must belong to the shop (`shopId`) or be Super Admin
- **Create:** Active user with valid `userId` + `shopId` matching their profile
- **Update/Delete:** Shop owner, staff, or Super Admin with shop membership
- **Plans & Announcements:** Super Admin write, authenticated read
- **Audit Logs:** Shop users can create and read; only Super Admin can delete

Deploy rules: `firebase deploy --only firestore:rules`

## Roles & Permissions

| Role | Access |
|------|--------|
| `super_admin` | Full platform control via `/admin` |
| `shop_owner` | Full shop access |
| `manager` | All shop permissions (configurable) |
| `operator` | Customers, applications, documents |
| `accountant` | Customers, applications, payments, reports |

Staff permissions are configured per member in Staff Management.

## Environment Variables

See `.env.example` for the full list:

- Firebase config (`NEXT_PUBLIC_FIREBASE_*`)
- Razorpay keys
- Firebase service account (for API routes)
- SMTP (email notifications)
- `OPENAI_API_KEY` (OCR + AI Assistant)
- `GOOGLE_VISION_API_KEY`, `AZURE_OCR_*` (OCR providers)
- `ESIGN_*` (eSign integration)
- `WHATSAPP_API_KEY`, `SMS_API_KEY` (notifications)

## Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy

## Default Services

New shops are seeded with: Aadhaar Update, PAN Card, Income Certificate, Caste Certificate, Domicile Certificate, Ayushman Card, Bill Payment, Insurance, Banking Service, Travel Booking.

## License

Private — All rights reserved.
