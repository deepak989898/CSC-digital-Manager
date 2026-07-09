"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeatureGate } from "@/components/FeatureGate";
import { useShopCollection } from "@/hooks/useShopCollection";
import { Invoice } from "@/types";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Eye } from "lucide-react";

export default function InvoicesPage() {
  const router = useRouter();
  const { data: invoices, loading } = useShopCollection<Invoice>("invoices");

  return (
    <DashboardLayout title="GST Invoices">
      <FeatureGate feature="gstInvoice">
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/settings/gst")}>GST Settings</Button>
            <Button onClick={() => router.push("/invoices/new")}><Plus className="h-4 w-4" /> New Invoice</Button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {loading ? <div className="p-6"><TableSkeleton /></div> : invoices.length === 0 ? (
              <EmptyState title="No invoices" description="Create your first GST invoice" actionLabel="New Invoice" onAction={() => router.push("/invoices/new")} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-900/60">
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50 dark:border-slate-700/80">
                      <td className="px-4 py-3 font-medium text-brand-blue">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{inv.customerName}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(inv.grandTotal)}</td>
                      <td className="px-4 py-3"><Badge status={inv.status} /></td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/invoices/${inv.id}`} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex"><Eye className="h-4 w-4" /></Link>
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
