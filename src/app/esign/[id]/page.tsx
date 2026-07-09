"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getDocument, updateDocument, getShopDocuments, createDocument } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { ESignRequest, ESignAuditLog } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";

export default function ESignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [request, setRequest] = useState<ESignRequest | null>(null);
  const [auditLogs, setAuditLogs] = useState<ESignAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const req = await getDocument<ESignRequest>("eSignRequests", id);
    setRequest(req);
    if (profile?.shopId) {
      const logs = await getShopDocuments<ESignAuditLog>("eSignAuditLogs", profile.shopId);
      setAuditLogs(logs.filter((l) => l.eSignRequestId === id));
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, [id, profile?.shopId]);

  const updateStatus = async (status: ESignRequest["status"], details: string) => {
    if (!profile || !request) return;
    try {
      const updates: Record<string, unknown> = { status };
      if (status === "sent") updates.sentAt = new Date().toISOString();
      if (status === "signed") {
        updates.signedAt = new Date().toISOString();
        updates.signedDocumentURL = request.documentURL;
      }
      await updateDocument("eSignRequests", id, updates);
      await createAuditLog(details, status);
      toast.success(`Status updated to ${status}`);
      await load();
    } catch {
      toast.error("Failed to update");
    }
  };

  const createAuditLog = async (details: string, action: string) => {
    if (!profile) return;
    await createDocument("eSignAuditLogs", {
      eSignRequestId: id,
      action,
      details,
      performedByName: profile.displayName,
      userId: profile.userId,
      shopId: profile.shopId,
    });
  };

  if (loading) return <DashboardLayout title="eSign"><TableSkeleton /></DashboardLayout>;
  if (!request) return <DashboardLayout title="Not Found"><p>Request not found</p></DashboardLayout>;

  return (
    <DashboardLayout title="eSign Request">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href="/esign" className="inline-flex items-center gap-1 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <Card title={request.documentName}>
          <div className="space-y-3 text-sm">
            <p><strong>Customer:</strong> {request.customerName}</p>
            <p><strong>Signer:</strong> {request.signerName}</p>
            <p><strong>Provider:</strong> {request.provider}</p>
            <Badge status={request.status} />
            <div className="flex flex-wrap gap-2 pt-2">
              {request.status === "draft" && (
                <Button size="sm" onClick={() => updateStatus("sent", "Request sent to signer (provider placeholder)")}>
                  <Send className="h-4 w-4" /> Mark as Sent
                </Button>
              )}
              {["sent", "viewed"].includes(request.status) && (
                <Button size="sm" onClick={() => updateStatus("signed", "Document signed")}>
                  <CheckCircle className="h-4 w-4" /> Mark Signed
                </Button>
              )}
              <a href={request.documentURL} target="_blank" rel="noopener noreferrer" className="text-brand-blue text-sm hover:underline">View Document</a>
            </div>
          </div>
        </Card>
        <Card title="Audit Trail">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-slate-500">No audit entries yet</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((l) => (
                <div key={l.id} className="p-2 border rounded-lg text-xs">
                  <p className="font-medium">{l.action}</p>
                  <p className="text-slate-500">{l.details}</p>
                  <p className="text-slate-400">{formatDateTime(l.createdAt)} — {l.performedByName}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
