"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FeatureGate } from "@/components/FeatureGate";
import { useAuth } from "@/contexts/AuthContext";
import { useShopCollection } from "@/hooks/useShopCollection";
import { createDocument, getShopDocuments } from "@/lib/firebase/firestore";
import { calculateLineItem, calculateInvoiceTotals, generateInvoiceNumber, isInterState } from "@/lib/gst";
import { INVOICE_TYPES, INDIAN_STATES } from "@/lib/constants";
import { Customer, GstSettings, InvoiceItem, Invoice } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function NewInvoicePage() {
  const router = useRouter();
  const { profile, shop } = useAuth();
  const { data: customers } = useShopCollection<Customer>("customers");
  const { data: gstList } = useShopCollection<GstSettings>("gstSettings");
  const gst = gstList[0];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    invoiceType: "gst",
    customerId: "",
    customerGstin: "",
    customerState: "",
    dueDate: "",
    notes: "",
  });
  const [items, setItems] = useState([{ name: "", quantity: "1", rate: "", discount: "0", hsnSac: "" }]);

  const shopState = gst?.state || shop?.state || "";
  const interState = isInterState(shopState, form.customerState);

  const lineItems: InvoiceItem[] = items.map((it) => {
    const li = calculateLineItem({
      quantity: Number(it.quantity) || 0,
      rate: Number(it.rate) || 0,
      discount: Number(it.discount) || 0,
      cgstRate: gst?.defaultCgstRate ?? 9,
      sgstRate: gst?.defaultSgstRate ?? 9,
      igstRate: gst?.defaultIgstRate ?? 18,
      isInterState: interState,
    });
    return { ...li, name: it.name, hsnSac: it.hsnSac };
  });

  const totals = calculateInvoiceTotals(lineItems);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer) { toast.error("Select a customer"); return; }
    if (!items[0]?.name) { toast.error("Add at least one item"); return; }
    setLoading(true);
    try {
      const shopId = profile.shopId || profile.userId;
      const existing = await getShopDocuments<Invoice>("invoices", shopId);
      const prefix = gst?.invoicePrefix || "INV";
      const invoiceNumber = generateInvoiceNumber(prefix, existing.length);
      await createDocument("invoices", {
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
      router.push("/invoices");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="New Invoice">
      <FeatureGate feature="gstInvoice">
        <div className="max-w-3xl mx-auto space-y-4">
          <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" /> Back</Link>
          <Card title="Create Invoice">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Invoice Type" value={form.invoiceType} onChange={(e) => setForm({ ...form, invoiceType: e.target.value })} options={INVOICE_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
                <Select label="Customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} options={customers.map((c) => ({ value: c.id, label: c.fullName }))} placeholder="Select customer" required />
                <Input label="Customer GSTIN (optional)" value={form.customerGstin} onChange={(e) => setForm({ ...form, customerGstin: e.target.value })} />
                <Select label="Customer State" value={form.customerState} onChange={(e) => setForm({ ...form, customerState: e.target.value })} options={INDIAN_STATES.map((s) => ({ value: s, label: s }))} placeholder="Select state" />
                <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">Line Items {interState ? "(IGST)" : "(CGST+SGST)"}</p>
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 border rounded-lg">
                    <Input placeholder="Item name" value={it.name} onChange={(e) => { const n = [...items]; n[i].name = e.target.value; setItems(n); }} className="sm:col-span-2" />
                    <Input placeholder="HSN/SAC" value={it.hsnSac} onChange={(e) => { const n = [...items]; n[i].hsnSac = e.target.value; setItems(n); }} />
                    <Input type="number" placeholder="Qty" value={it.quantity} onChange={(e) => { const n = [...items]; n[i].quantity = e.target.value; setItems(n); }} />
                    <Input type="number" placeholder="Rate" value={it.rate} onChange={(e) => { const n = [...items]; n[i].rate = e.target.value; setItems(n); }} />
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-500 p-2"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { name: "", quantity: "1", rate: "", discount: "0", hsnSac: "" }])}>
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-sm space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
                <div className="flex justify-between"><span>CGST</span><span>{formatCurrency(totals.totalCgst)}</span></div>
                <div className="flex justify-between"><span>SGST</span><span>{formatCurrency(totals.totalSgst)}</span></div>
                <div className="flex justify-between"><span>IGST</span><span>{formatCurrency(totals.totalIgst)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Grand Total</span><span>{formatCurrency(totals.grandTotal)}</span></div>
              </div>
              <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-3">
                <Button type="submit" loading={loading}>Create Invoice</Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      </FeatureGate>
    </DashboardLayout>
  );
}
