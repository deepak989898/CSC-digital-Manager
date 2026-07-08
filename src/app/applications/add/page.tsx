"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { createDocument, getShopDocuments } from "@/lib/firebase/firestore";
import { Customer, Service } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { generateReferenceNumber } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { notifyShopEvent } from "@/lib/notifications";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function AddApplicationPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { checkApplicationLimit } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    serviceId: "",
    applicationFee: "",
    amountPaid: "0",
    notes: "",
    dueDate: "",
  });
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);

  useEffect(() => {
    if (!profile?.shopId) return;
    Promise.all([
      getShopDocuments<Customer>("customers", profile.shopId),
      getShopDocuments<Service>("services", profile.shopId),
    ]).then(([c, s]) => {
      setCustomers(c);
      setServices(s.filter((sv) => sv.status === "active"));
    });
  }, [profile?.shopId]);

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s) => s.id === serviceId);
    setForm((prev) => ({
      ...prev,
      serviceId,
      applicationFee: service ? String(service.defaultPrice) : "",
    }));
    setRequiredDocs(service?.requiredDocuments || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form.customerId || !form.serviceId) {
      toast.error("Please select customer and service");
      return;
    }
    if (!checkApplicationLimit()) { setShowUpgrade(true); return; }
    setLoading(true);
    try {
      const customer = customers.find((c) => c.id === form.customerId);
      const service = services.find((s) => s.id === form.serviceId);
      if (!customer || !service) {
        toast.error("Selected customer or service not found. Please reselect.");
        return;
      }
      const existingApps = await getShopDocuments("applications", profile.shopId);
      const refNumber = generateReferenceNumber("APP", existingApps.length);
      const fee = Number(form.applicationFee) || 0;
      const paid = Number(form.amountPaid) || 0;
      const paymentStatus = paid <= 0 ? "unpaid" : paid < fee ? "partial" : "paid";

      await createDocument("applications", {
        referenceNumber: refNumber,
        customerId: form.customerId,
        customerName: customer.fullName,
        serviceId: form.serviceId,
        serviceName: service.name,
        status: "pending",
        applicationFee: fee,
        amountPaid: paid,
        paymentStatus,
        notes: form.notes,
        dueDate: form.dueDate || undefined,
        userId: profile.userId,
        shopId: profile.shopId,
      });

      // Notification should not block core create flow
      try {
        await notifyShopEvent(
          profile.shopId,
          profile.userId,
          "application_created",
          "New Application",
          `${refNumber} created for ${customer.fullName}`,
          "/applications"
        );
      } catch {
        // Ignore notification failure
      }

      toast.success("Application created");
      router.push("/applications");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create application";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="New Application">
      <div className="max-w-2xl mx-auto">
        <Link href="/applications" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Card title="Create Application">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Select Customer"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              options={customers.map((c) => ({ value: c.id, label: `${c.fullName} (${c.mobile})` }))}
              placeholder="Choose customer"
              required
            />
            <Select
              label="Select Service"
              value={form.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              options={services.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Choose service"
              required
            />
            {requiredDocs.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">Required Documents:</p>
                <div className="flex flex-wrap gap-2">
                  {requiredDocs.map((doc) => (
                    <span key={doc} className="text-xs bg-white px-2 py-1 rounded border border-blue-200 text-blue-700">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input label="Application Fee (₹)" type="number" value={form.applicationFee} onChange={(e) => setForm({ ...form, applicationFee: e.target.value })} />
              <Input label="Amount Paid (₹)" type="number" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
            </div>
            <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>Create Application</Button>
              <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} resource="Applications" />
    </DashboardLayout>
  );
}
