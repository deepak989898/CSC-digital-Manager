"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { DocumentRecord } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import { toast } from "sonner";
import { Eye, Download } from "lucide-react";

export default function DocumentsPage() {
  const { data: documents, loading, update } = useShopCollection<DocumentRecord>("documents");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = documents.filter((d) => {
    const matchSearch = d.fileName.toLowerCase().includes(search.toLowerCase()) || d.customerName.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || (d.verificationStatus || "pending") === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleVerify = async (docId: string, status: "verified" | "rejected") => {
    try { await update(docId, { verificationStatus: status }); toast.success(`Document ${status}`); }
    catch { toast.error("Failed to update"); }
  };

  const { paginatedItems, currentPage, setCurrentPage, totalItems } =
    usePagination(filtered);

  return (
    <DashboardLayout title="Documents" showSearch searchValue={search} onSearchChange={setSearch}>
      <div className="mb-4">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" }]} placeholder="All Verification Status" className="w-56" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-slate-900 dark:text-slate-100">
        {loading ? (
          <div className="p-6"><TableSkeleton /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No documents" description="Upload documents from a customer page or application" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Document</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Verification</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 hidden md:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((doc) => (
                    <tr key={doc.id} className="border-b border-slate-50 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{doc.fileName}</td>
                      <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-200">{doc.type.replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={doc.applicationId ? `/applications/${doc.applicationId}` : `/customers/${doc.customerId}`}
                          className="text-brand-blue hover:underline"
                        >
                          {doc.customerName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={doc.verificationStatus || "pending"} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-300">{formatDate(doc.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {(doc.verificationStatus || "pending") === "pending" && (
                            <>
                              <button onClick={() => handleVerify(doc.id, "verified")} className="text-xs text-green-600 dark:text-green-400 px-2 py-1 hover:bg-green-50 dark:hover:bg-green-900/30 rounded">Verify</button>
                              <button onClick={() => handleVerify(doc.id, "rejected")} className="text-xs text-red-600 dark:text-red-400 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">Reject</button>
                            </>
                          )}
                          <a href={doc.fileURL} target="_blank" rel="noopener noreferrer">
                            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"><Eye className="h-4 w-4" /></button>
                          </a>
                          <a href={doc.fileURL} download>
                            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"><Download className="h-4 w-4" /></button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination totalItems={totalItems} currentPage={currentPage} onPageChange={setCurrentPage} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
