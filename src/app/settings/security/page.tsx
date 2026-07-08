"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettingsNav } from "@/components/layout/SettingsNav";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { resetPassword } from "@/lib/firebase/auth";
import { toast } from "sonner";
import { Shield, Key } from "lucide-react";

export default function SecuritySettingsPage() {
  const { user, profile } = useAuth();

  const handleResetPassword = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      toast.success("Password reset email sent");
    } catch { toast.error("Failed to send reset email"); }
  };

  return (
    <DashboardLayout title="Security Settings">
      <SettingsNav />
      <div className="max-w-2xl mx-auto space-y-6">
        <Card title="Account Security">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <Shield className="h-5 w-5 text-brand-blue" />
              <div>
                <p className="text-sm font-medium">Logged in as</p>
                <p className="text-sm text-slate-600">{profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-slate-500">Change your account password</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetPassword}>Reset Password</Button>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Multi-tenant security:</strong> Your data is isolated by shop ID. Staff members only access data for your shop with assigned permissions.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
