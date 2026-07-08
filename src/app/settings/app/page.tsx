"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getShopDocuments, createDocument, updateDocument } from "@/lib/firebase/firestore";
import { AppSettings } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";
import { Moon, Sun, Monitor } from "lucide-react";

export default function AppSettingsPage() {
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ language: "en", currency: "INR", timezone: "Asia/Kolkata", invoicePrefix: "INV", receiptFooter: "Thank you for your business!" });

  useEffect(() => {
    if (!profile?.shopId) return;
    getShopDocuments<AppSettings>("settings", profile.shopId).then((data) => {
      if (data[0]) { setSettingsId(data[0].id); setForm({ language: data[0].language, currency: data[0].currency, timezone: data[0].timezone, invoicePrefix: data[0].invoicePrefix, receiptFooter: data[0].receiptFooter }); }
    });
  }, [profile?.shopId]);

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = { ...form, theme, userId: profile.userId, shopId: profile.shopId };
      if (settingsId) await updateDocument("settings", settingsId, data);
      else await createDocument("settings", data);
      toast.success("Settings saved");
    } catch { toast.error("Failed"); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout title="App Settings">
      <SettingsNav />
      <div className="max-w-2xl mx-auto space-y-6">
        <Card title="Appearance">
          <div className="flex gap-3">
            {[{ value: "light" as const, icon: Sun, label: "Light" }, { value: "dark" as const, icon: Moon, label: "Dark" }, { value: "system" as const, icon: Monitor, label: "System" }].map((t) => (
              <button key={t.value} onClick={() => setTheme(t.value)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${theme === t.value ? "border-brand-blue bg-brand-blue/5" : "border-slate-200 dark:border-slate-700"}`}>
                <t.icon className="h-6 w-6" /><span className="text-sm">{t.label}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card title="Regional">
          <div className="space-y-4">
            <Select label="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} options={[{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }]} />
            <Select label="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} options={[{ value: "INR", label: "₹ Indian Rupee" }, { value: "USD", label: "$ US Dollar" }]} />
            <Select label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} options={[{ value: "Asia/Kolkata", label: "IST (India)" }, { value: "UTC", label: "UTC" }]} />
          </div>
        </Card>
        <Card title="Invoice & Receipt">
          <div className="space-y-4">
            <Input label="Invoice Prefix" value={form.invoicePrefix} onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })} />
            <Input label="Receipt Footer" value={form.receiptFooter} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} />
          </div>
        </Card>
        <Button onClick={handleSave} loading={loading}>Save Settings</Button>
      </div>
    </DashboardLayout>
  );
}
