"use client";

import { useState } from "react";
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
  /** DOM id used for PDF export / WhatsApp share */
  exportId?: string;
}

function InvoiceLogo({ src, alt }: { src: string; alt: string }) {
  const [useNativeImg, setUseNativeImg] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  if (useNativeImg) {
    return (
      <div className="invoice-logo-wrap shrink-0 relative z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="invoice-logo-img"
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="invoice-logo-wrap shrink-0 relative z-10">
      <Image
        src={src}
        alt={alt}
        width={72}
        height={72}
        unoptimized
        priority
        className="invoice-logo-img"
        onError={() => setUseNativeImg(true)}
      />
    </div>
  );
}

export function InvoiceDocument({
  invoice,
  gst,
  shop,
  className = "",
  exportId = "invoice-document",
}: InvoiceDocumentProps) {
  const showGst = invoice.invoiceType === "gst" || invoice.invoiceType === "tax";
  const businessName = gst?.legalName || shop?.shopName || "CSC Shop";
  const logoUrl = (gst?.logoURL || shop?.photoURL)?.trim();
  const hasLogo = Boolean(logoUrl && /^https?:\/\//i.test(logoUrl));
  const address =
    gst?.billingAddress ||
    [shop?.address, shop?.city, shop?.state, shop?.pincode].filter(Boolean).join(", ");
  const phone = shop?.mobile || "";
  const email = shop?.email || "";
  const gstin = gst?.gstin;

  return (
    <div id={exportId} className={`invoice-sheet print-invoice ${className}`}>
      <div className="invoice-sheet-accent-top" />
      <div className="invoice-sheet-pattern" aria-hidden />
      <div className="invoice-sheet-watermark" aria-hidden>
        <span>{businessName}</span>
      </div>
      <div className="invoice-corner invoice-corner-tl" aria-hidden />
      <div className="invoice-corner invoice-corner-br" aria-hidden />

      <div className="invoice-sheet-inner">
        <div className="invoice-header-band p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div className="flex gap-3 min-w-0 flex-1">
              {hasLogo && logoUrl ? <InvoiceLogo src={logoUrl} alt={businessName} /> : null}
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-900 break-words leading-snug">{businessName}</h2>
                {address ? (
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed break-words">
                    {address}
                  </p>
                ) : null}
                {phone ? <p className="text-xs text-slate-600 mt-0.5">Phone: {phone}</p> : null}
                {email ? <p className="text-xs text-slate-600 break-all">Email: {email}</p> : null}
                {showGst && gstin ? (
                  <p className="text-xs font-semibold text-blue-800 mt-1">GSTIN: {gstin}</p>
                ) : null}
              </div>
            </div>
            <div className="sm:text-right shrink-0 sm:max-w-[45%]">
              <div className="inline-flex px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm">
                {getInvoiceTypeLabel(invoice.invoiceType)}
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs text-slate-700 font-medium break-all">No: {invoice.invoiceNumber}</p>
                <p className="text-xs text-slate-600">Date: {formatDate(invoice.invoiceDate)}</p>
                {invoice.dueDate ? (
                  <p className="text-xs text-slate-600">Due: {formatDate(invoice.dueDate)}</p>
                ) : null}
              </div>
              {invoice.status ? (
                <div className="mt-2 sm:flex sm:justify-end">
                  <Badge status={invoice.status} />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="invoice-bill-to px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">Bill To</p>
          <p className="text-sm font-semibold text-slate-900 break-words">{invoice.customerName}</p>
          <p className="text-xs text-slate-600 mt-0.5">{invoice.customerMobile}</p>
          {invoice.customerGstin ? (
            <p className="text-xs text-slate-600 break-all">GSTIN: {invoice.customerGstin}</p>
          ) : null}
          {invoice.customerState ? (
            <p className="text-xs text-slate-600">State: {invoice.customerState}</p>
          ) : null}
        </div>

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="invoice-table w-full text-xs border-collapse min-w-[420px]">
              <thead>
                <tr>
                  <th className="text-left rounded-tl-md w-8">#</th>
                  <th className="text-left">Item</th>
                  <th className="text-right w-12">Qty</th>
                  <th className="text-right whitespace-nowrap">Rate (incl.)</th>
                  {showGst ? <th className="text-right whitespace-nowrap">Tax</th> : null}
                  <th className="text-right rounded-tr-md whitespace-nowrap">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it, i) => (
                  <tr key={i} className="border-b border-blue-50">
                    <td className="py-2 px-1 text-slate-600">{i + 1}</td>
                    <td className="py-2 px-1 font-medium text-slate-800 break-words">
                      {it.name}
                      {it.hsnSac ? (
                        <span className="text-slate-400 font-normal"> ({it.hsnSac})</span>
                      ) : null}
                    </td>
                    <td className="py-2 px-1 text-right">{it.quantity}</td>
                    <td className="py-2 px-1 text-right whitespace-nowrap">{formatCurrency(it.rate)}</td>
                    {showGst ? (
                      <td className="py-2 px-1 text-right text-slate-600 whitespace-nowrap">
                        {formatCurrency(it.cgstAmount + it.sgstAmount + it.igstAmount)}
                      </td>
                    ) : null}
                    <td className="py-2 px-1 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(it.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="invoice-totals-box w-full max-w-xs text-xs">
              {showGst ? (
                <div className="space-y-1 pb-2">
                  <div className="flex justify-between text-slate-600 gap-4">
                    <span>Taxable Value</span>
                    <span className="whitespace-nowrap">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 gap-4">
                    <span>CGST</span>
                    <span className="whitespace-nowrap">{formatCurrency(invoice.totalCgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 gap-4">
                    <span>SGST</span>
                    <span className="whitespace-nowrap">{formatCurrency(invoice.totalSgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 gap-4">
                    <span>IGST</span>
                    <span className="whitespace-nowrap">{formatCurrency(invoice.totalIgst)}</span>
                  </div>
                </div>
              ) : null}
              {invoice.paymentStatus ? (
                <div className="flex justify-between text-slate-600 gap-4 pb-2 mb-2 border-b border-blue-100">
                  <span>Payment</span>
                  <span className="capitalize font-medium">{invoice.paymentStatus}</span>
                </div>
              ) : null}
              <div className="invoice-grand-total flex justify-between font-bold text-sm gap-4">
                <span>Grand Total</span>
                <span className="whitespace-nowrap">{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>

          {invoice.notes ? (
            <p className="mt-3 text-xs text-slate-600 bg-amber-50/80 border border-amber-100 rounded-lg p-2 break-words">
              <strong>Notes:</strong> {invoice.notes}
            </p>
          ) : null}

          <div className="invoice-footer-band mt-4 -mx-4 -mb-4 px-4 py-4 space-y-2">
            {gst?.invoiceTerms ? (
              <p className="text-[11px] text-slate-600 break-words leading-relaxed">
                <strong>Terms:</strong> {gst.invoiceTerms}
              </p>
            ) : null}
            <p className="text-[11px] text-slate-600 text-center whitespace-pre-line leading-relaxed break-words">
              {gst?.invoiceFooter?.trim() ||
                "Thank you for your business! This is a computer-generated invoice."}
            </p>
            <div className="flex justify-between items-end gap-4 pt-2 border-t border-blue-100">
              <div className="text-[11px] text-slate-500 min-w-0">
                <p className="font-medium text-slate-700 break-words">{businessName}</p>
                {phone ? <p className="mt-0.5">Contact: {phone}</p> : null}
              </div>
              {gst?.signatureURL ? (
                <div className="text-center shrink-0 relative z-10">
                  <Image
                    src={gst.signatureURL}
                    alt="Authorized signature"
                    width={100}
                    height={48}
                    unoptimized
                    className="h-10 w-auto max-w-[100px] object-contain mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Authorized Signatory</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
