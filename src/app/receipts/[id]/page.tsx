"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getDocument, getShopDocuments } from "@/lib/firebase/firestore";
import { Receipt, ReceiptSettings } from "@/types";
import { formatCurrency, formatDate, formatStatusLabel } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [settings, setSettings] = useState<ReceiptSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocument<Receipt>("receipts", id).then(async (data) => {
      setReceipt(data);
      if (data?.shopId) {
        const s = await getShopDocuments<ReceiptSettings>("receiptSettings", data.shopId);
        if (s[0]) setSettings(s[0]);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  if (!receipt) {
    return <div className="min-h-screen flex items-center justify-center"><p>Receipt not found</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between no-print">
          <Link href="/payments" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200" id="receipt">
          <div className="text-center border-b border-slate-200 pb-6 mb-6">
            {(settings?.showLogo !== false) && (
              <Image src="/logo.png" alt="Logo" width={48} height={48} className="mx-auto rounded-lg mb-3" />
            )}
            <h1 className="text-xl font-bold text-slate-900">{receipt.shopName || "CSC Shop"}</h1>
            <p className="text-sm text-slate-500">{receipt.ownerName}</p>
            {settings?.gstNumber && <p className="text-xs text-slate-500 mt-1">GST: {settings.gstNumber}</p>}
            <p className="text-lg font-semibold text-brand-blue mt-3">PAYMENT RECEIPT</p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt No.</span>
              <span className="font-semibold">{receipt.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-medium">{formatDate(receipt.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Application ID</span>
              <span className="font-medium">{receipt.applicationRef}</span>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Customer</span>
                <span className="font-medium">{receipt.customerName}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Service</span>
                <span className="font-medium">{receipt.serviceName}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-medium capitalize">{formatStatusLabel(receipt.paymentMethod)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Status</span>
                <span className="font-medium capitalize">{receipt.paymentStatus}</span>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-900">Amount Paid</span>
              <span className="text-2xl font-bold text-brand-green">{formatCurrency(receipt.amount)}</span>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
            {settings?.termsAndConditions && <p className="mb-2 text-slate-500">{settings.termsAndConditions}</p>}
            <p>{settings?.footerText || "Thank you for your business!"}</p>
            {settings?.signatureURL && (
              <Image src={settings.signatureURL} alt="Signature" width={80} height={40} className="mx-auto mt-2 opacity-80" />
            )}
            <p className="mt-1">Generated by CSC Digital Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
