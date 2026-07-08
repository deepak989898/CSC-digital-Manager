import { createDocument, getShopDocuments } from "@/lib/firebase/firestore";
import { Notification, NotificationEvent, NotificationChannel } from "@/types";

interface CreateNotificationParams {
  shopId: string;
  userId: string;
  title: string;
  message: string;
  event: NotificationEvent;
  channel?: NotificationChannel;
  link?: string;
  metadata?: Record<string, string>;
}

export async function createNotification(params: CreateNotificationParams): Promise<string> {
  return createDocument("notifications", {
    title: params.title,
    message: params.message,
    event: params.event,
    channel: params.channel || "in_app",
    read: false,
    link: params.link,
    metadata: params.metadata,
    userId: params.userId,
    shopId: params.shopId,
  });
}

export async function notifyShopEvent(
  shopId: string,
  userId: string,
  event: NotificationEvent,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  await createNotification({ shopId, userId, title, message, event, link });

  // Trigger email via API if enabled (fire-and-forget)
  try {
    await fetch("/api/notifications/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopId, event, title, message }),
    });
  } catch {
    // Email is optional
  }
}

export async function getUnreadCount(shopId: string): Promise<number> {
  const notifications = await getShopDocuments<Notification>("notifications", shopId);
  return notifications.filter((n) => !n.read).length;
}

export const NOTIFICATION_EVENT_LABELS: Record<NotificationEvent, string> = {
  application_created: "Application Created",
  application_status_changed: "Status Changed",
  payment_received: "Payment Received",
  payment_pending: "Payment Pending",
  document_missing: "Document Missing",
  subscription_expiring: "Subscription Expiring",
  subscription_expired: "Subscription Expired",
  announcement: "Announcement",
};
