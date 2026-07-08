import { Permission, UserProfile, PlanUsage, Plan, Subscription } from "@/types";

export function isStaffRole(role: string): boolean {
  return ["manager", "operator", "accountant"].includes(role);
}

export function isShopOwnerOrAdmin(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return profile.role === "shop_owner" || profile.role === "super_admin";
}

export function hasPermission(profile: UserProfile | null, permission: Permission): boolean {
  if (!profile || !profile.isActive) return false;
  if (profile.role === "super_admin" || profile.role === "shop_owner") return true;
  return profile.permissions?.includes(permission) ?? false;
}

export function canAccessRoute(profile: UserProfile | null, route: string): boolean {
  if (!profile) return false;
  if (profile.role === "super_admin") return route.startsWith("/admin");
  if (profile.role === "shop_owner") return !route.startsWith("/admin");

  const routePermissions: Record<string, Permission[]> = {
    "/customers": ["customers_view"],
    "/applications": ["applications_view"],
    "/payments": ["payments_view"],
    "/reports": ["reports_view"],
    "/documents": ["documents_view"],
    "/staff": [],
    "/subscription": [],
    "/reminders": [],
    "/notifications": [],
    "/dashboard": [],
    "/ai-assistant": [],
    "/appointments": [],
    "/expenses": [],
    "/inventory": [],
    "/attendance": [],
    "/tickets": [],
    "/marketing": [],
    "/audit-logs": [],
    "/backup": [],
    "/settings": [],
  };

  for (const [prefix, perms] of Object.entries(routePermissions)) {
    if (route.startsWith(prefix)) {
      if (perms.length === 0) return true;
      return perms.some((p) => hasPermission(profile, p));
    }
  }
  return true;
}

export function checkLimit(used: number, limit: number): boolean {
  if (limit < 0) return true; // unlimited
  return used < limit;
}

export function getUsagePercent(used: number, limit: number): number {
  if (limit < 0) return 0;
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (subscription.status === "suspended" || subscription.status === "cancelled") return false;
  if (subscription.status === "expired") return false;
  return new Date(subscription.expiryDate) > new Date();
}

export function isPremiumFeatureAllowed(subscription: Subscription | null): boolean {
  return isSubscriptionActive(subscription);
}

export function formatLimit(limit: number): string {
  return limit < 0 ? "Unlimited" : String(limit);
}

export function buildPlanUsage(
  plan: Plan | null,
  counts: { customers: number; applications: number; storageMB: number; staff: number }
): PlanUsage {
  const lim = plan || { customerLimit: 25, applicationLimit: 50, storageLimitMB: 100, staffLimit: 1 };
  return {
    customers: { used: counts.customers, limit: lim.customerLimit },
    applications: { used: counts.applications, limit: lim.applicationLimit },
    storageMB: { used: counts.storageMB, limit: lim.storageLimitMB },
    staff: { used: counts.staff, limit: lim.staffLimit },
  };
}
