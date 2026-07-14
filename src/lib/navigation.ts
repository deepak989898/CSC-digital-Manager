/** Top-level sidebar routes — no back button on these exact paths */
export const NAV_ROOT_ROUTES = new Set([
  "/dashboard",
  "/ai-assistant",
  "/customers",
  "/services",
  "/applications",
  "/invoices",
  "/esign",
  "/payments",
  "/appointments",
  "/expenses",
  "/inventory",
  "/attendance",
  "/tickets",
  "/marketing",
  "/automation",
  "/reminders",
  "/sync-status",
  "/reports",
  "/reports/advanced",
  "/notifications",
  "/audit-logs",
  "/backup",
  "/subscription",
  "/staff",
  "/settings/profile",
  "/documents",
  "/scanner",
  "/admin/dashboard",
  "/admin/shops",
  "/admin/users",
  "/admin/plans",
  "/admin/subscriptions",
  "/admin/revenue",
  "/admin/usage",
  "/admin/features",
  "/admin/white-label",
  "/admin/esign-settings",
  "/admin/announcements",
]);

const STATIC_CHILD_SEGMENTS = new Set([
  "new",
  "add",
  "edit",
  "plans",
  "rules",
  "advanced",
  "scan-document",
]);

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  customers: "Customers",
  services: "Services",
  applications: "Applications",
  invoices: "Invoices",
  esign: "eSign",
  payments: "Payments",
  appointments: "Schedule",
  expenses: "Expenses",
  inventory: "Inventory",
  attendance: "Attendance",
  tickets: "Help Desk",
  marketing: "Marketing",
  automation: "Automation",
  reminders: "Reminders",
  reports: "Reports",
  subscription: "Subscription",
  staff: "Staff",
  settings: "Settings",
  scanner: "Scanner",
  receipts: "Payments",
  admin: "Admin",
};

export function shouldShowBackButton(pathname: string): boolean {
  return !NAV_ROOT_ROUTES.has(pathname);
}

export function getBackFallback(pathname: string, isSuperAdmin = false): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return isSuperAdmin ? "/admin/dashboard" : "/dashboard";
  }

  const last = segments[segments.length - 1];

  if (segments[0] === "settings" && segments.length > 1 && segments[1] !== "profile") {
    return "/settings/profile";
  }

  if (segments[0] === "receipts" && segments.length >= 2) {
    return "/payments";
  }

  if (segments[0] === "admin") {
    if (segments.length > 2) {
      return `/${segments.slice(0, -1).join("/")}`;
    }
    if (segments.length === 2) {
      return "/admin/dashboard";
    }
  }

  const looksLikeId =
    segments.length >= 2 && !STATIC_CHILD_SEGMENTS.has(last) && !NAV_ROOT_ROUTES.has(pathname);

  if (looksLikeId) {
    return `/${segments.slice(0, -1).join("/")}`;
  }

  if (segments.length >= 2) {
    return `/${segments.slice(0, -1).join("/")}`;
  }

  return isSuperAdmin ? "/admin/dashboard" : "/dashboard";
}

export function getBackLabel(pathname: string, isSuperAdmin = false): string {
  const fallback = getBackFallback(pathname, isSuperAdmin);
  const section = fallback.split("/").filter(Boolean)[0];
  if (section && SECTION_LABELS[section]) {
    return `Back to ${SECTION_LABELS[section]}`;
  }
  return "Go back";
}
