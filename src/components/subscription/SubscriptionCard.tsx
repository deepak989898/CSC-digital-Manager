"use client";

import { Subscription } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getExpiryLabel } from "@/lib/subscription";
import { isSubscriptionActive } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Crown } from "lucide-react";

interface SubscriptionCardProps {
  subscription: Subscription | null;
  planName?: string;
  monthlyPrice?: number;
  loading?: boolean;
}

export function SubscriptionCard({ subscription, planName, monthlyPrice, loading }: SubscriptionCardProps) {
  if (loading) {
    return (
      <Card title="Subscription">
        <div className="animate-pulse h-16 bg-slate-100 rounded" />
      </Card>
    );
  }

  const active = isSubscriptionActive(subscription);

  return (
    <Card title="Subscription">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Crown className="h-5 w-5 text-brand-orange" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{planName || subscription?.planName || "No Plan"}</p>
            {subscription && (
              <p className="text-sm text-slate-500">{getExpiryLabel(subscription.expiryDate)}</p>
            )}
          </div>
        </div>
        <Badge status={active ? "active" : "inactive"} label={subscription?.status || "none"} />
      </div>
      {monthlyPrice !== undefined && monthlyPrice > 0 && (
        <p className="text-lg font-bold text-brand-blue mt-3">{formatCurrency(monthlyPrice)}/mo</p>
      )}
      <div className="flex gap-2 mt-4">
        <Link href="/subscription">
          <Button variant="outline" size="sm">Manage</Button>
        </Link>
        <Link href="/subscription/plans">
          <Button size="sm">Upgrade</Button>
        </Link>
      </div>
    </Card>
  );
}
