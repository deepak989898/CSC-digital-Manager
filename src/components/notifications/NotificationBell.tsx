"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-slate-100 relative"
      >
        <Bell className="h-5 w-5 text-slate-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 max-h-96 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-blue hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto max-h-72">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No notifications</p>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { markAsRead(n.id); setOpen(false); }}
                    className={cn(
                      "px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer",
                      !n.read && "bg-blue-50/50"
                    )}
                  >
                    {n.link ? (
                      <Link href={n.link} onClick={() => setOpen(false)}>
                        <p className="text-sm font-medium text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      </Link>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      </>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-sm text-brand-blue py-3 border-t border-slate-100 hover:bg-slate-50"
            >
              View all
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
