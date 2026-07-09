"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { createDocument, updateDocument, getDocuments } from "@/lib/firebase/firestore";
import { ESIGN_PROVIDERS } from "@/lib/constants";
import { ESignProviderConfig, ESignProvider } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";

export default function AdminESignSettingsPage() {
  const [configs, setConfigs] = useState<ESignProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    provider: "manual" as ESignProvider,
    apiKey: "",
    webhookSecret: "",
  });

  const load = async () => {
    const all = await getDocuments<ESignProviderConfig>("eSignProviders");
    setConfigs(all);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const existing = configs.find((c) => c.provider === form.provider);
      const data = {
        provider: form.provider,
        apiKey: form.apiKey || undefined,
        webhookSecret: form.webhookSecret || undefined,
        isActive: true,
        isConfigured: Boolean(form.apiKey),
        userId: "admin",
        shopId: "platform",
      };
      if (existing) {
        await updateDocument("eSignProviders", existing.id, data);
      } else {
        await createDocument("eSignProviders", data);
      }
      toast.success("eSign provider config saved (integration ready)");
      await load();
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <DashboardLayout title="eSign Provider Settings">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card title="Configure eSign Provider">
          <p className="text-sm text-slate-500 mb-4">
            Provider-ready structure. Add API keys when you have a verified eSign provider account.
          </p>
          <form onSubmit={handleSave} className="space-y-4">
            <Select
              label="Provider"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value as ESignProvider })}
              options={ESIGN_PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
            />
            <Input label="API Key" type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="Set ESIGN_API_KEY in Vercel env" />
            <Input label="Webhook Secret" type="password" value={form.webhookSecret} onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })} />
            <Button type="submit">Save Configuration</Button>
          </form>
        </Card>
        <Card title="Configured Providers">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : configs.length === 0 ? (
            <p className="text-sm text-slate-500">No providers configured yet</p>
          ) : (
            <div className="space-y-2">
              {configs.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-3 border rounded-lg dark:border-slate-700">
                  <span className="font-medium capitalize">{c.provider.replace(/_/g, " ")}</span>
                  <Badge status={c.isConfigured ? "active" : "pending"} label={c.isConfigured ? "Configured" : "Not configured"} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
