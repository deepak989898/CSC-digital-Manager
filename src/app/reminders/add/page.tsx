"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { createDocument, getShopDocuments } from "@/lib/firebase/firestore";
import { Customer, Application } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { REMINDER_TYPES } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function AddReminderPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ customerId: "", applicationId: "", type: "follow_up", reminderDate: "", message: "" });

  useEffect(() => {
    if (!profile?.shopId) return;
    Promise.all([
      getShopDocuments<Customer>("customers", profile.shopId),
      getShopDocuments<Application>("applications", profile.shopId),
    ]).then(([c, a]) => { setCustomers(c); setApplications(a); });
  }, [profile?.shopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form.customerId || !form.reminderDate) { toast.error("Fill required fields"); return; }
    const customer = customers.find((c) => c.id === form.customerId)!;
    const app = applications.find((a) => a.id === form.applicationId);
    setLoading(true);
    try {
      await createDocument("reminders", {
        customerId: form.customerId,
        customerName: customer.fullName,
        applicationId: form.applicationId || undefined,
        applicationRef: app?.referenceNumber,
        type: form.type,
        reminderDate: new Date(form.reminderDate).toISOString(),
        message: form.message,
        status: "pending",
        userId: profile.userId,
        shopId: profile.shopId,
      });
      toast.success("Reminder created");
      router.push("/reminders");
    } catch { toast.error("Failed to create reminder"); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout title="Add Reminder">
      <div className="max-w-2xl mx-auto">
        <Link href="/reminders" className="inline-flex items-center gap-1 text-sm text-slate-500 mb-4"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <Card title="New Reminder">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} options={customers.map((c) => ({ value: c.id, label: c.fullName }))} placeholder="Select customer" required />
            <Select label="Application (optional)" value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })} options={applications.filter((a) => !form.customerId || a.customerId === form.customerId).map((a) => ({ value: a.id, label: a.referenceNumber }))} placeholder="Select application" />
            <Select label="Reminder Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={REMINDER_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
            <Input label="Reminder Date & Time" type="datetime-local" value={form.reminderDate} onChange={(e) => setForm({ ...form, reminderDate: e.target.value })} required />
            <Textarea label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} required />
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>Save Reminder</Button>
              <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
