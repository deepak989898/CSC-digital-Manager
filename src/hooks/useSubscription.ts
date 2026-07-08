"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getShopSubscription, getShopUsageCounts, getPlanById } from "@/lib/subscription";
import { buildPlanUsage, checkLimit, isSubscriptionActive } from "@/lib/permissions";
import { Plan, Subscription, PlanUsage } from "@/types";

export function useSubscription() {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!profile?.shopId) return;
    setLoading(true);
    try {
      const sub = await getShopSubscription(profile.shopId);
      setSubscription(sub);
      if (sub) {
        const p = await getPlanById(sub.planId);
        setPlan(p);
      }
      const counts = await getShopUsageCounts(profile.shopId);
      const p = sub ? await getPlanById(sub.planId) : null;
      setUsage(buildPlanUsage(p, counts));
    } finally {
      setLoading(false);
    }
  }, [profile?.shopId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isActive = isSubscriptionActive(subscription);

  const checkCustomerLimit = () => usage ? checkLimit(usage.customers.used, usage.customers.limit) : true;
  const checkApplicationLimit = () => usage ? checkLimit(usage.applications.used, usage.applications.limit) : true;
  const checkStorageLimit = (additionalMB = 0) =>
    usage ? checkLimit(usage.storageMB.used + additionalMB, usage.storageMB.limit) : true;
  const checkStaffLimit = () => usage ? checkLimit(usage.staff.used, usage.staff.limit) : true;

  return {
    subscription,
    plan,
    usage,
    loading,
    isActive,
    refresh,
    checkCustomerLimit,
    checkApplicationLimit,
    checkStorageLimit,
    checkStaffLimit,
  };
}
