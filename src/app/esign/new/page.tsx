"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/contexts/AuthContext";
import { useShopCollection } from "@/hooks/useShopCollection";
import { createDocument } from "@/lib/firebase/firestore";
import { uploadFile, getStoragePath } from "@/lib/firebase/storage";
import { ESIGN_CONSENT_TEXT } from "@/lib/masking";
import { ESIGN_PROVIDERS } from "@/lib/constants";
import { Customer, ESignProvider } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function NewESignPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: customers } = useShopCollection<Customer>("customers");
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    signerName: "",
    signerEmail: "",
    signerMobile: "",
    provider: "manual" as ESignProvider,
    documentName: "",
    documentURL: "",
  });

  const handleFile = async (file: File) => {
    if (!profile) return;
    setLoading(true);
    try {
      const shopId = profile.shopId || profile.userId;
      const { url } = await uploadFile(getStoragePath(shopId, "documents", file.name), file);
      setForm((f) => ({ ...f, documentURL: url, documentName: f.documentName || file.name }));
      toast.success("Document uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !consent) {
      toast.error("Consent required");
      return;
    }
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer || !form.documentURL) {
      toast.error("Select customer and upload document");
      return;
    }
    setLoading(true);
    try {
      const shopId = profile.shopId || profile.userId;
      const id = await createDocument("eSignRequests", {
        customerId: customer.id,
        customerName: customer.fullName,
        documentName: form.documentName,
        documentURL: form.documentURL,
        signerName: form.signerName || customer.fullName,
        signerEmail: form.signerEmail || customer.email,
        signerMobile: form.signerMobile || customer.mobile,
        provider: form.provider,
        status: "draft",
        consentAccepted: true,
        userId: profile.userId,
        shopId,
      });
      await createDocument("eSignAuditLogs", {
        eSignRequestId: id,
        action: "created",
        details: `eSign request created for ${form.documentName}`,
        performedByName: profile.displayName,
        userId: profile.userId,
        shopId,
      });
      toast.success("eSign request created (provider integration ready)");
      router.push(`/esign/${id}`);
    } catch {
      toast.error("Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="New eSign Request">
      <FeatureGate feature="eSign">
        <div className="max-w-2xl mx-auto space-y-4">
          <Card title="Send for Signature">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select label="Customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} options={customers.map((c) => ({ value: c.id, label: c.fullName }))} placeholder="Select customer" required />
              <Input label="Document Name" value={form.documentName} onChange={(e) => setForm({ ...form, documentName: e.target.value })} required />
              <div>
                <input ref={fileRef} type="file" accept="*/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} loading={loading}><Upload className="h-4 w-4" /> Upload Document</Button>
                {form.documentURL && <p className="text-xs text-green-600 mt-1">Document ready</p>}
              </div>
              <Input label="Signer Name" value={form.signerName} onChange={(e) => setForm({ ...form, signerName: e.target.value })} />
              <Input label="Signer Email" type="email" value={form.signerEmail} onChange={(e) => setForm({ ...form, signerEmail: e.target.value })} />
              <Input label="Signer Mobile" value={form.signerMobile} onChange={(e) => setForm({ ...form, signerMobile: e.target.value })} />
              <Select label="eSign Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as ESignProvider })} options={ESIGN_PROVIDERS.map((p) => ({ value: p.value, label: p.label }))} />
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                {ESIGN_CONSENT_TEXT}
              </label>
              <Button type="submit" loading={loading}>Create Request</Button>
            </form>
          </Card>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
