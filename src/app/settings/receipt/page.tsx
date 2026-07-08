"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments, createDocument, updateDocument } from "@/lib/firebase/firestore";
import { uploadFile, getStoragePath } from "@/lib/firebase/storage";
import { ReceiptSettings } from "@/types";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";

export default function ReceiptSettingsPage() {
  const { profile } = useAuth();
  const sigRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [form, setForm] = useState({ showLogo: true, termsAndConditions: "", gstNumber: "", signatureURL: "", footerText: "Thank you for your business!" });

  useEffect(() => {
    if (!profile?.shopId) return;
    getShopDocuments<ReceiptSettings>("receiptSettings", profile.shopId).then((data) => {
      if (data[0]) { setSettingsId(data[0].id); setForm({ showLogo: data[0].showLogo, termsAndConditions: data[0].termsAndConditions, gstNumber: data[0].gstNumber || "", signatureURL: data[0].signatureURL || "", footerText: data[0].footerText }); }
    });
  }, [profile?.shopId]);

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    try {
      const path = getStoragePath(profile.shopId, "profile", file.name);
      const { url } = await uploadFile(path, file);
      setForm({ ...form, signatureURL: url });
      toast.success("Signature uploaded");
    } catch { toast.error("Upload failed"); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      const data = { ...form, userId: profile.userId, shopId: profile.shopId };
      if (settingsId) await updateDocument("receiptSettings", settingsId, data);
      else await createDocument("receiptSettings", data);
      toast.success("Receipt settings saved");
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout title="Receipt Settings">
      <SettingsNav />
      <div className="max-w-2xl mx-auto">
        <Card title="Customize Receipts">
          <form onSubmit={handleSave} className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={form.showLogo} onChange={(e) => setForm({ ...form, showLogo: e.target.checked })} className="rounded" />
              <span className="text-sm font-medium">Show shop logo on receipt</span>
            </label>
            <Input label="GST Number (optional)" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
            <Textarea label="Terms & Conditions" value={form.termsAndConditions} onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })} rows={3} />
            <Input label="Footer Text" value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} />
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Digital Signature (optional)</p>
              <input ref={sigRef} type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => sigRef.current?.click()}>Upload Signature</Button>
              {form.signatureURL && <p className="text-xs text-green-600 mt-1">Signature uploaded</p>}
            </div>
            <Button type="submit" loading={loading}>Save Settings</Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
