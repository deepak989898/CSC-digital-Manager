"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getShopFeatureFlags, getDefaultFeatureFlags } from "@/lib/feature-flags";
import { FeatureFlags, Phase4Feature } from "@/types";

export function useFeatureFlags() {
  const { profile } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.shopId) return;
    (async () => {
      const f = await getShopFeatureFlags(profile.shopId);
      setFlags(f || getDefaultFeatureFlags(profile.shopId, profile.userId));
      setLoading(false);
    })();
  }, [profile?.shopId, profile?.userId]);

  const isEnabled = (feature: Phase4Feature): boolean => {
    if (!flags) return true;
    const map: Record<Phase4Feature, keyof FeatureFlags> = {
      ocr: "ocrEnabled",
      scanner: "scannerEnabled",
      autoFormFill: "autoFormFillEnabled",
      gstInvoice: "gstInvoiceEnabled",
      eSign: "eSignEnabled",
      whiteLabel: "whiteLabelEnabled",
      smartReminders: "smartRemindersEnabled",
      offlineSync: "offlineSyncEnabled",
    };
    return flags[map[feature]] as boolean;
  };

  return { flags, loading, isEnabled };
}
