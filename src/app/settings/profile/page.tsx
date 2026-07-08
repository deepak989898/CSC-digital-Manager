"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { updateDocument } from "@/lib/firebase/firestore";
import { uploadFile, getStoragePath } from "@/lib/firebase/storage";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { INDIAN_STATES } from "@/lib/constants";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { SettingsNav } from "@/components/layout/SettingsNav";

export default function ProfileSettingsPage() {
  const { profile, shop, refreshProfile } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    cscId: "",
    photoURL: "",
  });

  useEffect(() => {
    if (shop) {
      setForm({
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        mobile: shop.mobile,
        email: shop.email,
        address: shop.address,
        city: shop.city,
        state: shop.state,
        pincode: shop.pincode,
        cscId: shop.cscId || "",
        photoURL: shop.photoURL || "",
      });
    }
  }, [shop]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const path = getStoragePath(profile.shopId, "profile", file.name);
      const { url } = await uploadFile(path, file);
      setForm((prev) => ({ ...prev, photoURL: url }));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !shop) return;
    if (!form.shopName || !form.ownerName || !form.mobile || !form.address) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await updateDocument("shops", shop.id, {
        shopName: form.shopName,
        ownerName: form.ownerName,
        mobile: form.mobile,
        email: form.email,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        cscId: form.cscId || undefined,
        photoURL: form.photoURL || undefined,
      });
      await updateDocument("users", profile.id, {
        displayName: form.ownerName,
        profileComplete: true,
        photoURL: form.photoURL || undefined,
      });
      await refreshProfile();
      toast.success("Profile saved successfully");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const isOnboarding = profile && !profile.profileComplete;

  return (
    <DashboardLayout title={isOnboarding ? "Complete Your Profile" : "Profile Settings"}>
      <SettingsNav />
      <div className="max-w-2xl mx-auto">
        {isOnboarding && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Welcome! Please complete your shop profile to start using CSC Digital Manager.
            </p>
          </div>
        )}

        <Card title="Shop Profile">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                {form.photoURL ? (
                  <Image src={form.photoURL} alt="Shop" fill className="object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} loading={uploading}>
                  Upload Shop Photo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Shop Name" value={form.shopName} onChange={(e) => handleChange("shopName", e.target.value)} required />
              <Input label="Owner Name" value={form.ownerName} onChange={(e) => handleChange("ownerName", e.target.value)} required />
              <Input label="Mobile Number" value={form.mobile} onChange={(e) => handleChange("mobile", e.target.value)} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
              <Input label="CSC ID / VLE ID" value={form.cscId} onChange={(e) => handleChange("cscId", e.target.value)} />
            </div>
            <Input label="Address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} required />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="City" value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
              <Select label="State" value={form.state} onChange={(e) => handleChange("state", e.target.value)} options={INDIAN_STATES.map((s) => ({ value: s, label: s }))} placeholder="Select state" />
              <Input label="Pincode" value={form.pincode} onChange={(e) => handleChange("pincode", e.target.value)} maxLength={6} />
            </div>

            <div className="flex gap-3">
              <Button type="submit" loading={loading}>
                {isOnboarding ? "Complete Setup" : "Save Changes"}
              </Button>
              {!isOnboarding && (
                <Button variant="outline" type="button" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
