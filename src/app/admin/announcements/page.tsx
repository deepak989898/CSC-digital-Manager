"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getDocuments, createDocument, updateDocument } from "@/lib/firebase/firestore";
import { Announcement } from "@/types";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Megaphone } from "lucide-react";

export default function AdminAnnouncementsPage() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState({ title: "", message: "", target: "all" });
  const [sending, setSending] = useState(false);

  const load = () => getDocuments<Announcement>("announcements").then(setAnnouncements);
  useEffect(() => { load(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form.title) return;
    setSending(true);
    try {
      await createDocument("announcements", {
        title: form.title,
        message: form.message,
        target: form.target,
        status: "sent",
        sentAt: new Date().toISOString(),
        userId: profile.userId,
        shopId: "platform",
      });
      toast.success("Announcement sent to all shops");
      setForm({ title: "", message: "", target: "all" });
      await load();
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  };

  return (
    <DashboardLayout title="Announcements">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Send Announcement">
          <form onSubmit={handleSend} className="space-y-4">
            <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Textarea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} required />
            <Select label="Target" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} options={[{ value: "all", label: "All Shops" }, { value: "active", label: "Active Shops" }, { value: "trial", label: "Trial Shops" }, { value: "expired", label: "Expired Shops" }]} />
            <Button type="submit" loading={sending}><Megaphone className="h-4 w-4" /> Send Announcement</Button>
          </form>
        </Card>
        <Card title="Past Announcements">
          {announcements.length === 0 ? <p className="text-sm text-slate-500">No announcements yet</p> : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="p-3 border border-slate-100 rounded-lg">
                  <div className="flex justify-between items-start">
                    <p className="font-medium">{a.title}</p>
                    <Badge status="submitted" label={a.target} />
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
