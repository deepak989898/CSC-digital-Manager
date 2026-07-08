"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments } from "@/lib/firebase/firestore";
import { Reminder } from "@/types";
import { isAfter, parseISO, startOfDay } from "date-fns";

export function useReminders(upcomingOnly = false) {
  const { profile } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!profile?.shopId) return;
    setLoading(true);
    try {
      let data = await getShopDocuments<Reminder>("reminders", profile.shopId);
      if (upcomingOnly) {
        const today = startOfDay(new Date());
        data = data.filter(
          (r) => r.status === "pending" && !isAfter(today, parseISO(r.reminderDate))
        );
      }
      setReminders(data);
    } finally {
      setLoading(false);
    }
  }, [profile?.shopId, upcomingOnly]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return { reminders, loading, refetch: fetchReminders };
}
