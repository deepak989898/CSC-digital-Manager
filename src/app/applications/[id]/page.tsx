"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDocument,
  updateDocument,
  createDocument,
  deleteDocument,
  getShopDocuments,
} from "@/lib/firebase/firestore";
import { uploadFile, getStoragePath } from "@/lib/firebase/storage";
import { Application, DocumentRecord, Payment } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { APPLICATION_STATUSES, DOCUMENT_TYPES, PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime, getPaymentStatus } from "@/lib/utils";
import { downloadFileFromUrl } from "@/lib/download";
import { toast } from "sonner";
import {
  Upload,
  Eye,
  Download,
  Trash2,
  CreditCard,
  FileText,
  ScanLine,
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, shop } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("aadhaar");
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "cash",
    transactionId: "",
    notes: "",
  });
  const [paying, setPaying] = useState(false);

  const loadData = async () => {
    const app = await getDocument<Application>("applications", id);
    setApplication(app);
    if (app) setNewStatus(app.status);
    if (profile?.shopId) {
      const docs = await getShopDocuments<DocumentRecord>("documents", profile.shopId);
      setDocuments(docs.filter((d) => d.applicationId === id));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile?.shopId]);

  const handleStatusUpdate = async () => {
    if (!application || !profile) return;
    setStatusLoading(true);
    try {
      const updates: Record<string, unknown> = {
        status: newStatus,
        lastUpdatedById: profile.userId,
        lastUpdatedByName: profile.displayName,
      };
      if (newStatus === "completed") {
        updates.completedById = profile.userId;
        updates.completedByName = profile.displayName;
        updates.completedAt = new Date().toISOString();
      }
      await updateDocument("applications", id, updates);
      toast.success("Status updated");
      await loadData();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !application || !profile) return;
    setUploading(true);
    try {
      const path = getStoragePath(profile.shopId, "documents", file.name);
      const { url, fileName } = await uploadFile(path, file);
      await createDocument("documents", {
        applicationId: id,
        customerId: application.customerId,
        customerName: application.customerName,
        name: docType,
        type: docType as DocumentRecord["type"],
        fileName,
        fileURL: url,
        fileSize: file.size,
        mimeType: file.type,
        verificationStatus: "uploaded",
        uploadedByName: profile.displayName,
        userId: profile.userId,
        shopId: profile.shopId,
      });
      toast.success("Document uploaded");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDownloadDoc = async (doc: DocumentRecord) => {
    try {
      await downloadFileFromUrl(doc.fileURL, doc.fileName || doc.name);
      toast.success("Download started");
    } catch {
      toast.error("Download failed");
    }
  };

  const handleDeleteDoc = async (doc: DocumentRecord) => {
    try {
      await deleteDocument("documents", doc.id);
      toast.success("Document deleted");
      await loadData();
    } catch {
      toast.error("Failed to delete document");
    }
  };

  const handlePayment = async () => {
    if (!application || !profile) return;
    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    setPaying(true);
    try {
      const existingPayments = await getShopDocuments<Payment>("payments", profile.shopId);
      const receiptNum = `RCP${String(existingPayments.length + 1).padStart(3, "0")}`;
      const newAmountPaid = application.amountPaid + amount;
      const paymentStatus = getPaymentStatus(application.applicationFee, newAmountPaid);

      const paymentId = await createDocument("payments", {
        customerId: application.customerId,
        customerName: application.customerName,
        applicationId: id,
        applicationRef: application.referenceNumber,
        serviceId: application.serviceId,
        serviceName: application.serviceName,
        amount,
        paymentMethod: paymentForm.paymentMethod,
        paymentStatus: "paid",
        transactionId: paymentForm.transactionId || undefined,
        notes: paymentForm.notes,
        paymentDate: new Date().toISOString(),
        userId: profile.userId,
        shopId: profile.shopId,
      });

      await updateDocument("applications", id, {
        amountPaid: newAmountPaid,
        paymentStatus,
      });

      const receiptId = await createDocument("receipts", {
        receiptNumber: receiptNum,
        customerId: application.customerId,
        customerName: application.customerName,
        applicationId: id,
        applicationRef: application.referenceNumber,
        serviceName: application.serviceName,
        amount,
        paymentMethod: paymentForm.paymentMethod,
        paymentStatus: "paid",
        paymentId,
        shopName: shop?.shopName || "CSC Shop",
        ownerName: shop?.ownerName || "",
        userId: profile.userId,
        shopId: profile.shopId,
      });

      toast.success("Payment recorded");
      setPaymentModal(false);
      router.push(`/receipts/${receiptId}`);
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setPaying(false);
    }
  };

  const handleRazorpay = async () => {
    if (!application || !profile) return;
    const amount = application.applicationFee - application.amountPaid;
    if (amount <= 0) {
      toast.error("No pending amount");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, applicationId: id }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      await new Promise((resolve) => { script.onload = resolve; });

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: shop?.shopName || "CSC Digital Manager",
        description: application.serviceName,
        order_id: order.id,
        handler: async (response: Record<string, string>) => {
          const verifyRes = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              applicationId: id,
              shopId: profile.shopId,
              userId: profile.userId,
              customerId: application.customerId,
              customerName: application.customerName,
              serviceId: application.serviceId,
              serviceName: application.serviceName,
              applicationRef: application.referenceNumber,
              shopName: shop?.shopName,
              ownerName: shop?.ownerName,
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            toast.success("Payment successful");
            router.push(`/receipts/${result.receiptId}`);
          } else {
            toast.error("Payment verification failed");
          }
        },
        prefill: { name: application.customerName },
        theme: { color: "#2563eb" },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Razorpay failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Application Details">
        <TableSkeleton />
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout title="Not Found">
        <p className="text-slate-500">Application not found</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Application ${application.referenceNumber}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card title={application.referenceNumber}>
          <div className="flex items-center justify-between mb-4">
            <Badge status={application.status} />
            <Badge status={application.paymentStatus} label={`Payment: ${application.paymentStatus}`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Service:</span> <span className="font-medium">{application.serviceName}</span></div>
            <div><span className="text-slate-500">Customer:</span> <span className="font-medium">{application.customerName}</span></div>
            <div><span className="text-slate-500">Fee:</span> <span className="font-medium">{formatCurrency(application.applicationFee)}</span></div>
            <div><span className="text-slate-500">Paid:</span> <span className="font-medium">{formatCurrency(application.amountPaid)}</span></div>
            <div><span className="text-slate-500">Applied:</span> <span className="font-medium">{formatDate(application.createdAt)}</span></div>
            <div><span className="text-slate-500">Updated:</span> <span className="font-medium">{formatDateTime(application.updatedAt)}</span></div>
            {application.dueDate && <div><span className="text-slate-500">Due:</span> <span className="font-medium">{application.dueDate}</span></div>}
            {application.notes && <div className="sm:col-span-2"><span className="text-slate-500">Notes:</span> {application.notes}</div>}
          </div>
        </Card>

        <Card title="Update Status">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={APPLICATION_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              className="flex-1"
            />
            <Button onClick={handleStatusUpdate} loading={statusLoading}>Update Status</Button>
          </div>
        </Card>

        <Card title="Documents">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              options={DOCUMENT_TYPES.map((d) => ({ value: d.value, label: d.label }))}
              className="sm:w-48"
            />
            <input ref={fileRef} type="file" accept="*/*" onChange={handleFileUpload} className="hidden" />
            <Button onClick={() => fileRef.current?.click()} loading={uploading}>
              <Upload className="h-4 w-4" /> Upload Document
            </Button>
            <Link href={`/applications/${id}/scan-document`}>
              <Button variant="outline"><ScanLine className="h-4 w-4" /> OCR Scan</Button>
            </Link>
          </div>
          {documents.length === 0 ? (
            <p className="text-sm text-slate-500">No documents uploaded</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium">{doc.fileName}</p>
                      <p className="text-xs text-slate-500">{doc.type} · {(doc.fileSize / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <a href={doc.fileURL} target="_blank" rel="noopener noreferrer">
                      <button className="p-1.5 rounded hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc(doc)}
                      className="p-1.5 rounded hover:bg-slate-100"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteDoc(doc)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Payment">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => { setPaymentForm({ amount: String(application.applicationFee - application.amountPaid), paymentMethod: "cash", transactionId: "", notes: "" }); setPaymentModal(true); }}>
              <CreditCard className="h-4 w-4" /> Record Payment
            </Button>
            {application.paymentStatus !== "paid" && (
              <Button variant="orange" onClick={handleRazorpay} loading={paying}>
                Pay with Razorpay
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Record Payment"
        footer={
          <>
            <Button variant="outline" onClick={() => setPaymentModal(false)}>Cancel</Button>
            <Button onClick={handlePayment} loading={paying}>Save Payment</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Amount (₹)" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
          <Select label="Payment Method" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))} />
          <Input label="Transaction ID" value={paymentForm.transactionId} onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} />
          <Input label="Notes" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
