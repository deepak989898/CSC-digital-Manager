import { addDays, format } from "date-fns";
import {
  getDocument,
  getShopDocuments,
  createDocument,
  getDocuments,
  where,
} from "@/lib/firebase/firestore";
import { Plan, Subscription, BillingCycle, StaffMember } from "@/types";
import { DEFAULT_PLANS } from "@/lib/constants";

export async function seedDefaultPlans(adminUserId: string): Promise<void> {
  const existing = await getDocuments<Plan>("plans");
  if (existing.length > 0) return;

  for (const plan of DEFAULT_PLANS) {
    await createDocument("plans", {
      ...plan,
      userId: adminUserId,
      shopId: "platform",
    });
  }
}

export async function getActivePlans(): Promise<Plan[]> {
  const plans = await getDocuments<Plan>("plans", [where("status", "==", "active")]);
  return plans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
}

export async function getPlanById(planId: string): Promise<Plan | null> {
  return getDocument<Plan>("plans", planId);
}

export async function getShopSubscription(shopId: string): Promise<Subscription | null> {
  const subs = await getShopDocuments<Subscription>("subscriptions", shopId);
  const active = subs.find(
    (s) => s.status === "active" || s.status === "trial"
  );
  return active || subs[0] || null;
}

export async function createTrialSubscription(
  shopId: string,
  userId: string,
  trialPlan: Plan
): Promise<string> {
  const start = new Date();
  const trialDays = trialPlan.trialDays || 14;
  const expiry = addDays(start, trialDays);

  return createDocument("subscriptions", {
    planId: trialPlan.id,
    planName: trialPlan.name,
    status: "trial",
    billingCycle: "monthly" as BillingCycle,
    startDate: start.toISOString(),
    expiryDate: expiry.toISOString(),
    amount: 0,
    autoRenew: false,
    userId,
    shopId,
  });
}

export async function createPaidSubscription(
  shopId: string,
  userId: string,
  plan: Plan,
  billingCycle: BillingCycle,
  transactionId?: string
): Promise<string> {
  const start = new Date();
  const days = billingCycle === "yearly" ? 365 : 30;
  const expiry = addDays(start, days);
  const amount = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  // Deactivate previous subscriptions
  const existing = await getShopDocuments<Subscription>("subscriptions", shopId);
  for (const sub of existing) {
    if (sub.status === "active" || sub.status === "trial") {
      const { updateDocument } = await import("@/lib/firebase/firestore");
      await updateDocument("subscriptions", sub.id, { status: "cancelled" });
    }
  }

  return createDocument("subscriptions", {
    planId: plan.id,
    planName: plan.name,
    status: "active",
    billingCycle,
    startDate: start.toISOString(),
    expiryDate: expiry.toISOString(),
    amount,
    transactionId,
    autoRenew: false,
    userId,
    shopId,
  });
}

export function getExpiryLabel(expiryDate: string): string {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return `Expired ${format(expiry, "dd MMM yyyy")}`;
  if (daysLeft === 0) return "Expires today";
  if (daysLeft <= 7) return `${daysLeft} days left`;
  return `Valid until ${format(expiry, "dd MMM yyyy")}`;
}

export async function getShopUsageCounts(shopId: string) {
  const [customers, applications, documents, staff] = await Promise.all([
    getShopDocuments("customers", shopId),
    getShopDocuments("applications", shopId),
    getShopDocuments("documents", shopId),
    getShopDocuments<StaffMember>("staff", shopId),
  ]);

  const storageMB = (documents as { fileSize?: number }[]).reduce(
    (sum, d) => sum + (d.fileSize || 0) / (1024 * 1024),
    0
  );

  return {
    customers: customers.length,
    applications: applications.length,
    storageMB: Math.round(storageMB * 100) / 100,
    staff: staff.filter((s) => s.status !== "inactive").length,
  };
}
