"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { useAuth } from "@/contexts/AuthContext";
import { MarketingCampaign } from "@/types";
import { MARKETING_TEMPLATES } from "@/lib/constants";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { Card } from "@/components/ui/Card";
import { Megaphone, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function MarketingPage() {
  const { profile } = useAuth();
  const { data: campaigns, loading, create } = useShopCollection<MarketingCampaign>("marketing");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", channel: "email", subject: "", message: "", targetType: "all_customers" });

  const handleSave = async (send = false) => {
    if (!profile || !form.name) return;
    try {
      await create({
        ...form,
        channel: form.channel as "email" | "sms" | "whatsapp",
        targetType: form.targetType as "all_customers" | "selected" | "birthday" | "festival",
        status: send ? "sent" : "draft",
        sentAt: send ? new Date().toISOString() : undefined,
        recipientCount: 0,
        userId: profile.userId,
        shopId: profile.shopId,
      });
      toast.success(send ? "Campaign sent" : "Campaign saved as draft");
      setModalOpen(false);
    } catch { toast.error("Failed"); }
  };

  const applyTemplate = (template: typeof MARKETING_TEMPLATES[0]) => {
    setForm({ ...form, name: template.name, subject: template.subject || "", message: template.body });
    setModalOpen(true);
  };

  return (
    <DashboardLayout title="Marketing">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MARKETING_TEMPLATES.map((t) => (
            <Card key={t.name} className="cursor-pointer hover:shadow-md transition-shadow" >
              <div onClick={() => applyTemplate(t)}>
                <Badge status="submitted" label={t.category} />
                <h3 className="font-semibold mt-2">{t.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{t.body}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="flex justify-end"><Button onClick={() => setModalOpen(true)}><Megaphone className="h-4 w-4" /> New Campaign</Button></div>
        <Card title="Campaign History">
          {loading ? <p>Loading...</p> : campaigns.length === 0 ? <p className="text-sm text-slate-500">No campaigns yet</p> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2">Name</th><th className="text-left py-2">Channel</th><th className="text-left py-2">Target</th><th className="text-left py-2">Status</th></tr></thead>
              <tbody>{campaigns.map((c) => (
                <tr key={c.id} className="border-b"><td className="py-2 font-medium">{c.name}</td><td className="py-2 capitalize flex items-center gap-1">{c.channel === "email" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}{c.channel}</td><td className="py-2">{c.targetType.replace("_", " ")}</td><td className="py-2"><Badge status={c.status === "sent" ? "completed" : "pending"} label={c.status} /></td></tr>
              ))}</tbody>
            </table>
          )}
        </Card>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Campaign" footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button variant="outline" onClick={() => handleSave(false)}>Save Draft</Button><Button onClick={() => handleSave(true)}>Send</Button></>}>
        <div className="space-y-3">
          <Input label="Campaign Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label="Channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} options={[{ value: "email", label: "Email" }, { value: "sms", label: "SMS (Ready)" }, { value: "whatsapp", label: "WhatsApp (Ready)" }]} />
          <Select label="Target" value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })} options={[{ value: "all_customers", label: "All Customers" }, { value: "birthday", label: "Birthday Wishes" }, { value: "festival", label: "Festival Greetings" }]} />
          {form.channel === "email" && <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />}
          <Textarea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} required />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
