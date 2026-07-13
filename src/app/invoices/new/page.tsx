"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/contexts/AuthContext";
import { useShopCollection } from "@/hooks/useShopCollection";
import { createDocument, getShopDocuments } from "@/lib/firebase/firestore";
import {
  calculateLineItemInclusive,
  calculateInvoiceTotals,
  generateInvoiceNumber,
  isInterState,
  isGstInvoiceType,
} from "@/lib/gst";
import { INVOICE_TYPES, INDIAN_STATES } from "@/lib/constants";
import { Customer, GstSettings, InvoiceItem, Invoice, Service } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import ComboInput from "@/components/ui/ComboInput";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

type LineItemForm = { name: string; quantity: string; rate: string; discount: string; hsnSac: string };

export default function NewInvoicePage() {
  const router = useRouter();
  const { profile, shop } = useAuth();
  const { data: customers } = useShopCollection<Customer>("customers");
  const { data: services } = useShopCollection<Service>("services");
  const { data: gstList } = useShopCollection<GstSettings>("gstSettings");
  const gst = gstList[0];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    invoiceType: "non_gst",
    customerId: "",
    customerGstin: "",
    customerState: "",
    dueDate: "",
    notes: "",
  });
  const [items, setItems] = useState<LineItemForm[]>([
    { name: "", quantity: "1", rate: "", discount: "0", hsnSac: "" },
  ]);

  const serviceOptions = useMemo(
    () =>
      services
        .filter((s) => s.status === "active")
        .map((s) => ({
          value: s.id,
          label: s.name,
          meta: `₹${s.defaultPrice}`,
          price: s.defaultPrice,
        })),
    [services]
  );

  const shopState = gst?.state || shop?.state || "";
  const interState = isInterState(shopState, form.customerState);
  const applyGst = isGstInvoiceType(form.invoiceType) && (gst?.gstEnabled ?? true);

  const lineItems: InvoiceItem[] = items.map((it) => {
    const li = calculateLineItemInclusive({
      quantity: Number(it.quantity) || 0,
      inclusiveRate: Number(it.rate) || 0,
      discount: Number(it.discount) || 0,
      cgstRate: gst?.defaultCgstRate ?? 9,
      sgstRate: gst?.defaultSgstRate ?? 9,
      igstRate: gst?.defaultIgstRate ?? 18,
      isInterState: interState,
      applyGst,
    });
    return { ...li, name: it.name, hsnSac: it.hsnSac || undefined };
  });

  const totals = calculateInvoiceTotals(lineItems);
  const selectedCustomer = customers.find((c) => c.id === form.customerId);
  const previewNumber = `${gst?.invoicePrefix || "INV"}/${new Date().getFullYear()}/DRAFT`;

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setForm((f) => ({
      ...f,
      customerId,
      customerState: customer?.state || f.customerState,
    }));
  };

  const updateItem = (index: number, patch: Partial<LineItemForm>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer) {
      toast.error("Select a customer");
      return;
    }
    if (!items[0]?.name?.trim()) {
      toast.error("Add at least one item");
      return;
    }
    if (!items[0]?.rate || Number(items[0].rate) <= 0) {
      toast.error("Enter item rate");
      return;
    }
    setLoading(true);
    try {
      const shopId = profile.shopId || profile.userId;
      const existing = await getShopDocuments<Invoice>("invoices", shopId);
      const prefix = gst?.invoicePrefix || "INV";
      const invoiceNumber = generateInvoiceNumber(prefix, existing.length);
      const id = await createDocument("invoices", {
        invoiceNumber,
        invoiceType: form.invoiceType,
        status: "draft",
        customerId: customer.id,
        customerName: customer.fullName,
        customerMobile: customer.mobile,
        customerGstin: form.customerGstin || undefined,
        customerState: form.customerState,
        items: lineItems,
        ...totals,
        paymentStatus: "unpaid",
        amountPaid: 0,
        invoiceDate: new Date().toISOString(),
        dueDate: form.dueDate || undefined,
        notes: form.notes,
        isInterState: interState,
        userId: profile.userId,
        shopId,
      });
      toast.success("Invoice created");
      router.push(`/invoices/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="New Invoice">
      <FeatureGate feature="gstInvoice">
        <div className="max-w-5xl mx-auto space-y-3">
          <Link href="/invoices" className="inline-flex items-center gap-1 text-xs text-slate-500">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <Card title="Create Invoice">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select
                    label="Invoice Type"
                    value={form.invoiceType}
                    onChange={(e) => setForm({ ...form, invoiceType: e.target.value })}
                    options={INVOICE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                  />
                  <Select
                    label="Customer"
                    value={form.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    options={customers.map((c) => ({ value: c.id, label: c.fullName }))}
                    placeholder="Select customer"
                    required
                  />
                  {applyGst && (
                    <Input
                      label="Customer GSTIN (optional)"
                      value={form.customerGstin}
                      onChange={(e) => setForm({ ...form, customerGstin: e.target.value })}
                    />
                  )}
                  <Select
                    label="Customer State"
                    value={form.customerState}
                    onChange={(e) => setForm({ ...form, customerState: e.target.value })}
                    options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                    placeholder="Select state"
                  />
                  <Input
                    label="Due Date"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium">
                    Line Items{" "}
                    {applyGst ? (interState ? "(IGST — rate is tax inclusive)" : "(CGST+SGST — rate is tax inclusive)") : "(Non-GST)"}
                  </p>
                  {items.map((it, i) => (
                    <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-2 border rounded-lg dark:border-slate-700">
                      <ComboInput
                        label={i === 0 ? "Item name" : undefined}
                        placeholder="Select or type item"
                        value={it.name}
                        onChange={(v) => updateItem(i, { name: v })}
                        onSelectOption={(opt) => {
                          const svc = serviceOptions.find((s) => s.label === opt.label);
                          updateItem(i, {
                            name: opt.label,
                            rate: svc ? String(svc.price) : it.rate,
                          });
                        }}
                        options={serviceOptions.map((s) => ({
                          value: s.value,
                          label: s.label,
                          meta: s.meta,
                        }))}
                        className="sm:col-span-2"
                      />
                      <Input
                        label={i === 0 ? "HSN/SAC" : undefined}
                        placeholder="HSN/SAC"
                        value={it.hsnSac}
                        onChange={(e) => updateItem(i, { hsnSac: e.target.value })}
                      />
                      <Input
                        label={i === 0 ? "Qty" : undefined}
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => updateItem(i, { quantity: e.target.value })}
                      />
                      <Input
                        label={i === 0 ? (applyGst ? "Rate (incl. tax)" : "Rate") : undefined}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={it.rate}
                        onChange={(e) => updateItem(i, { rate: e.target.value })}
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setItems(items.filter((_, j) => j !== i))}
                          className="text-red-500 p-2 self-end"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setItems([...items, { name: "", quantity: "1", rate: "", discount: "0", hsnSac: "" }])
                    }
                  >
                    <Plus className="h-4 w-4" /> Add Item
                  </Button>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-1">
                  {applyGst && (
                    <>
                      <div className="flex justify-between">
                        <span>Taxable Value</span>
                        <span>{formatCurrency(totals.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CGST</span>
                        <span>{formatCurrency(totals.totalCgst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST</span>
                        <span>{formatCurrency(totals.totalSgst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IGST</span>
                        <span>{formatCurrency(totals.totalIgst)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t pt-2">
                    <span>Grand Total</span>
                    <span>{formatCurrency(totals.grandTotal)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Rate entered = final amount per line (tax included for GST invoices)
                  </p>
                </div>

                <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" loading={loading}>
                    Create Invoice
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>

            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Invoice Preview</p>
              <InvoiceDocument
                invoice={{
                  invoiceNumber: previewNumber,
                  invoiceType: form.invoiceType,
                  status: "draft",
                  customerName: selectedCustomer?.fullName || "Select customer",
                  customerMobile: selectedCustomer?.mobile || "—",
                  customerGstin: form.customerGstin,
                  customerState: form.customerState,
                  items: lineItems.filter((li) => li.name),
                  ...totals,
                  paymentStatus: "unpaid",
                  invoiceDate: new Date().toISOString(),
                  dueDate: form.dueDate || undefined,
                  notes: form.notes,
                  isInterState: interState,
                }}
                gst={gst}
                shop={shop}
              />
              {!gst?.legalName && (
                <p className="text-[10px] text-amber-600">
                  Set shop logo & address in Settings → GST & Invoices for invoice header
                </p>
              )}
            </div>
          </div>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
