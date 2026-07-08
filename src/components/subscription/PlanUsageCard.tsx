"use client";

import { PlanUsage } from "@/types";
import { Card } from "@/components/ui/Card";
import { formatLimit, getUsagePercent } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface PlanUsageCardProps {
  usage: PlanUsage | null;
  planName?: string;
  loading?: boolean;
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = getUsagePercent(used, limit);
  const isNearLimit = limit > 0 && pct >= 80;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className={cn("font-medium", isNearLimit && "text-orange-600")}>
          {used} / {formatLimit(limit)}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", isNearLimit ? "bg-orange-500" : "bg-brand-blue")}
          style={{ width: `${limit < 0 ? 10 : pct}%` }}
        />
      </div>
    </div>
  );
}

export function PlanUsageCard({ usage, planName, loading }: PlanUsageCardProps) {
  if (loading || !usage) {
    return (
      <Card title="Plan Usage">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-slate-100 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Plan Usage"
      action={
        planName && <span className="text-xs font-medium text-brand-blue bg-blue-50 px-2 py-1 rounded">{planName}</span>
      }
    >
      <div className="space-y-4">
        <UsageBar label="Customers" used={usage.customers.used} limit={usage.customers.limit} />
        <UsageBar label="Applications" used={usage.applications.used} limit={usage.applications.limit} />
        <UsageBar label="Storage (MB)" used={usage.storageMB.used} limit={usage.storageMB.limit} />
        <UsageBar label="Staff" used={usage.staff.used} limit={usage.staff.limit} />
        <Link href="/subscription/plans">
          <Button variant="outline" size="sm" className="w-full mt-2">Upgrade Plan</Button>
        </Link>
      </div>
    </Card>
  );
}
