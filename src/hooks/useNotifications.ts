"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments, updateDocument } from "@/lib/firebase/firestore";
import { Notification } from "@/types";

export function useNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.shopId) return;
    setLoading(true);
    try {
      const data = await getShopDocuments<Notification>("notifications", profile.shopId);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, [profile?.shopId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    await updateDocument("notifications", id, { read: true });
    await fetchNotifications();
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => updateDocument("notifications", n.id, { read: true })));
    await fetchNotifications();
  };

  return { notifications, loading, unreadCount, markAsRead, markAllRead, refetch: fetchNotifications };
}
