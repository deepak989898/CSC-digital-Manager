"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { createDocument } from "@/lib/firebase/firestore";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { INDIAN_STATES } from "@/lib/constants";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { notifyShopEvent } from "@/lib/notifications";
import { toast } from "sonner";

export default function AddCustomerPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { checkCustomerLimit } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    aadhaarLast4: "",
    notes: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const shopId = profile.shopId || profile.userId;
    if (!checkCustomerLimit()) { setShowUpgrade(true); return; }
    if (!form.fullName || !form.mobile || !form.address || !form.aadhaarLast4) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.aadhaarLast4.length !== 4 || !/^\d{4}$/.test(form.aadhaarLast4)) {
      toast.error("Aadhaar last 4 digits must be exactly 4 numbers");
      return;
    }
    setLoading(true);
    try {
      await createDocument("customers", {
        ...form,
        userId: profile.userId,
        shopId,
      });

      // Notification should not block customer creation success
      try {
        await notifyShopEvent(
          shopId,
          profile.userId,
          "application_created",
          "New Customer",
          `${form.fullName} was added`
        );
      } catch {
        // Ignore notification failures
      }

      toast.success("Customer added successfully");
      router.push("/customers");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add customer";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Add Customer">
      <div className="max-w-2xl mx-auto">
        <Card title="New Customer">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                required
              />
              <Input
                label="Mobile Number"
                value={form.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                placeholder="10 digit mobile"
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              <Input
                label="Aadhaar Last 4 Digits"
                value={form.aadhaarLast4}
                onChange={(e) => handleChange("aadhaarLast4", e.target.value.slice(0, 4))}
                maxLength={4}
                required
              />
            </div>
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
              <Select
                label="State"
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                placeholder="Select state"
              />
              <Input
                label="Pincode"
                value={form.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                maxLength={6}
              />
            </div>
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>
                Save Customer
              </Button>
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} resource="Customers" />
    </DashboardLayout>
  );
}
