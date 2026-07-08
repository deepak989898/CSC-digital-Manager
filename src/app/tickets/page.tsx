"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { useAuth } from "@/contexts/AuthContext";
import { Ticket } from "@/types";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/constants";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function TicketsPage() {
  const { profile } = useAuth();
  const { data: tickets, loading, create, update } = useShopCollection<Ticket>("tickets");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customerName: "", subject: "", description: "", issueType: "complaint", priority: "medium" });
  const [resolution, setResolution] = useState("");

  const { paginatedItems, currentPage, setCurrentPage, totalItems } = usePagination(tickets);
  const selected = tickets.find((t) => t.id === detailId);

  const handleSave = async () => {
    if (!profile || !form.subject) return;
    setSaving(true);
    try {
      await create({ ...form, status: "open", userId: profile.userId, shopId: profile.shopId } as Omit<Ticket, "id" | "createdAt" | "updatedAt">);
      toast.success("Ticket created");
      setModalOpen(false);
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const resolveTicket = async () => {
    if (!detailId || !resolution) return;
    await update(detailId, { status: "resolved", resolution, resolvedAt: new Date().toISOString() });
    toast.success("Ticket resolved");
    setDetailId(null);
    setResolution("");
  };

  return (
    <DashboardLayout title="Help Desk">
      <div className="space-y-4">
        <div className="flex justify-end"><Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> New Ticket</Button></div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
          {loading ? <div className="p-8 text-center">Loading...</div> : tickets.length === 0 ? (
            <EmptyState title="No tickets" actionLabel="Create Ticket" onAction={() => setModalOpen(true)} />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 dark:bg-slate-900"><th className="text-left px-4 py-3">Subject</th><th className="text-left px-4 py-3">Customer</th><th className="text-left px-4 py-3">Priority</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Date</th><th className="text-right px-4 py-3">Actions</th></tr></thead>
                <tbody>{paginatedItems.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-3 font-medium">{t.subject}</td>
                    <td className="px-4 py-3">{t.customerName}</td>
                    <td className="px-4 py-3"><Badge status={t.priority === "urgent" ? "rejected" : t.priority === "high" ? "pending" : "submitted"} label={t.priority} /></td>
                    <td className="px-4 py-3"><Badge status={t.status === "resolved" ? "completed" : t.status === "open" ? "pending" : "submitted"} label={t.status} /></td>
                    <td className="px-4 py-3">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => setDetailId(t.id)}>View</Button></td>
                  </tr>
                ))}</tbody>
              </table>
              <Pagination totalItems={totalItems} currentPage={currentPage} onPageChange={setCurrentPage} />
            </>
          )}
        </div>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Ticket" footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Create</Button></>}>
        <div className="space-y-3">
          <Input label="Customer Name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={TICKET_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required />
        </div>
      </Modal>
      <Modal isOpen={!!detailId} onClose={() => setDetailId(null)} title={selected?.subject || "Ticket"} footer={selected?.status !== "resolved" ? <><Button variant="outline" onClick={() => setDetailId(null)}>Close</Button><Button onClick={resolveTicket}>Resolve</Button></> : undefined}>
        {selected && (
          <div className="space-y-3">
            <p className="text-sm"><strong>Customer:</strong> {selected.customerName}</p>
            <p className="text-sm">{selected.description}</p>
            {selected.status !== "resolved" && <Textarea label="Resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} />}
            {selected.resolution && <p className="text-sm text-green-600"><strong>Resolution:</strong> {selected.resolution}</p>}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
