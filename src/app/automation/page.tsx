"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeatureGate } from "@/components/FeatureGate";
import { useShopCollection } from "@/hooks/useShopCollection";
import { AutomationRule } from "@/types";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Settings, Zap } from "lucide-react";

export default function AutomationPage() {
  const router = useRouter();
  const { data: rules, loading } = useShopCollection<AutomationRule>("automationRules");

  return (
    <DashboardLayout title="Automation">
      <FeatureGate feature="smartReminders">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <p className="text-sm text-slate-500">Auto-create reminders based on shop activity</p>
            <div className="flex gap-2">
              <Link href="/automation/rules">
                <Button variant="outline"><Settings className="h-4 w-4" /> Manage Rules</Button>
              </Link>
              <Link href="/reminders">
                <Button><Zap className="h-4 w-4" /> View Reminders</Button>
              </Link>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {loading ? (
              <div className="p-6"><TableSkeleton /></div>
            ) : rules.length === 0 ? (
              <EmptyState
                title="No automation rules"
                description="Create rules to auto-remind on pending payments, missing documents, and more"
                actionLabel="Create Rule"
                onAction={() => router.push("/automation/rules")}
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-900/60">
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Rule</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Trigger</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Delay</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 dark:border-slate-700/80">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 capitalize">{r.trigger.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">{r.delayDays} day(s)</td>
                      <td className="px-4 py-3">
                        <Badge status={r.isActive ? "active" : "inactive"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
