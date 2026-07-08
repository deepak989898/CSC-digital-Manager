"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments, createDocument, updateDocument } from "@/lib/firebase/firestore";
import { NotificationSettings, NotificationEvent } from "@/types";
import { NOTIFICATION_EVENT_LABELS } from "@/lib/notifications";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";

const EVENTS: NotificationEvent[] = [
  "application_created", "application_status_changed", "payment_received",
  "payment_pending", "document_missing", "subscription_expiring", "subscription_expired",
];

export default function NotificationSettingsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [form, setForm] = useState({
    emailEnabled: true, smsEnabled: false, whatsappEnabled: false, inAppEnabled: true,
    smtpHost: "", smtpPort: "587", smtpUser: "", smtpPass: "", emailFrom: "",
    whatsappApiKey: "", smsApiKey: "",
  });

  useEffect(() => {
    if (!profile?.shopId) return;
    getShopDocuments<NotificationSettings>("notificationSettings", profile.shopId).then((data) => {
      if (data[0]) {
        setSettingsId(data[0].id);
        setForm({
          emailEnabled: data[0].emailEnabled,
          smsEnabled: data[0].smsEnabled,
          whatsappEnabled: data[0].whatsappEnabled,
          inAppEnabled: data[0].inAppEnabled,
          smtpHost: data[0].smtpHost || "",
          smtpPort: data[0].smtpPort || "587",
          smtpUser: data[0].smtpUser || "",
          smtpPass: data[0].smtpPass || "",
          emailFrom: data[0].emailFrom || "",
          whatsappApiKey: data[0].whatsappApiKey || "",
          smsApiKey: data[0].smsApiKey || "",
        });
      }
    });
  }, [profile?.shopId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const data = { ...form, events: {}, userId: profile.userId, shopId: profile.shopId };
      if (settingsId) await updateDocument("notificationSettings", settingsId, data);
      else await createDocument("notificationSettings", data);
      toast.success("Notification settings saved");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout title="Notification Settings">
      <SettingsNav />
      <div className="max-w-2xl mx-auto space-y-6">
        <Card title="Channels">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-3">
              {[
                { key: "inAppEnabled", label: "In-App Notifications" },
                { key: "emailEnabled", label: "Email Notifications" },
                { key: "smsEnabled", label: "SMS Notifications (provider-ready)" },
                { key: "whatsappEnabled", label: "WhatsApp Notifications (provider-ready)" },
              ].map((ch) => (
                <label key={ch.key} className="flex items-center gap-3">
                  <input type="checkbox" checked={form[ch.key as keyof typeof form] as boolean} onChange={(e) => setForm({ ...form, [ch.key]: e.target.checked })} className="rounded" />
                  <span className="text-sm font-medium">{ch.label}</span>
                </label>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Email / SMTP Settings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="SMTP Host" value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} placeholder="smtp.example.com" />
                <Input label="SMTP Port" value={form.smtpPort} onChange={(e) => setForm({ ...form, smtpPort: e.target.value })} />
                <Input label="SMTP User" value={form.smtpUser} onChange={(e) => setForm({ ...form, smtpUser: e.target.value })} />
                <Input label="SMTP Password" type="password" value={form.smtpPass} onChange={(e) => setForm({ ...form, smtpPass: e.target.value })} />
                <Input label="From Email" value={form.emailFrom} onChange={(e) => setForm({ ...form, emailFrom: e.target.value })} className="sm:col-span-2" />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Messaging API Keys</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="WhatsApp API Key" value={form.whatsappApiKey} onChange={(e) => setForm({ ...form, whatsappApiKey: e.target.value })} placeholder="Add later" />
                <Input label="SMS API Key" value={form.smsApiKey} onChange={(e) => setForm({ ...form, smsApiKey: e.target.value })} placeholder="Add later" />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Supported Events</h4>
              <div className="flex flex-wrap gap-2">
                {EVENTS.map((e) => (
                  <span key={e} className="text-xs bg-slate-100 px-2 py-1 rounded">{NOTIFICATION_EVENT_LABELS[e]}</span>
                ))}
              </div>
            </div>

            <Button type="submit" loading={loading}>Save Settings</Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
