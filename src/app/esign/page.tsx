"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeatureGate } from "@/components/FeatureGate";
import { useShopCollection } from "@/hooks/useShopCollection";
import { ESignRequest } from "@/types";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/utils";
import { Plus, Eye } from "lucide-react";

export default function ESignPage() {
  const router = useRouter();
  const { data: requests, loading } = useShopCollection<ESignRequest>("eSignRequests");

  return (
    <DashboardLayout title="eSign Requests">
      <FeatureGate feature="eSign">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => router.push("/esign/new")}><Plus className="h-4 w-4" /> New Request</Button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {loading ? <div className="p-6"><TableSkeleton /></div> : requests.length === 0 ? (
              <EmptyState title="No eSign requests" description="Send documents for electronic signature" actionLabel="New Request" onAction={() => router.push("/esign/new")} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-900/60">
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Document</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Signer</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 dark:border-slate-700/80">
                      <td className="px-4 py-3 font-medium">{r.documentName}</td>
                      <td className="px-4 py-3">{r.signerName}</td>
                      <td className="px-4 py-3"><Badge status={r.status} /></td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(r.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/esign/${r.id}`} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex"><Eye className="h-4 w-4" /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="text-xs text-slate-500">Provider-ready workflow. Configure eSign provider in Admin → eSign Settings.</p>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
