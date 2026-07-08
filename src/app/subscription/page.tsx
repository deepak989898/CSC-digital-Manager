"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionCard } from "@/components/subscription/SubscriptionCard";
import { PlanUsageCard } from "@/components/subscription/PlanUsageCard";
import { Card } from "@/components/ui/Card";
import { getShopDocuments } from "@/lib/firebase/firestore";
import { Subscription } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function SubscriptionPage() {
  const { profile } = useAuth();
  const { subscription, plan, usage, loading } = useSubscription();
  const [history, setHistory] = useState<Subscription[]>([]);

  useEffect(() => {
    if (!profile?.shopId) return;
    getShopDocuments<Subscription>("subscriptions", profile.shopId).then(setHistory);
  }, [profile?.shopId]);

  return (
    <DashboardLayout title="Subscription">
      <SettingsNav />
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SubscriptionCard subscription={subscription} planName={plan?.name} monthlyPrice={plan?.monthlyPrice} loading={loading} />
          <PlanUsageCard usage={usage} planName={plan?.name} loading={loading} />
        </div>

        <Card title="Subscription History">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No subscription history</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 font-medium text-slate-600">Plan</th>
                    <th className="text-left py-2 font-medium text-slate-600">Amount</th>
                    <th className="text-left py-2 font-medium text-slate-600">Cycle</th>
                    <th className="text-left py-2 font-medium text-slate-600">Status</th>
                    <th className="text-left py-2 font-medium text-slate-600">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((sub) => (
                    <tr key={sub.id} className="border-b border-slate-50">
                      <td className="py-2 font-medium">{sub.planName}</td>
                      <td className="py-2">{formatCurrency(sub.amount)}</td>
                      <td className="py-2 capitalize">{sub.billingCycle}</td>
                      <td className="py-2"><Badge status={sub.status === "active" || sub.status === "trial" ? "active" : "inactive"} label={sub.status} /></td>
                      <td className="py-2 text-slate-500">{formatDate(sub.expiryDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4">
            <Link href="/subscription/plans"><Button>Upgrade Plan</Button></Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
