"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getDocument, getShopDocuments } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Invoice, GstSettings } from "@/types";
import Button from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
import { toast } from "sonner";
import { ArrowLeft, Printer } from "lucide-react";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile, shop } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [gst, setGst] = useState<GstSettings | null>(null);
  const [loading, setLoading] = useState(true);

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
        <Link href="/invoices" className="inline-flex items-center gap-1 text-xs text-slate-500">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Email/WhatsApp share — configure SMTP in settings")}
          >
            Share
          </Button>
        </div>
        <InvoiceDocument invoice={invoice} gst={gst} shop={shop} />
      </div>
    </DashboardLayout>
  );
}
