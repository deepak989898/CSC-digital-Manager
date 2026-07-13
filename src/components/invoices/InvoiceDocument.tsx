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
    <div className={`invoice-sheet print-invoice ${className}`}>
      <div className="invoice-sheet-accent-top" />
      <div className="invoice-sheet-pattern" aria-hidden />
      <div className="invoice-sheet-watermark" aria-hidden>
        {businessName.slice(0, 20)}
      </div>
      <div className="invoice-corner invoice-corner-tl" aria-hidden />
      <div className="invoice-corner invoice-corner-br" aria-hidden />

      <div className="invoice-sheet-inner">
        <div className="invoice-header-band p-4">
          <div className="flex justify-between gap-4">
            <div className="flex gap-3 min-w-0">
              {logoUrl && (
                <div className="shrink-0 p-1 bg-white rounded-lg border border-blue-100 shadow-sm">
                  <Image
                    src={logoUrl}
                    alt={businessName}
                    width={64}
                    height={64}
                    className="rounded-md object-contain h-14 w-14"
                    unoptimized
                  />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900">{businessName}</h2>
                {address && (
                  <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-line leading-relaxed">{address}</p>
                )}
                {phone && <p className="text-xs text-slate-600">Phone: {phone}</p>}
                {email && <p className="text-xs text-slate-600">Email: {email}</p>}
                {showGst && gstin && (
                  <p className="text-xs font-semibold text-blue-800 mt-1">GSTIN: {gstin}</p>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="inline-block px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">
                {getInvoiceTypeLabel(invoice.invoiceType)}
              </div>
              <p className="text-xs text-slate-700 mt-2 font-medium">No: {invoice.invoiceNumber}</p>
              <p className="text-xs text-slate-500">Date: {formatDate(invoice.invoiceDate)}</p>
              {invoice.dueDate && <p className="text-xs text-slate-500">Due: {formatDate(invoice.dueDate)}</p>}
              {invoice.status && (
                <div className="mt-1">
                  <Badge status={invoice.status} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="invoice-bill-to px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Bill To</p>
          <p className="text-sm font-semibold text-slate-900">{invoice.customerName}</p>
          <p className="text-xs text-slate-600">{invoice.customerMobile}</p>
          {invoice.customerGstin && <p className="text-xs text-slate-600">GSTIN: {invoice.customerGstin}</p>}
          {invoice.customerState && <p className="text-xs text-slate-600">State: {invoice.customerState}</p>}
        </div>

        <div className="p-4">
          <table className="invoice-table w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left rounded-tl-md">#</th>
                <th className="text-left">Item</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Rate (incl.)</th>
                {showGst && <th className="text-right">Tax</th>}
                <th className="text-right rounded-tr-md">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, i) => (
                <tr key={i} className="border-b border-blue-50">
                  <td className="py-2 px-1 text-slate-600">{i + 1}</td>
                  <td className="py-2 px-1 font-medium text-slate-800">
                    {it.name}
                    {it.hsnSac ? <span className="text-slate-400 font-normal"> ({it.hsnSac})</span> : null}
                  </td>
                  <td className="py-2 px-1 text-right">{it.quantity}</td>
                  <td className="py-2 px-1 text-right">{formatCurrency(it.rate)}</td>
                  {showGst && (
                    <td className="py-2 px-1 text-right text-slate-600">
                      {formatCurrency(it.cgstAmount + it.sgstAmount + it.igstAmount)}
                    </td>
                  )}
                  <td className="py-2 px-1 text-right font-semibold text-slate-900">
                    {formatCurrency(it.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="invoice-totals-box w-full max-w-xs space-y-1 text-xs">
              {showGst && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST</span>
                    <span>{formatCurrency(invoice.totalCgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST</span>
                    <span>{formatCurrency(invoice.totalSgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IGST</span>
                    <span>{formatCurrency(invoice.totalIgst)}</span>
                  </div>
                </>
              )}
              <div className="invoice-grand-total flex justify-between font-bold text-sm">
                <span>Grand Total</span>
                <span>{formatCurrency(invoice.grandTotal)}</span>
              </div>
              {invoice.paymentStatus && (
                <p className="text-slate-500 text-right pt-1">Payment: {invoice.paymentStatus}</p>
              )}
            </div>
          </div>

          {invoice.notes && (
            <p className="mt-3 text-xs text-slate-600 bg-amber-50/80 border border-amber-100 rounded-lg p-2">
              <strong>Notes:</strong> {invoice.notes}
            </p>
          )}

          <div className="invoice-footer-band mt-4 -mx-4 -mb-4 px-4 py-4 space-y-2">
            {gst?.invoiceTerms && (
              <p className="text-[10px] text-slate-600">
                <strong>Terms:</strong> {gst.invoiceTerms}
              </p>
            )}
            <p className="text-[10px] text-slate-600 text-center whitespace-pre-line leading-relaxed">
              {gst?.invoiceFooter?.trim() ||
                "Thank you for your business! This is a computer-generated invoice."}
            </p>
            <div className="flex justify-between items-end pt-2 border-t border-blue-100">
              <div className="text-[10px] text-slate-500">
                <p className="font-medium text-slate-700">{businessName}</p>
                {phone && <p>Contact: {phone}</p>}
              </div>
              {gst?.signatureURL && (
                <div className="text-center">
                  <Image
                    src={gst.signatureURL}
                    alt="Authorized signature"
                    width={80}
                    height={40}
                    className="h-10 w-auto object-contain mx-auto"
                    unoptimized
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Authorized Signatory</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
