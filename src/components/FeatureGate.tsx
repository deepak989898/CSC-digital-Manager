"use client";

import { ReactNode } from "react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Phase4Feature } from "@/types";
import { PHASE4_FEATURE_LABELS } from "@/lib/feature-flags";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export function FeatureGate({
  feature,
  children,
}: {
  feature: Phase4Feature;
  children: ReactNode;
}) {
  const { isEnabled, loading } = useFeatureFlags();

  if (loading) return null;
  if (isEnabled(feature)) return <>{children}</>;

  return (
    <Card title="Feature Not Available">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
        <strong>{PHASE4_FEATURE_LABELS[feature]}</strong> is not enabled for your shop or plan.
      </p>
      <Link href="/subscription" className="text-sm text-brand-blue hover:underline">
        Upgrade your plan →
      </Link>
    </Card>
  );
}
