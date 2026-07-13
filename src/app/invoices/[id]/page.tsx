"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getDocument, getShopDocuments } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Invoice, GstSettings } from "@/types";
import Button from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
import { shareInvoiceOnWhatsApp } from "@/lib/invoice-share";
import { toast } from "sonner";
import { Printer, MessageCircle } from "lucide-react";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile, shop } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [gst, setGst] = useState<GstSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    (async () => {
      const inv = await getDocument<Invoice>("invoices", id);
      setInvoice(inv);
      if (profile?.shopId) {
        const gstList = await getShopDocuments<GstSettings>("gstSettings", profile.shopId);
        setGst(gstList[0] || null);
      }
      setLoading(false);
    })();
  }, [id, profile?.shopId]);

  const handleWhatsAppShare = async () => {
    if (!invoice) return;
    const element = document.getElementById("invoice-document");
    if (!element) {
      toast.error("Invoice not ready for sharing");
      return;
    }

    setSharing(true);
    try {
      const result = await shareInvoiceOnWhatsApp({
        element,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerMobile: invoice.customerMobile,
        grandTotal: invoice.grandTotal,
      });

      if (result === "shared") {
        toast.success("Invoice PDF shared");
      } else if (result === "whatsapp") {
        toast.success("PDF downloaded — attach it in the WhatsApp chat that opened");
      } else if (result === "cancelled") {
        toast.info("Share cancelled");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to share invoice");
    } finally {
      setSharing(false);
    }
  };

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
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="flex flex-wrap gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / PDF
          </Button>
          <Button
            size="sm"
            loading={sharing}
            onClick={handleWhatsAppShare}
            className="bg-[#25D366] hover:bg-[#1da851] text-white border-[#25D366]"
          >
            <MessageCircle className="h-4 w-4" /> Share on WhatsApp
          </Button>
        </div>
        <InvoiceDocument invoice={invoice} gst={gst} shop={shop} />
      </div>
    </DashboardLayout>
  );
}
