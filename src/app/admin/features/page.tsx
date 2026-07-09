"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAllShops } from "@/lib/firebase/auth";
import { getDocument, setDocument } from "@/lib/firebase/firestore";
import { getDefaultFeatureFlags, PHASE4_FEATURE_LABELS } from "@/lib/feature-flags";
import { FeatureFlags, Phase4Feature, Shop, UsageMetrics } from "@/types";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";

const FEATURES: Phase4Feature[] = [
  "ocr", "scanner", "autoFormFill", "gstInvoice", "eSign", "whiteLabel", "smartReminders", "offlineSync",
];

const FLAG_KEYS: Record<Phase4Feature, keyof FeatureFlags> = {
  ocr: "ocrEnabled",
  scanner: "scannerEnabled",
  autoFormFill: "autoFormFillEnabled",
  gstInvoice: "gstInvoiceEnabled",
  eSign: "eSignEnabled",
  whiteLabel: "whiteLabelEnabled",
  smartReminders: "smartRemindersEnabled",
  offlineSync: "offlineSyncEnabled",
};

export default function AdminFeaturesPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllShops().then((s) => {
      setShops(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedShopId) return;
    (async () => {
      const f = await getDocument<FeatureFlags>("featureFlags", selectedShopId);
      const shop = shops.find((s) => s.id === selectedShopId);
      setFlags(f || getDefaultFeatureFlags(selectedShopId, shop?.userId || selectedShopId));
      const period = new Date().toISOString().slice(0, 7);
      const metrics = await getDocument<UsageMetrics>("usageMetrics", `${selectedShopId}_${period}`);
      setUsage(metrics);
    })();
  }, [selectedShopId, shops]);

  const toggleFeature = async (feature: Phase4Feature) => {
    if (!flags || !selectedShopId) return;
    setSaving(true);
    try {
      const key = FLAG_KEYS[feature];
      const newValue = !flags[key];
      const updates = { ...flags, [key]: newValue, shopId: selectedShopId };
      await setDocument("featureFlags", selectedShopId, updates);
      setFlags({ ...flags, [key]: newValue });
      toast.success(`${PHASE4_FEATURE_LABELS[feature]} ${newValue ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Phase 4 Features">
      <div className="max-w-3xl mx-auto space-y-4">
        <Card title="Select Shop">
          {loading ? (
            <TableSkeleton />
          ) : (
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-700"
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
            >
              <option value="">Choose shop...</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>{s.shopName} — {s.ownerName}</option>
              ))}
            </select>
          )}
        </Card>

        {flags && (
          <>
            <Card title="Feature Toggles">
              <div className="space-y-2">
                {FEATURES.map((f) => (
                  <div key={f} className="flex items-center justify-between p-3 border rounded-lg dark:border-slate-700">
                    <span className="text-sm font-medium">{PHASE4_FEATURE_LABELS[f]}</span>
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => toggleFeature(f)}>
                      {flags[FLAG_KEYS[f]] ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Usage Metrics (this month)">
              {usage ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <p>OCR scans: {usage.ocrCount}</p>
                  <p>Invoices: {usage.invoiceCount}</p>
                  <p>eSign requests: {usage.eSignCount}</p>
                  <p>Sync failures: {usage.syncFailures}</p>
                  <p>Storage: {(usage.storageBytes / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No usage data recorded yet</p>
              )}
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
