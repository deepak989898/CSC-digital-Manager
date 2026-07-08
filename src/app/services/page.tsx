"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { Service } from "@/types";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Plus, Briefcase, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export default function ServicesPage() {
  const { profile } = useAuth();
  const { data: services, loading, create, update } = useShopCollection<Service>("services");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    defaultPrice: "",
    requiredDocuments: "",
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "", defaultPrice: "", requiredDocuments: "" });
    setModalOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description,
      defaultPrice: String(service.defaultPrice),
      requiredDocuments: service.requiredDocuments.join(", "),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!profile || !form.name) {
      toast.error("Service name is required");
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name,
        description: form.description,
        defaultPrice: Number(form.defaultPrice) || 0,
        requiredDocuments: form.requiredDocuments
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        status: editing?.status || "active" as const,
        isDefault: editing?.isDefault || false,
        userId: profile.userId,
        shopId: profile.shopId,
      };
      if (editing) {
        await update(editing.id, data);
        toast.success("Service updated");
      } else {
        await create(data);
        toast.success("Service added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (service: Service) => {
    const newStatus = service.status === "active" ? "inactive" : "active";
    try {
      await update(service.id, { status: newStatus });
      toast.success(`Service ${newStatus === "active" ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Services">
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Services">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        {services.length === 0 ? (
          <EmptyState
            title="No services"
            description="Add services to start managing applications"
            actionLabel="Add Service"
            onAction={openAdd}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card key={service.id} className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Briefcase className="h-5 w-5 text-brand-blue" />
                  </div>
                  <Badge status={service.status} />
                </div>
                <h3 className="font-semibold text-slate-900">{service.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{service.description}</p>
                <p className="text-lg font-bold text-brand-blue mt-2">
                  {formatCurrency(service.defaultPrice)}
                </p>
                {service.requiredDocuments.length > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    Docs: {service.requiredDocuments.join(", ")}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(service)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleStatus(service)}>
                    {service.status === "active" ? (
                      <ToggleRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-slate-400" />
                    )}
                    {service.status === "active" ? "Disable" : "Enable"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Service" : "Add Service"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Service Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <Input label="Default Price (₹)" type="number" value={form.defaultPrice} onChange={(e) => setForm({ ...form, defaultPrice: e.target.value })} />
          <Input label="Required Documents (comma separated)" value={form.requiredDocuments} onChange={(e) => setForm({ ...form, requiredDocuments: e.target.value })} placeholder="aadhaar, photo, pan" />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
