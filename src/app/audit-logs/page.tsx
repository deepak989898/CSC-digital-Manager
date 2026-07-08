"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { AuditLog } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { formatDateTime } from "@/lib/utils";
import { Shield } from "lucide-react";

export default function AuditLogsPage() {
  const { data: logs, loading } = useShopCollection<AuditLog>("auditLogs");
  const { paginatedItems, currentPage, setCurrentPage, totalItems } = usePagination(logs);

  const actionColors: Record<string, string> = {
    create: "completed", update: "submitted", delete: "rejected",
    login: "active", payment: "completed", status_change: "pending",
  };

  return (
    <DashboardLayout title="Audit Logs">
      <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-slate-50 dark:bg-slate-900">
          <Shield className="h-5 w-5 text-brand-blue" />
          <p className="text-sm text-slate-600">All actions are logged with timestamp and user info. IP tracking ready for integration.</p>
        </div>
        {loading ? <div className="p-8 text-center">Loading...</div> : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No audit logs yet. Actions will be tracked automatically.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-slate-50 dark:bg-slate-900"><th className="text-left px-4 py-3">Time</th><th className="text-left px-4 py-3">User</th><th className="text-left px-4 py-3">Action</th><th className="text-left px-4 py-3">Entity</th><th className="text-left px-4 py-3">Details</th></tr></thead>
              <tbody>{paginatedItems.map((log) => (
                <tr key={log.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(log.createdAt)}</td>
                  <td className="px-4 py-3">{log.userName}</td>
                  <td className="px-4 py-3"><Badge status={actionColors[log.action] || "submitted"} label={log.action} /></td>
                  <td className="px-4 py-3">{log.entity}: {log.entityName}</td>
                  <td className="px-4 py-3 text-slate-500">{log.details || "—"}</td>
                </tr>
              ))}</tbody>
            </table>
            <Pagination totalItems={totalItems} currentPage={currentPage} onPageChange={setCurrentPage} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
