"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getDocument } from "@/lib/firebase/firestore";
import { Invoice } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Printer, Download } from "lucide-react";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocument<Invoice>("invoices", id).then((d) => {
      setInvoice(d);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Invoice">
        <TableSkeleton />
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout title="Not Found">
        <p>Invoice not found</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Invoice ${invoice.invoiceNumber}`}>
      <div className="max-w-3xl mx-auto space-y-4">
        <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-slate-500">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info("Email/WhatsApp share — configure SMTP in settings")}
          >
            <Download className="h-4 w-4" /> Share
          </Button>
        </div>
        <Card title={`Tax Invoice — ${invoice.invoiceNumber}`}>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold text-lg">{invoice.customerName}</p>
                <p className="text-slate-500">{invoice.customerMobile}</p>
                {invoice.customerGstin && (
                  <p className="text-slate-500">GSTIN: {invoice.customerGstin}</p>
                )}
              </div>
              <div className="text-right">
                <Badge status={invoice.status} />
                <p className="mt-2 text-slate-500">Date: {formatDate(invoice.invoiceDate)}</p>
                {invoice.dueDate && (
                  <p className="text-slate-500">Due: {formatDate(invoice.dueDate)}</p>
                )}
              </div>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-slate-800">
                  <th className="text-left p-2">Item</th>
                  <th className="text-right p-2">Qty</th>
                  <th className="text-right p-2">Rate</th>
                  <th className="text-right p-2">Tax</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">
                      {it.name}
                      {it.hsnSac ? ` (${it.hsnSac})` : ""}
                    </td>
                    <td className="p-2 text-right">{it.quantity}</td>
                    <td className="p-2 text-right">{formatCurrency(it.rate)}</td>
                    <td className="p-2 text-right">
                      {formatCurrency(it.cgstAmount + it.sgstAmount + it.igstAmount)}
                    </td>
                    <td className="p-2 text-right font-medium">{formatCurrency(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right space-y-1">
              <p>Subtotal: {formatCurrency(invoice.subtotal)}</p>
              <p>
                CGST: {formatCurrency(invoice.totalCgst)} | SGST:{" "}
                {formatCurrency(invoice.totalSgst)} | IGST: {formatCurrency(invoice.totalIgst)}
              </p>
              <p className="text-xl font-bold">Grand Total: {formatCurrency(invoice.grandTotal)}</p>
              <p className="text-slate-500">Payment: {invoice.paymentStatus}</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
