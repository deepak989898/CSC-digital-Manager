import { FeatureFlags, Phase4Feature } from "@/types";
import { getDocument } from "@/lib/firebase/firestore";

const DEFAULT_FLAGS = {
  ocrEnabled: true,
  scannerEnabled: true,
  autoFormFillEnabled: true,
  gstInvoiceEnabled: true,
  eSignEnabled: true,
  whiteLabelEnabled: false,
  smartRemindersEnabled: true,
  offlineSyncEnabled: true,
} as const;

type FeatureFlagKey = keyof typeof DEFAULT_FLAGS;

const FEATURE_KEY_MAP: Record<Phase4Feature, FeatureFlagKey> = {
  ocr: "ocrEnabled",
  scanner: "scannerEnabled",
  autoFormFill: "autoFormFillEnabled",
  gstInvoice: "gstInvoiceEnabled",
  eSign: "eSignEnabled",
  whiteLabel: "whiteLabelEnabled",
  smartReminders: "smartRemindersEnabled",
  offlineSync: "offlineSyncEnabled",
};

export async function getShopFeatureFlags(shopId: string): Promise<FeatureFlags | null> {
  return getDocument<FeatureFlags>("featureFlags", shopId);
}

export async function isFeatureEnabled(shopId: string, feature: Phase4Feature): Promise<boolean> {
  const flags = await getShopFeatureFlags(shopId);
  if (!flags) return DEFAULT_FLAGS[FEATURE_KEY_MAP[feature]];
  return flags[FEATURE_KEY_MAP[feature]] as boolean;
}

export function getDefaultFeatureFlags(shopId: string, userId: string): FeatureFlags {
  const now = new Date().toISOString();
  return {
    id: shopId,
    shopId,
    userId,
    ...DEFAULT_FLAGS,
    createdAt: now,
    updatedAt: now,
  };
}

export const PHASE4_FEATURE_LABELS: Record<Phase4Feature, string> = {
  ocr: "AI Document OCR",
  scanner: "Document Scanner",
  autoFormFill: "Auto Form Filling",
  gstInvoice: "GST Invoices",
  eSign: "eSign Workflow",
  whiteLabel: "White-Label Branding",
  smartReminders: "Smart Reminders",
  offlineSync: "Offline Sync / PWA",
};
