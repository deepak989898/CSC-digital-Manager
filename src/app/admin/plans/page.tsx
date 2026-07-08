"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getDocuments, createDocument, updateDocument, deleteDocument } from "@/lib/firebase/firestore";
import { seedDefaultPlans } from "@/lib/subscription";
import { Plan } from "@/types";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminPlansPage() {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", monthlyPrice: "", yearlyPrice: "", customerLimit: "", applicationLimit: "", storageLimitMB: "", staffLimit: "", features: "" });
  const [saving, setSaving] = useState(false);

  const loadPlans = async () => {
    if (profile) await seedDefaultPlans(profile.userId);
    const data = await getDocuments<Plan>("plans");
    setPlans(data.sort((a, b) => a.monthlyPrice - b.monthlyPrice));
  };

  useEffect(() => { loadPlans(); }, [profile]);

  const openEdit = (plan?: Plan) => {
    if (plan) {
      setEditing(plan);
      setForm({ name: plan.name, slug: plan.slug, monthlyPrice: String(plan.monthlyPrice), yearlyPrice: String(plan.yearlyPrice), customerLimit: String(plan.customerLimit), applicationLimit: String(plan.applicationLimit), storageLimitMB: String(plan.storageLimitMB), staffLimit: String(plan.staffLimit), features: plan.features.join("\n") });
    } else {
      setEditing(null);
      setForm({ name: "", slug: "", monthlyPrice: "", yearlyPrice: "", customerLimit: "100", applicationLimit: "200", storageLimitMB: "500", staffLimit: "2", features: "" });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!profile || !form.name) return;
    setSaving(true);
    try {
      const data = {
        name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s/g, "-"),
        monthlyPrice: Number(form.monthlyPrice), yearlyPrice: Number(form.yearlyPrice),
        customerLimit: Number(form.customerLimit), applicationLimit: Number(form.applicationLimit),
        storageLimitMB: Number(form.storageLimitMB), staffLimit: Number(form.staffLimit),
        features: form.features.split("\n").filter(Boolean), status: "active" as const,
        userId: profile.userId, shopId: "platform",
      };
      if (editing) await updateDocument("plans", editing.id, data);
      else await createDocument("plans", data);
      toast.success("Plan saved");
      setModalOpen(false);
      await loadPlans();
    } catch { toast.error("Failed to save plan"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    try { await deleteDocument("plans", id); toast.success("Plan deleted"); await loadPlans(); }
    catch { toast.error("Failed to delete"); }
  };

  return (
    <DashboardLayout title="Manage Plans">
      <div className="space-y-4">
        <div className="flex justify-end"><Button onClick={() => openEdit()}><Plus className="h-4 w-4" /> Add Plan</Button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{plan.name}</h3>
                <Badge status={plan.status} />
              </div>
              <p className="text-2xl font-bold text-brand-blue">{formatCurrency(plan.monthlyPrice)}<span className="text-sm font-normal text-slate-500 dark:text-slate-400">/mo</span></p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{plan.customerLimit < 0 ? "Unlimited" : plan.customerLimit} customers · {plan.staffLimit} staff</p>
              <div className="flex gap-2 mt-4">
                <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Plan" : "Add Plan"} footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}>
        <div className="space-y-3">
          <Input label="Plan Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monthly Price" type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} />
            <Input label="Yearly Price" type="number" value={form.yearlyPrice} onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })} />
            <Input label="Customer Limit (-1 = unlimited)" type="number" value={form.customerLimit} onChange={(e) => setForm({ ...form, customerLimit: e.target.value })} />
            <Input label="Application Limit" type="number" value={form.applicationLimit} onChange={(e) => setForm({ ...form, applicationLimit: e.target.value })} />
            <Input label="Storage MB" type="number" value={form.storageLimitMB} onChange={(e) => setForm({ ...form, storageLimitMB: e.target.value })} />
            <Input label="Staff Limit" type="number" value={form.staffLimit} onChange={(e) => setForm({ ...form, staffLimit: e.target.value })} />
          </div>
          <Textarea label="Features (one per line)" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={4} />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
