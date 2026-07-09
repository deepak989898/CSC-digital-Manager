"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeatureGate } from "@/components/FeatureGate";
import { useShopCollection } from "@/hooks/useShopCollection";
import { OcrDocument } from "@/types";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/utils";
import { Plus, ScanLine, Eye } from "lucide-react";

export default function ScannerPage() {
  const router = useRouter();
  const { data: docs, loading } = useShopCollection<OcrDocument>("ocrDocuments");

  return (
    <DashboardLayout title="Document Scanner & OCR">
      <FeatureGate feature="scanner">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Scan documents, extract data with OCR, and link to customers.
            </p>
            <Button onClick={() => router.push("/scanner/new")}>
              <Plus className="h-4 w-4" /> New Scan
            </Button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {loading ? (
              <div className="p-6"><TableSkeleton /></div>
            ) : docs.length === 0 ? (
              <EmptyState
                title="No scanned documents"
                description="Scan or upload a document to extract data"
                actionLabel="Start Scan"
                onAction={() => router.push("/scanner/new")}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-900/60">
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Document</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Date</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((d) => (
                      <tr key={d.id} className="border-b border-slate-50 dark:border-slate-700/80">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{d.fileName}</td>
                        <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-200">{d.documentType.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{d.customerName || "—"}</td>
                        <td className="px-4 py-3"><Badge status={d.status} /></td>
                        <td className="px-4 py-3 text-slate-500">{formatDateTime(d.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/scanner/new?ocrId=${d.id}`} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ScanLine className="h-4 w-4" />
            OCR extracts data only — original documents are never modified or forged.
          </div>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
