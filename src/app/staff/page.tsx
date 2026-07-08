"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { useShopCollection } from "@/hooks/useShopCollection";
import { StaffMember } from "@/types";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ConfirmModal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

export default function StaffPage() {
  const router = useRouter();
  const { isOwner } = usePermissions();
  const { data: staff, loading, remove } = useShopCollection<StaffMember>("staff");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await remove(deleteId);
      toast.success("Staff removed");
      setDeleteId(null);
    } catch { toast.error("Failed to remove staff"); }
    finally { setDeleting(false); }
  };

  return (
    <DashboardLayout title="Staff Management">
      <SettingsNav />
      <div className="space-y-4">
        {isOwner && (
          <div className="flex justify-end">
            <Button onClick={() => router.push("/staff/add")}><Plus className="h-4 w-4" /> Add Staff</Button>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? <div className="p-6"><TableSkeleton /></div> : staff.length === 0 ? (
            <EmptyState title="No staff members" description="Add staff to help manage your shop" actionLabel="Add Staff" onAction={() => router.push("/staff/add")} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.email}</td>
                    <td className="px-4 py-3 capitalize">{s.role}</td>
                    <td className="px-4 py-3"><Badge status={s.status === "active" ? "active" : "pending"} label={s.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {isOwner && (
                        <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Remove Staff" message="Remove this staff member? They will lose access." loading={deleting} />
    </DashboardLayout>
  );
}
