"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { createDocument } from "@/lib/firebase/firestore";
import { ALL_PERMISSIONS, STAFF_ROLES, ROLE_DEFAULT_PERMISSIONS } from "@/lib/constants";
import { Permission } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { toast } from "sonner";

export default function AddStaffPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { checkStaffLimit } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", mobile: "", role: "operator" });
  const [permissions, setPermissions] = useState<Permission[]>(ROLE_DEFAULT_PERMISSIONS.operator);

  const handleRoleChange = (role: string) => {
    setForm({ ...form, role });
    setPermissions(ROLE_DEFAULT_PERMISSIONS[role] || []);
  };

  const togglePermission = (perm: Permission) => {
    setPermissions((prev) => prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!checkStaffLimit()) { setShowUpgrade(true); return; }
    if (!form.name || !form.email) { toast.error("Name and email required"); return; }

    setLoading(true);
    try {
      await createDocument("staff", {
        name: form.name,
        email: form.email.toLowerCase(),
        mobile: form.mobile,
        role: form.role,
        permissions,
        status: "invited",
        userId: profile.userId,
        shopId: profile.shopId,
      });
      toast.success("Staff invited. They can sign up with this email.");
      router.push("/staff");
    } catch { toast.error("Failed to add staff"); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout title="Add Staff">
      <SettingsNav />
      <div className="max-w-2xl mx-auto">
        <Card title="Invite Staff Member">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Input label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
              <Select label="Role" value={form.role} onChange={(e) => handleRoleChange(e.target.value)} options={STAFF_ROLES.map((r) => ({ value: r.value, label: r.label }))} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Permissions</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={permissions.includes(p.value)} onChange={() => togglePermission(p.value)} className="rounded" />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-500">Staff member will sign up using the email above to get access.</p>
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>Invite Staff</Button>
              <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} resource="Staff Members" />
    </DashboardLayout>
  );
}
