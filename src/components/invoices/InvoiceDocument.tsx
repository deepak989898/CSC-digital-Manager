"use client";

import Image from "next/image";
import { GstSettings, Invoice, Shop } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getInvoiceTypeLabel } from "@/lib/gst";
import { Badge } from "@/components/ui/Badge";

export interface InvoicePreviewData {
  invoiceNumber: string;
  invoiceType: string;
  status?: string;
  customerName: string;
  customerMobile: string;
  customerGstin?: string;
  customerState?: string;
  items: Invoice["items"];
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  grandTotal: number;
  paymentStatus?: string;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  isInterState?: boolean;
}

interface InvoiceDocumentProps {
  invoice: InvoicePreviewData;
  gst?: GstSettings | null;
  shop?: Shop | null;
  className?: string;
}

export function InvoiceDocument({ invoice, gst, shop, className = "" }: InvoiceDocumentProps) {
  const showGst = invoice.invoiceType === "gst" || invoice.invoiceType === "tax";
  const businessName = gst?.legalName || shop?.shopName || "CSC Shop";
  const logoUrl = gst?.logoURL || shop?.photoURL;
  const address =
    gst?.billingAddress ||
    [shop?.address, shop?.city, shop?.state, shop?.pincode].filter(Boolean).join(", ");
  const phone = shop?.mobile || "";
  const email = shop?.email || "";
  const gstin = gst?.gstin;

  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden print-invoice ${className}`}>
      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex justify-between gap-4">
          <div className="flex gap-3 min-w-0">
            {logoUrl && (
              <div className="shrink-0">
                <Image
                  src={logoUrl}
                  alt={businessName}
                  width={64}
                  height={64}
                  className="rounded-lg object-contain h-16 w-16"
                  unoptimized
                />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{businessName}</h2>
              {address && <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 whitespace-pre-line">{address}</p>}
              {phone && <p className="text-xs text-slate-600 dark:text-slate-300">Phone: {phone}</p>}
              {email && <p className="text-xs text-slate-600 dark:text-slate-300">Email: {email}</p>}
              {showGst && gstin && <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mt-1">GSTIN: {gstin}</p>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-brand-blue">{getInvoiceTypeLabel(invoice.invoiceType)}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">No: {invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-500">Date: {formatDate(invoice.invoiceDate)}</p>
            {invoice.dueDate && <p className="text-xs text-slate-500">Due: {formatDate(invoice.dueDate)}</p>}
            {invoice.status && <div className="mt-1"><Badge status={invoice.status} /></div>}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700">
        <p className="text-xs font-medium text-slate-500">Bill To</p>
        <p className="text-sm font-semibold">{invoice.customerName}</p>
        <p className="text-xs text-slate-600 dark:text-slate-300">{invoice.customerMobile}</p>
        {invoice.customerGstin && <p className="text-xs text-slate-600">GSTIN: {invoice.customerGstin}</p>}
        {invoice.customerState && <p className="text-xs text-slate-600">State: {invoice.customerState}</p>}
      </div>

      <div className="p-4">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b bg-slate-50 dark:bg-slate-900/60">
              <th className="text-left py-2 px-1">#</th>
              <th className="text-left py-2 px-1">Item</th>
              <th className="text-right py-2 px-1">Qty</th>
              <th className="text-right py-2 px-1">Rate (incl.)</th>
              {showGst && <th className="text-right py-2 px-1">Tax</th>}
              <th className="text-right py-2 px-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((it, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-700">
                <td className="py-2 px-1">{i + 1}</td>
                <td className="py-2 px-1">
                  {it.name}
                  {it.hsnSac ? <span className="text-slate-400"> ({it.hsnSac})</span> : null}
                </td>
                <td className="py-2 px-1 text-right">{it.quantity}</td>
                <td className="py-2 px-1 text-right">{formatCurrency(it.rate)}</td>
                {showGst && (
                  <td className="py-2 px-1 text-right">
                    {formatCurrency(it.cgstAmount + it.sgstAmount + it.igstAmount)}
                  </td>
                )}
                <td className="py-2 px-1 text-right font-medium">{formatCurrency(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex justify-end">
          <div className="w-full max-w-xs space-y-1 text-xs">
            {showGst && (
              <>
                <div className="flex justify-between"><span>Taxable Value</span><span>{formatCurrency(invoice.subtotal)}</span></div>
                <div className="flex justify-between"><span>CGST</span><span>{formatCurrency(invoice.totalCgst)}</span></div>
                <div className="flex justify-between"><span>SGST</span><span>{formatCurrency(invoice.totalSgst)}</span></div>
                <div className="flex justify-between"><span>IGST</span><span>{formatCurrency(invoice.totalIgst)}</span></div>
              </>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Grand Total</span>
              <span>{formatCurrency(invoice.grandTotal)}</span>
            </div>
            {invoice.paymentStatus && (
              <p className="text-slate-500 text-right">Payment: {invoice.paymentStatus}</p>
            )}
          </div>
        </div>

        {invoice.notes && (
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 border-t pt-2">
            <strong>Notes:</strong> {invoice.notes}
          </p>
        )}
        {gst?.invoiceTerms && (
          <p className="mt-2 text-[10px] text-slate-500">{gst.invoiceTerms}</p>
        )}
      </div>
    </div>
  );
}
