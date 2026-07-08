"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { NOTIFICATION_EVENT_LABELS } from "@/lib/notifications";
import Link from "next/link";

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllRead } = useNotifications();

  return (
    <DashboardLayout title="Notifications">
      <div className="space-y-4">
        {notifications.some((n) => !n.read) && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={markAllRead}>Mark all as read</Button>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          {loading ? <div className="p-6"><TableSkeleton /></div> : notifications.length === 0 ? (
            <EmptyState title="No notifications" description="You'll see notifications here when events occur" />
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 hover:bg-slate-50 ${!n.read ? "bg-blue-50/30" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-900">{n.title}</p>
                        <Badge status="submitted" label={NOTIFICATION_EVENT_LABELS[n.event]} />
                        {!n.read && <span className="h-2 w-2 bg-brand-blue rounded-full" />}
                      </div>
                      <p className="text-sm text-slate-600">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      {!n.read && <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>Mark read</Button>}
                      {n.link && <Link href={n.link}><Button variant="outline" size="sm">View</Button></Link>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
