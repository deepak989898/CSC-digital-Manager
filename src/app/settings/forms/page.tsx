"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/contexts/AuthContext";
import { useShopCollection } from "@/hooks/useShopCollection";
import { FormTemplate, FormFieldDef } from "@/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function FormTemplatesPage() {
  const { profile } = useAuth();
  const { data: templates, loading, create, refetch } = useShopCollection<FormTemplate>("formTemplates");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [fields, setFields] = useState<FormFieldDef[]>([
    { key: "fullName", label: "Full Name", type: "text", required: true, ocrMapping: "name" },
    { key: "mobile", label: "Mobile", type: "text", required: true },
  ]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await create({
        name,
        serviceName,
        fields,
        requiredDocuments: [],
        isActive: true,
        userId: profile.userId,
        shopId: profile.shopId || profile.userId,
      } as Omit<FormTemplate, "id" | "createdAt" | "updatedAt">);
      toast.success("Form template created");
      setName("");
      setServiceName("");
      await refetch();
    } catch {
      toast.error("Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Form Templates">
      <FeatureGate feature="autoFormFill">
        <SettingsNav />
        <div className="max-w-3xl mx-auto space-y-4">
          <Card title="Create Form Template">
            <form onSubmit={handleCreate} className="space-y-3">
              <Input label="Template Name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Service Name" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
              <p className="text-xs text-slate-500">Default fields include OCR mapping for name. Add more fields in Firestore or extend this UI later.</p>
              <Button type="submit" loading={saving}><Plus className="h-4 w-4" /> Create Template</Button>
            </form>
          </Card>
          <Card title="Templates">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-slate-500">No form templates yet</p>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-3 border rounded-lg dark:border-slate-700">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.serviceName} — {t.fields.length} fields</p>
                    </div>
                    <Badge status={t.isActive ? "active" : "inactive"} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
