import { getShopDocuments } from "@/lib/firebase/firestore";
import { getShopSubscription } from "@/lib/subscription";
import {
  Application, Customer, Payment, DocumentRecord,
  Reminder, Subscription,
} from "@/types";
import { formatCurrency } from "@/lib/utils";
import { isToday, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export interface AIQueryResult {
  answer: string;
  data?: Record<string, unknown>;
  suggestions?: string[];
}

type ShopData = {
  customers: Customer[];
  applications: Application[];
  payments: Payment[];
  documents: DocumentRecord[];
  reminders: Reminder[];
  subscription: Subscription | null;
};

async function loadShopData(shopId: string): Promise<ShopData> {
  const [customers, applications, payments, documents, reminders, subscription] = await Promise.all([
    getShopDocuments<Customer>("customers", shopId),
    getShopDocuments<Application>("applications", shopId),
    getShopDocuments<Payment>("payments", shopId),
    getShopDocuments<DocumentRecord>("documents", shopId),
    getShopDocuments<Reminder>("reminders", shopId),
    getShopSubscription(shopId),
  ]);
  return { customers, applications, payments, documents, reminders, subscription };
}

function matchIntent(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("completed") && q.includes("today")) return "completed_today";
  if (q.includes("pending payment") || q.includes("who has pending")) return "pending_payments";
  if (q.includes("follow") || q.includes("follow-up")) return "follow_ups";
  if (q.includes("highest income") || q.includes("top service") || q.includes("best service")) return "top_service";
  if (q.includes("today") && (q.includes("earning") || q.includes("revenue"))) return "today_earnings";
  if (q.includes("monthly") || q.includes("this month")) return "monthly_report";
  if (q.includes("pending document")) return "pending_documents";
  if (q.includes("subscription") || q.includes("expir")) return "subscription";
  if (q.includes("customer") && q.includes("how many")) return "customer_count";
  if (q.includes("application") && q.includes("pending")) return "pending_applications";
  if (q.includes("profit")) return "profit";
  return "general";
}

export async function processAIQuery(shopId: string, query: string): Promise<AIQueryResult> {
  const data = await loadShopData(shopId);
  const intent = matchIntent(query);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  switch (intent) {
    case "completed_today": {
      const completed = data.applications.filter(
        (a) => a.status === "completed" && isToday(parseISO(a.updatedAt))
      );
      return {
        answer: `${completed.length} application(s) completed today.${completed.length > 0 ? ` Latest: ${completed[0].referenceNumber} for ${completed[0].customerName}.` : ""}`,
        data: { count: completed.length, items: completed.slice(0, 5) },
      };
    }
    case "pending_payments": {
      const pending = data.applications.filter((a) => a.paymentStatus !== "paid");
      const names = pending.slice(0, 5).map((a) => `${a.customerName} (${a.referenceNumber})`).join(", ");
      const total = pending.reduce((s, a) => s + (a.applicationFee - a.amountPaid), 0);
      return {
        answer: `${pending.length} application(s) have pending payments totaling ${formatCurrency(total)}.${names ? ` Customers: ${names}.` : ""}`,
        data: { count: pending.length, total, items: pending.slice(0, 10) },
      };
    }
    case "follow_ups": {
      const followUps = data.reminders.filter((r) => r.status === "pending" && r.type === "follow_up");
      const names = followUps.slice(0, 5).map((r) => r.customerName).join(", ");
      return {
        answer: `${followUps.length} customer(s) need follow-up.${names ? ` Including: ${names}.` : " No pending follow-ups."}`,
        data: { count: followUps.length },
      };
    }
    case "top_service": {
      const revenue: Record<string, number> = {};
      data.payments.filter((p) => p.paymentStatus === "paid").forEach((p) => {
        revenue[p.serviceName] = (revenue[p.serviceName] || 0) + p.amount;
      });
      const sorted = Object.entries(revenue).sort(([, a], [, b]) => b - a);
      if (sorted.length === 0) return { answer: "No payment data available yet." };
      return {
        answer: `Top earning service is **${sorted[0][0]}** with ${formatCurrency(sorted[0][1])} in total revenue.`,
        data: { services: sorted.slice(0, 5) },
      };
    }
    case "today_earnings": {
      const todayPayments = data.payments.filter(
        (p) => p.paymentStatus === "paid" && isToday(parseISO(p.paymentDate))
      );
      const total = todayPayments.reduce((s, p) => s + p.amount, 0);
      return {
        answer: `Today's earnings: **${formatCurrency(total)}** from ${todayPayments.length} payment(s).`,
        data: { total, count: todayPayments.length },
      };
    }
    case "monthly_report": {
      const monthPayments = data.payments.filter((p) => {
        if (p.paymentStatus !== "paid") return false;
        return isWithinInterval(parseISO(p.paymentDate), { start: monthStart, end: monthEnd });
      });
      const total = monthPayments.reduce((s, p) => s + p.amount, 0);
      const monthApps = data.applications.filter((a) =>
        isWithinInterval(parseISO(a.createdAt), { start: monthStart, end: monthEnd })
      );
      return {
        answer: `Monthly Report: **${formatCurrency(total)}** revenue from ${monthPayments.length} payments. ${monthApps.length} new applications. ${data.customers.length} total customers.`,
        data: { revenue: total, payments: monthPayments.length, applications: monthApps.length },
      };
    }
    case "pending_documents": {
      const pending = data.documents.filter((d) => d.verificationStatus === "pending" || !d.verificationStatus);
      return {
        answer: `${pending.length} document(s) pending verification.`,
        data: { count: pending.length },
      };
    }
    case "subscription": {
      const sub = data.subscription;
      if (!sub) return { answer: "No active subscription found." };
      const expiry = new Date(sub.expiryDate);
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        answer: `Your **${sub.planName}** plan (${sub.status}) expires in ${daysLeft} day(s) on ${expiry.toLocaleDateString()}.`,
        data: { subscription: sub, daysLeft },
      };
    }
    case "customer_count":
      return { answer: `You have **${data.customers.length}** customers in total.` };
    case "pending_applications": {
      const pending = data.applications.filter((a) => ["pending", "submitted", "in_progress"].includes(a.status));
      return { answer: `${pending.length} application(s) are pending or in progress.` };
    }
    default:
      return {
        answer: `I can help with: applications, payments, earnings, customers, documents, and subscriptions. Try asking "Today's earnings?" or "Who has pending payment?"`,
        suggestions: ["Today's earnings?", "Pending payments?", "Monthly report?", "Top service?"],
      };
  }
}

// OpenAI integration ready
export async function processAIQueryWithOpenAI(
  shopId: string,
  query: string,
  apiKey?: string
): Promise<AIQueryResult> {
  if (!apiKey) return processAIQuery(shopId, query);
  // Future: call OpenAI with shop context
  const localResult = await processAIQuery(shopId, query);
  return localResult;
}
