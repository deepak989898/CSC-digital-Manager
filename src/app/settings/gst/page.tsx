"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments, createDocument, updateDocument } from "@/lib/firebase/firestore";
import { uploadFile, getStoragePath } from "@/lib/firebase/storage";
import { INDIAN_STATES } from "@/lib/constants";
import { INDIAN_STATE_CODES } from "@/lib/gst";
import { GstSettings } from "@/types";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function GstSettingsPage() {
  const { profile } = useAuth();
  const logoRef = useRef<HTMLInputElement>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gstin: "",
    legalName: "",
    billingAddress: "",
    state: "",
    stateCode: "",
    invoicePrefix: "INV",
    invoiceTerms: "",
    invoiceFooter: "",
    logoURL: "",
    signatureURL: "",
    gstEnabled: true,
    defaultCgstRate: "9",
    defaultSgstRate: "9",
    defaultIgstRate: "18",
  });

  useEffect(() => {
    if (!profile?.shopId) return;
    (async () => {
      const list = await getShopDocuments<GstSettings>("gstSettings", profile.shopId);
      if (list[0]) {
        const s = list[0];
        setSettingsId(s.id);
        setForm({
          gstin: s.gstin || "",
          legalName: s.legalName || "",
          billingAddress: s.billingAddress || "",
          state: s.state || "",
          stateCode: s.stateCode || "",
          invoicePrefix: s.invoicePrefix || "INV",
          invoiceTerms: s.invoiceTerms || "",
          invoiceFooter: s.invoiceFooter || "",
          logoURL: s.logoURL || "",
          signatureURL: s.signatureURL || "",
          gstEnabled: s.gstEnabled ?? true,
          defaultCgstRate: String(s.defaultCgstRate ?? 9),
          defaultSgstRate: String(s.defaultSgstRate ?? 9),
          defaultIgstRate: String(s.defaultIgstRate ?? 18),
        });
      }
      setLoading(false);
    })();
  }, [profile?.shopId]);

  const handleState = (state: string) => {
    setForm({ ...form, state, stateCode: INDIAN_STATE_CODES[state] || "" });
  };

  const handleLogo = async (file: File) => {
    if (!profile) return;
    try {
      const shopId = profile.shopId || profile.userId;
      const { url } = await uploadFile(getStoragePath(shopId, "invoices", file.name), file);
      setForm((f) => ({ ...f, logoURL: url }));
      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const shopId = profile.shopId || profile.userId;
      const data = {
        ...form,
        defaultCgstRate: Number(form.defaultCgstRate),
        defaultSgstRate: Number(form.defaultSgstRate),
        defaultIgstRate: Number(form.defaultIgstRate),
        userId: profile.userId,
        shopId,
      };
      if (settingsId) {
        await updateDocument("gstSettings", settingsId, data);
      } else {
        const id = await createDocument("gstSettings", data);
        setSettingsId(id);
      }
      toast.success("GST settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="GST Settings">
      <FeatureGate feature="gstInvoice">
        <SettingsNav />
        <div className="max-w-2xl mx-auto">
          <Card title="GST & Invoice Settings">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.gstEnabled} onChange={(e) => setForm({ ...form, gstEnabled: e.target.checked })} />
                  Enable GST invoicing
                </label>
                <Input label="GSTIN (optional)" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
                <Input label="Legal Business Name" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} required />
                <Input label="Billing Address" value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} required />
                <Select label="State" value={form.state} onChange={(e) => handleState(e.target.value)} options={INDIAN_STATES.map((s) => ({ value: s, label: s }))} placeholder="Select state" />
                <Input label="Invoice Prefix" value={form.invoicePrefix} onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })} />
                <Input label="Invoice Terms" value={form.invoiceTerms} onChange={(e) => setForm({ ...form, invoiceTerms: e.target.value })} placeholder="e.g. Payment due within 7 days" />
                <Textarea
                  label="Invoice Footer"
                  value={form.invoiceFooter}
                  onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
                  rows={3}
                  placeholder="Thank you message, bank details, terms — shown at bottom of every invoice"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input label="CGST %" type="number" value={form.defaultCgstRate} onChange={(e) => setForm({ ...form, defaultCgstRate: e.target.value })} />
                  <Input label="SGST %" type="number" value={form.defaultSgstRate} onChange={(e) => setForm({ ...form, defaultSgstRate: e.target.value })} />
                  <Input label="IGST %" type="number" value={form.defaultIgstRate} onChange={(e) => setForm({ ...form, defaultIgstRate: e.target.value })} />
                </div>
                <div>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])} />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => logoRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Upload Invoice Logo
                    </Button>
                    {form.logoURL ? (
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.logoURL}
                          alt="Invoice logo preview"
                          className="h-12 w-12 object-contain"
                        />
                        <span className="text-xs text-green-600">Logo ready for invoices</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <Button type="submit" loading={saving}>Save Settings</Button>
              </form>
            )}
          </Card>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
