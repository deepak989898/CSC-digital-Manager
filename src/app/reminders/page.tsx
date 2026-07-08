"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useReminders } from "@/hooks/useReminders";
import { useShopCollection } from "@/hooks/useShopCollection";
import { Reminder } from "@/types";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ConfirmModal } from "@/components/ui/Modal";
import { formatDate, formatDateTime } from "@/lib/utils";
import { REMINDER_TYPES } from "@/lib/constants";
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function RemindersPage() {
  const router = useRouter();
  const { data: reminders, loading, update } = useShopCollection<Reminder>("reminders");
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);

  const filtered = reminders.filter((r) => !statusFilter || r.status === statusFilter);

  const handleComplete = async (id: string) => {
    try { await update(id, { status: "completed" }); toast.success("Reminder completed"); }
    catch { toast.error("Failed to update"); }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    try { await update(cancelId, { status: "cancelled" }); toast.success("Reminder cancelled"); setCancelId(null); }
    catch { toast.error("Failed to cancel"); }
  };

  return (
    <DashboardLayout title="Reminders">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[{ value: "pending", label: "Pending" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }]} placeholder="All Status" className="sm:w-48" />
          <Button onClick={() => router.push("/reminders/add")}><Plus className="h-4 w-4" /> Add Reminder</Button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? <div className="p-6"><TableSkeleton /></div> : filtered.length === 0 ? (
            <EmptyState title="No reminders" actionLabel="Add Reminder" onAction={() => router.push("/reminders/add")} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.customerName}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{r.message}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{r.type.replace("_", " ")}</td>
                    <td className="px-4 py-3">{formatDateTime(r.reminderDate)}</td>
                    <td className="px-4 py-3"><Badge status={r.status === "completed" ? "completed" : r.status === "cancelled" ? "rejected" : "pending"} /></td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleComplete(r.id)} className="p-1.5 rounded hover:bg-green-50 text-green-600"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setCancelId(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><X className="h-4 w-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ConfirmModal isOpen={!!cancelId} onClose={() => setCancelId(null)} onConfirm={handleCancel} title="Cancel Reminder" message="Cancel this reminder?" confirmLabel="Cancel Reminder" variant="danger" />
    </DashboardLayout>
  );
}
