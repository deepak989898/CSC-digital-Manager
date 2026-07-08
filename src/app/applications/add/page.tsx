"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { TableSkeleton } from "@/components/ui/Skeleton";
import { generateReferenceNumber } from "@/lib/utils";
import { INDIAN_STATES } from "@/lib/constants";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { notifyShopEvent } from "@/lib/notifications";
import { toast } from "sonner";
import { ArrowLeft, UserPlus } from "lucide-react";

const NEW_CUSTOMER_VALUE = "__new_customer__";

const emptyNewCustomer = {
  fullName: "",
  mobile: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  aadhaarLast4: "",
};

function AddApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();
  const { checkApplicationLimit, checkCustomerLimit } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState<"Applications" | "Customers" | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerId: searchParams.get("customerId") || "",
    serviceId: "",
    applicationFee: "",
    amountPaid: "0",
    notes: "",
    dueDate: "",
  });
  const [newCustomer, setNewCustomer] = useState(emptyNewCustomer);
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);

  const isNewCustomer = form.customerId === NEW_CUSTOMER_VALUE;

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

  const handleCustomerChange = (value: string) => {
    setForm((prev) => ({ ...prev, customerId: value }));
    if (value !== NEW_CUSTOMER_VALUE) {
      setNewCustomer(emptyNewCustomer);
    }
  };

  const validateNewCustomer = (): string | null => {
    if (!newCustomer.fullName.trim()) return "Enter customer full name";
    if (!newCustomer.mobile.trim()) return "Enter customer mobile number";
    if (!newCustomer.address.trim()) return "Enter customer address";
    if (!/^\d{4}$/.test(newCustomer.aadhaarLast4)) {
      return "Aadhaar last 4 digits must be exactly 4 numbers";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!form.customerId) {
      toast.error("Please select a customer or choose New Customer");
      return;
    }
    if (!form.serviceId) {
      toast.error("Please select a service");
      return;
    }

    const shopId = profile.shopId || profile.userId;
    if (!checkApplicationLimit()) {
      setShowUpgrade("Applications");
      return;
    }

    if (isNewCustomer) {
      const err = validateNewCustomer();
      if (err) {
        toast.error(err);
        return;
      }
      if (!checkCustomerLimit()) {
        setShowUpgrade("Customers");
        return;
      }
    }

    setLoading(true);
    try {
      let customerId = form.customerId;
      let customerName = "";

      if (isNewCustomer) {
        customerId = await createDocument("customers", {
          fullName: newCustomer.fullName.trim(),
          mobile: newCustomer.mobile.trim(),
          email: newCustomer.email.trim() || undefined,
          address: newCustomer.address.trim(),
          city: newCustomer.city.trim(),
          state: newCustomer.state,
          pincode: newCustomer.pincode.trim(),
          aadhaarLast4: newCustomer.aadhaarLast4,
          notes: "",
          leadStatus: "converted",
          priority: "medium",
          userId: profile.userId,
          shopId,
        });
        customerName = newCustomer.fullName.trim();
      } else {
        const customer = customers.find((c) => c.id === form.customerId);
        if (!customer) {
          toast.error("Selected customer not found. Please reselect.");
          return;
        }
        customerId = customer.id;
        customerName = customer.fullName;
      }

      const service = services.find((s) => s.id === form.serviceId);
      if (!service) {
        toast.error("Selected service not found. Please reselect.");
        return;
      }

      const existingApps = await getShopDocuments("applications", shopId);
      const refNumber = generateReferenceNumber("APP", existingApps.length);
      const fee = Number(form.applicationFee) || 0;
      const paid = Number(form.amountPaid) || 0;
      const paymentStatus = paid <= 0 ? "unpaid" : paid < fee ? "partial" : "paid";

      await createDocument("applications", {
        referenceNumber: refNumber,
        customerId,
        customerName,
        serviceId: form.serviceId,
        serviceName: service.name,
        status: "pending",
        applicationFee: fee,
        amountPaid: paid,
        paymentStatus,
        notes: form.notes,
        dueDate: form.dueDate || undefined,
        lastUpdatedById: profile.userId,
        lastUpdatedByName: profile.displayName,
        userId: profile.userId,
        shopId,
      });

      try {
        await notifyShopEvent(
          shopId,
          profile.userId,
          "application_created",
          isNewCustomer ? "New Customer + Application" : "New Application",
          `${refNumber} created for ${customerName}`,
          "/applications"
        );
      } catch {
        // Ignore notification failure
      }

      toast.success(
        isNewCustomer
          ? "Customer added and application created"
          : "Application created"
      );
      router.push("/applications");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create application";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = [
    { value: NEW_CUSTOMER_VALUE, label: "+ New Customer" },
    ...customers.map((c) => ({
      value: c.id,
      label: `${c.fullName} (${c.mobile})`,
    })),
  ];

  return (
    <DashboardLayout title="New Application">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/applications"
          className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Card title="Create Application">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              id="app-select-customer"
              label="Select Customer"
              value={form.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              options={customerOptions}
              placeholder="Choose customer"
              required
            />

            {isNewCustomer && (
              <div className="rounded-xl border border-brand-blue/30 bg-brand-light/40 dark:bg-slate-900/50 dark:border-brand-blue/40 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-brand-blue">
                  <UserPlus className="h-4 w-4" />
                  New customer details
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    Will be saved to Customers list with join date
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={newCustomer.fullName}
                    onChange={(e) =>
                      setNewCustomer((p) => ({ ...p, fullName: e.target.value }))
                    }
                    required
                  />
                  <Input
                    label="Mobile Number"
                    value={newCustomer.mobile}
                    onChange={(e) =>
                      setNewCustomer((p) => ({ ...p, mobile: e.target.value }))
                    }
                    placeholder="10 digit mobile"
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                  <Input
                    label="Aadhaar Last 4 Digits"
                    value={newCustomer.aadhaarLast4}
                    onChange={(e) =>
                      setNewCustomer((p) => ({
                        ...p,
                        aadhaarLast4: e.target.value.slice(0, 4),
                      }))
                    }
                    maxLength={4}
                    required
                  />
                </div>
                <Input
                  label="Address"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, address: e.target.value }))
                  }
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    value={newCustomer.city}
                    onChange={(e) =>
                      setNewCustomer((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                  <Select
                    id="app-new-customer-state"
                    label="State"
                    value={newCustomer.state}
                    onChange={(e) =>
                      setNewCustomer((p) => ({ ...p, state: e.target.value }))
                    }
                    options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                    placeholder="Select state"
                  />
                  <Input
                    label="Pincode"
                    value={newCustomer.pincode}
                    onChange={(e) =>
                      setNewCustomer((p) => ({ ...p, pincode: e.target.value }))
                    }
                    maxLength={6}
                  />
                </div>
              </div>
            )}

            <Select
              id="app-select-service"
              label="Select Service"
              value={form.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              options={services.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Choose service"
              required
            />

            {requiredDocs.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Required Documents:
                </p>
                <div className="flex flex-wrap gap-2">
                  {requiredDocs.map((doc) => (
                    <span
                      key={doc}
                      className="text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Application Fee (₹)"
                type="number"
                value={form.applicationFee}
                onChange={(e) =>
                  setForm({ ...form, applicationFee: e.target.value })
                }
              />
              <Input
                label="Amount Paid (₹)"
                type="number"
                value={form.amountPaid}
                onChange={(e) =>
                  setForm({ ...form, amountPaid: e.target.value })
                }
              />
            </div>
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
            <Textarea
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>
                {isNewCustomer ? "Add Customer & Create" : "Create Application"}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
      <UpgradeModal
        isOpen={!!showUpgrade}
        onClose={() => setShowUpgrade(null)}
        resource={showUpgrade || "Applications"}
      />
    </DashboardLayout>
  );
}

export default function AddApplicationPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout title="New Application">
          <TableSkeleton />
        </DashboardLayout>
      }
    >
      <AddApplicationContent />
    </Suspense>
  );
}
