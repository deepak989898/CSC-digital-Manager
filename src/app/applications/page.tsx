"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { Application } from "@/types";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Plus, Eye } from "lucide-react";

export default function ApplicationsPage() {
  const router = useRouter();
  const { data: applications, loading } = useShopCollection<Application>("applications");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = applications.filter((a) => {
    const matchSearch =
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.serviceName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const { paginatedItems, currentPage, setCurrentPage, totalItems } =
    usePagination(filtered);

  return (
    <DashboardLayout
      title="Applications"
      showSearch
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={APPLICATION_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            placeholder="All Status"
            className="w-full sm:w-48"
          />
          <Button onClick={() => router.push("/applications/add")}>
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-slate-900 dark:text-slate-100">
          {loading ? (
            <div className="p-6"><TableSkeleton /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No applications"
              description="Create your first application"
              actionLabel="New Application"
              onAction={() => router.push("/applications/add")}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Ref No.</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Service</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 hidden md:table-cell">Date</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((app) => (
                      <tr key={app.id} className="border-b border-slate-50 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="px-4 py-3 font-medium text-brand-blue">{app.referenceNumber}</td>
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{app.customerName}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{app.serviceName}</td>
                        <td className="px-4 py-3"><Badge status={app.status} /></td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-300">{formatDate(app.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/applications/${app.id}`}>
                            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
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
      </div>
    </DashboardLayout>
  );
}
