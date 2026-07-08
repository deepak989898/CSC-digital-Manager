"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDocument,
  updateDocument,
  getShopDocuments,
  createDocument,
  deleteDocument,
} from "@/lib/firebase/firestore";
import { uploadFile, getStoragePath } from "@/lib/firebase/storage";
import { Customer, Application, Payment, DocumentRecord, CrmActivity, DocumentType } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  INDIAN_STATES,
  LEAD_STATUSES,
  CUSTOMER_PRIORITIES,
  DOCUMENT_TYPES,
} from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Tag,
  Phone,
  Mail,
  FileText,
  IndianRupee,
  Plus,
  Upload,
  Eye,
  Download,
  Trash2,
  Briefcase,
  User,
} from "lucide-react";
import { logAudit } from "@/lib/audit";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";
  const router = useRouter();
  const { profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [docType, setDocType] = useState<DocumentType>("aadhaar");
  const [docCustomName, setDocCustomName] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    aadhaarLast4: "",
    notes: "",
    priority: "medium" as Customer["priority"],
    leadStatus: "new" as Customer["leadStatus"],
    birthday: "",
    tags: [] as string[],
  });

  const loadData = async () => {
    const data = await getDocument<Customer>("customers", id);
    if (data) {
      setCustomer(data);
      setForm({
        fullName: data.fullName,
        mobile: data.mobile,
        email: data.email || "",
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        aadhaarLast4: data.aadhaarLast4,
        notes: data.notes || "",
        priority: data.priority || "medium",
        leadStatus: data.leadStatus || "new",
        birthday: data.birthday || "",
        tags: data.tags || [],
      });
    }
    if (profile?.shopId) {
      const [apps, pays, docs, acts] = await Promise.all([
        getShopDocuments<Application>("applications", profile.shopId),
        getShopDocuments<Payment>("payments", profile.shopId),
        getShopDocuments<DocumentRecord>("documents", profile.shopId),
        getShopDocuments<CrmActivity>("crmActivities", profile.shopId),
      ]);
      setApplications(
        apps
          .filter((a) => a.customerId === id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
      setPayments(
        pays
          .filter((p) => p.customerId === id)
          .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
      );
      setDocuments(
        docs
          .filter((d) => d.customerId === id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
      setActivities(
        acts
          .filter((a) => a.customerId === id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile?.shopId]);

  const workSummary = useMemo(() => {
    const totalFee = applications.reduce((s, a) => s + (a.applicationFee || 0), 0);
    const totalPaid = applications.reduce((s, a) => s + (a.amountPaid || 0), 0);
    const pending = Math.max(0, totalFee - totalPaid);
    const completed = applications.filter((a) => a.status === "completed").length;
    const inProgress = applications.filter((a) =>
      ["pending", "submitted", "in_progress"].includes(a.status)
    ).length;
    return { totalFee, totalPaid, pending, completed, inProgress, totalJobs: applications.length };
  }, [applications]);

  const handleChange = (field: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDocument("customers", id, form);
      if (profile) {
        await logAudit({
          shopId: profile.shopId,
          userId: profile.userId,
          userName: profile.displayName,
          userEmail: profile.email,
          action: "update",
          entity: "customer",
          entityId: id,
          entityName: form.fullName,
          details: "Updated customer CRM profile",
        });
      }
      toast.success("Customer updated");
      router.push(`/customers/${id}`);
    } catch {
      toast.error("Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (!tagInput.trim() || form.tags.includes(tagInput.trim())) return;
    handleChange("tags", [...form.tags, tagInput.trim()]);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    handleChange("tags", form.tags.filter((t) => t !== tag));
  };

  const addNote = async () => {
    if (!profile || !noteText.trim() || !customer) return;
    try {
      await createDocument("crmActivities", {
        customerId: id,
        customerName: customer.fullName,
        type: "note",
        title: "Note added",
        description: noteText.trim(),
        createdByName: profile.displayName,
        userId: profile.userId,
        shopId: profile.shopId || profile.userId,
      });
      setNoteText("");
      toast.success("Note added");
      loadData();
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customer || !profile) return;

    const typeLabel = DOCUMENT_TYPES.find((t) => t.value === docType)?.label || docType;
    const displayName =
      docType === "other" && docCustomName.trim()
        ? docCustomName.trim()
        : typeLabel;

    setUploading(true);
    try {
      const shopId = profile.shopId || profile.userId;
      const path = getStoragePath(shopId, "documents", file.name);
      const { url, fileName } = await uploadFile(path, file);
      await createDocument("documents", {
        customerId: id,
        customerName: customer.fullName,
        name: displayName,
        type: docType,
        customName: docType === "other" ? docCustomName.trim() || undefined : undefined,
        fileName,
        fileURL: url,
        fileSize: file.size,
        mimeType: file.type,
        verificationStatus: "pending",
        uploadedByName: profile.displayName,
        userId: profile.userId,
        shopId,
      });
      toast.success("Document uploaded");
      setDocCustomName("");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDeleteDoc = async (doc: DocumentRecord) => {
    if (!confirm(`Delete "${doc.name}"?`)) return;
    try {
      await deleteDocument("documents", doc.id);
      toast.success("Document deleted");
      await loadData();
    } catch {
      toast.error("Failed to delete document");
    }
  };

  const timeline = [
    ...activities.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      description: a.description,
      time: a.createdAt,
    })),
    ...applications.map((a) => ({
      id: a.id,
      type: "application" as const,
      title: `Application ${a.referenceNumber}`,
      description: `${a.serviceName} — ${a.status}`,
      time: a.createdAt,
    })),
    ...payments.map((p) => ({
      id: p.id,
      type: "payment" as const,
      title: `Payment ${formatCurrency(p.amount)}`,
      description: `${p.serviceName} — ${p.paymentStatus}`,
      time: p.paymentDate,
    })),
  ].sort((a, b) => b.time.localeCompare(a.time));

  if (loading) {
    return (
      <DashboardLayout title="Customer Details">
        <TableSkeleton />
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout title="Customer Not Found">
        <p className="text-slate-500">Customer not found.</p>
      </DashboardLayout>
    );
  }

  const documentsSection = (
    <Card
      title="Customer Documents"
      action={
        <span className="text-xs text-slate-500">{documents.length} file{documents.length !== 1 ? "s" : ""}</span>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-4 bg-slate-50/50 dark:bg-slate-800/40">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
            Upload PAN, Aadhaar, or any other document
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Select
              label="Document Type"
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              options={DOCUMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
            {docType === "other" && (
              <Input
                label="Document Name"
                value={docCustomName}
                onChange={(e) => setDocCustomName(e.target.value)}
                placeholder="e.g. Ration Card, Voter ID"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleDocUpload}
            />
            <Button
              type="button"
              variant="outline"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
              disabled={docType === "other" && !docCustomName.trim()}
            >
              <Upload className="h-4 w-4" />
              Choose & Upload
            </Button>
            <span className="text-xs text-slate-500">PDF or image, max 5 MB</span>
          </div>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded for this customer yet.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-brand-blue shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {d.fileName}
                      {d.uploadedByName ? ` · by ${d.uploadedByName}` : ""}
                      {" · "}
                      {formatDate(d.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge status={d.verificationStatus || "pending"} />
                  <a href={d.fileURL} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Eye className="h-4 w-4" />
                  </a>
                  <a href={d.fileURL} download className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(d)}
                    className="p-1.5 rounded hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  const workHistorySection = (
    <Card
      title="Work History"
      action={
        <Link href={`/applications/add?customerId=${id}`} className="text-sm text-brand-blue hover:underline">
          + New Work
        </Link>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
          <p className="text-xs text-slate-500">Total Jobs</p>
          <p className="text-lg font-semibold">{workSummary.totalJobs}</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
          <p className="text-xs text-slate-500">Total Amount</p>
          <p className="text-lg font-semibold">{formatCurrency(workSummary.totalFee)}</p>
        </div>
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
          <p className="text-xs text-green-700 dark:text-green-400">Paid</p>
          <p className="text-lg font-semibold text-green-700 dark:text-green-400">
            {formatCurrency(workSummary.totalPaid)}
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">Pending</p>
          <p className="text-lg font-semibold text-amber-700 dark:text-amber-400">
            {formatCurrency(workSummary.pending)}
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <p className="text-sm text-slate-500">No work / applications for this customer yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-left">
                <th className="pb-2 font-medium text-slate-600">Ref / Service</th>
                <th className="pb-2 font-medium text-slate-600">Status</th>
                <th className="pb-2 font-medium text-slate-600">Fee</th>
                <th className="pb-2 font-medium text-slate-600">Paid</th>
                <th className="pb-2 font-medium text-slate-600">Pending</th>
                <th className="pb-2 font-medium text-slate-600">Done By</th>
                <th className="pb-2 font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const pendingAmt = Math.max(0, (app.applicationFee || 0) - (app.amountPaid || 0));
                const doneBy =
                  app.completedByName ||
                  app.lastUpdatedByName ||
                  "—";
                return (
                  <tr key={app.id} className="border-b border-slate-50 dark:border-slate-800">
                    <td className="py-3 pr-2">
                      <Link href={`/applications/${app.id}`} className="font-medium text-brand-blue hover:underline">
                        {app.referenceNumber}
                      </Link>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Briefcase className="h-3 w-3" />
                        {app.serviceName}
                      </p>
                    </td>
                    <td className="py-3 pr-2">
                      <Badge status={app.status} />
                    </td>
                    <td className="py-3 pr-2">{formatCurrency(app.applicationFee)}</td>
                    <td className="py-3 pr-2 text-green-600">{formatCurrency(app.amountPaid)}</td>
                    <td className="py-3 pr-2 text-amber-600">{formatCurrency(pendingAmt)}</td>
                    <td className="py-3 pr-2">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                        <User className="h-3 w-3" />
                        {doneBy}
                      </span>
                      {app.completedAt && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(app.completedAt)}</p>
                      )}
                    </td>
                    <td className="py-3 text-slate-500 whitespace-nowrap">{formatDate(app.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {payments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-green-600" />
            Payment records
          </p>
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-700"
              >
                <div>
                  <p className="text-sm font-medium">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-slate-500">
                    {p.serviceName} · {p.applicationRef} · {formatDate(p.paymentDate)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge status={p.paymentStatus} />
                  <p className="text-[10px] text-slate-400 mt-1 capitalize">{p.paymentMethod.replace("_", " ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <DashboardLayout title={isEdit ? "Edit Customer" : "Customer CRM"}>
      <div className="max-w-5xl mx-auto space-y-6">
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </Link>

        {isEdit ? (
          <>
            <Card title="Edit Customer">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} required />
                  <Input label="Mobile" value={form.mobile} onChange={(e) => handleChange("mobile", e.target.value)} required />
                  <Input label="Email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
                  <Input label="Aadhaar Last 4" value={form.aadhaarLast4} onChange={(e) => handleChange("aadhaarLast4", e.target.value.slice(0, 4))} maxLength={4} required />
                  <Select label="Priority" value={form.priority || "medium"} onChange={(e) => handleChange("priority", e.target.value)} options={CUSTOMER_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} />
                  <Select label="Lead Status" value={form.leadStatus || "new"} onChange={(e) => handleChange("leadStatus", e.target.value)} options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
                  <Input label="Birthday" type="date" value={form.birthday} onChange={(e) => handleChange("birthday", e.target.value)} />
                </div>
                <Input label="Address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} required />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="City" value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
                  <Select label="State" value={form.state} onChange={(e) => handleChange("state", e.target.value)} options={INDIAN_STATES.map((s) => ({ value: s, label: s }))} placeholder="Select state" />
                  <Input label="Pincode" value={form.pincode} onChange={(e) => handleChange("pincode", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag" className="flex-1" />
                    <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-xs">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <Textarea label="Notes" value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={3} />
                <div className="flex gap-3">
                  <Button type="submit" loading={saving}>Save Changes</Button>
                  <Button variant="outline" type="button" onClick={() => router.push(`/customers/${id}`)}>Cancel</Button>
                </div>
              </form>
            </Card>
            {documentsSection}
            {workHistorySection}
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title={customer.fullName} className="lg:col-span-1">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{customer.mobile}</div>
                  {customer.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" />{customer.email}</div>}
                  <div><span className="text-slate-500">Aadhaar:</span> XXXX-XXXX-{customer.aadhaarLast4}</div>
                  <div className="flex gap-2">
                    {customer.priority && <Badge status={customer.priority} label={customer.priority} />}
                    {customer.leadStatus && <Badge status="submitted" label={customer.leadStatus} />}
                  </div>
                  {customer.tags && customer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs"><Tag className="h-3 w-3" />{tag}</span>
                      ))}
                    </div>
                  )}
                  {customer.birthday && <div><span className="text-slate-500">Birthday:</span> {formatDate(customer.birthday)}</div>}
                  <div><span className="text-slate-500">Joined:</span> {formatDateTime(customer.createdAt)}</div>
                  <div className="text-slate-500">{customer.address}, {customer.city}, {customer.state} - {customer.pincode}</div>
                  {customer.notes && <p className="text-slate-600 italic">{customer.notes}</p>}
                </div>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(`/customers/${id}?edit=true`)}>Edit Customer</Button>
              </Card>

              <Card title="Customer Timeline" className="lg:col-span-2">
                <div className="mb-4 flex gap-2">
                  <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a follow-up note..." rows={2} className="flex-1" />
                  <Button onClick={addNote} disabled={!noteText.trim()}><Plus className="h-4 w-4" /></Button>
                </div>
                {timeline.length === 0 ? (
                  <p className="text-sm text-slate-500">No activity yet</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {timeline.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="w-2 h-2 mt-2 rounded-full bg-brand-blue shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.description}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatDateTime(item.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {workHistorySection}
            {documentsSection}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
