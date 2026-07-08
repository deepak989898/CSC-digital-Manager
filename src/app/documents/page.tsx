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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No documents" description="Documents will appear when uploaded to applications" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Document</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Verification</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((doc) => (
                    <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{doc.fileName}</td>
                      <td className="px-4 py-3 capitalize">{doc.type.replace("_", " ")}</td>
                      <td className="px-4 py-3">
                        <Link href={`/applications/${doc.applicationId}`} className="text-brand-blue hover:underline">
                          {doc.customerName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={doc.verificationStatus || "pending"} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-500">{formatDate(doc.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {(doc.verificationStatus || "pending") === "pending" && (
                            <>
                              <button onClick={() => handleVerify(doc.id, "verified")} className="text-xs text-green-600 px-2 py-1 hover:bg-green-50 rounded">Verify</button>
                              <button onClick={() => handleVerify(doc.id, "rejected")} className="text-xs text-red-600 px-2 py-1 hover:bg-red-50 rounded">Reject</button>
                            </>
                          )}
                          <a href={doc.fileURL} target="_blank" rel="noopener noreferrer">
                            <button className="p-1.5 rounded hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
                          </a>
                          <a href={doc.fileURL} download>
                            <button className="p-1.5 rounded hover:bg-slate-100"><Download className="h-4 w-4" /></button>
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
