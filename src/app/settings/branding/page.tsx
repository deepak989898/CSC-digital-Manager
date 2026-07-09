"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments, createDocument, updateDocument } from "@/lib/firebase/firestore";
import { uploadFile, getStoragePath } from "@/lib/firebase/storage";
import { BrandingSettings } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function BrandingSettingsPage() {
  const { profile } = useAuth();
  const logoRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [form, setForm] = useState({
    brandName: "",
    primaryColor: "#2563eb",
    secondaryColor: "#1e293b",
    theme: "system" as BrandingSettings["theme"],
    invoiceFooter: "",
    loginTagline: "",
    emailSenderName: "",
    footerText: "",
    logoURL: "",
    faviconURL: "",
    isEnabled: true,
  });

  useEffect(() => {
    if (!profile?.shopId) return;
    (async () => {
      const list = await getShopDocuments<BrandingSettings>("brandingSettings", profile.shopId);
      if (list[0]) {
        const s = list[0];
        setSettingsId(s.id);
        setForm({
          brandName: s.brandName || "",
          primaryColor: s.primaryColor || "#2563eb",
          secondaryColor: s.secondaryColor || "#1e293b",
          theme: s.theme || "system",
          invoiceFooter: s.invoiceFooter || "",
          loginTagline: s.loginTagline || "",
          emailSenderName: s.emailSenderName || "",
          footerText: s.footerText || "",
          logoURL: s.logoURL || "",
          faviconURL: s.faviconURL || "",
          isEnabled: s.isEnabled ?? true,
        });
      }
      setLoading(false);
    })();
  }, [profile?.shopId]);

  const handleLogo = async (file: File) => {
    if (!profile) return;
    try {
      const shopId = profile.shopId || profile.userId;
      const { url } = await uploadFile(getStoragePath(shopId, "branding", file.name), file);
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
      const data = { ...form, userId: profile.userId, shopId };
      if (settingsId) {
        await updateDocument("brandingSettings", settingsId, data);
      } else {
        const id = await createDocument("brandingSettings", data);
        setSettingsId(id);
      }
      toast.success("Branding saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Branding">
      <FeatureGate feature="whiteLabel">
        <SettingsNav />
        <div className="max-w-2xl mx-auto">
          <Card title="White-Label Branding">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <Input label="Brand Name" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Primary Color" type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
                  <Input label="Secondary Color" type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} />
                </div>
                <Select
                  label="Theme"
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value as BrandingSettings["theme"] })}
                  options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]}
                />
                <div>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])} />
                  <Button type="button" variant="outline" onClick={() => logoRef.current?.click()}>
                    <Upload className="h-4 w-4" /> Upload Logo
                  </Button>
                  {form.logoURL && <p className="text-xs text-green-600 mt-1">Logo uploaded</p>}
                </div>
                <Input label="Login Tagline" value={form.loginTagline} onChange={(e) => setForm({ ...form, loginTagline: e.target.value })} />
                <Input label="Invoice Footer" value={form.invoiceFooter} onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })} />
                <Input label="Email Sender Name" value={form.emailSenderName} onChange={(e) => setForm({ ...form, emailSenderName: e.target.value })} />
                <Input label="Footer Text" value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isEnabled} onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })} />
                  Enable custom branding
                </label>
                <Button type="submit" loading={saving}>Save Branding</Button>
              </form>
            )}
          </Card>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
