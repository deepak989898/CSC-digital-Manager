"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getDocument, updateDocument, getShopDocuments, createDocument } from "@/lib/firebase/firestore";
import { Customer, Application, Payment, DocumentRecord, CrmActivity } from "@/types";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { INDIAN_STATES, LEAD_STATUSES, CUSTOMER_PRIORITIES } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Tag, Phone, Mail, FileText, IndianRupee, Plus } from "lucide-react";
import { logAudit } from "@/lib/audit";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("edit") === "true";
  const router = useRouter();
  const { profile } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [tagInput, setTagInput] = useState("");
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
      setApplications(apps.filter((a) => a.customerId === id));
      setPayments(pays.filter((p) => p.customerId === id));
      setDocuments(docs.filter((d) => d.customerId === id));
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
        shopId: profile.shopId,
      });
      setNoteText("");
      toast.success("Note added");
      loadData();
    } catch {
      toast.error("Failed to add note");
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

  return (
    <DashboardLayout title={isEdit ? "Edit Customer" : "Customer CRM"}>
      <div className="max-w-5xl mx-auto space-y-6">
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </Link>

        {isEdit ? (
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
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
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-xs"><Tag className="h-3 w-3" />{tag}</span>
                      ))}
                    </div>
                  )}
                  {customer.birthday && <div><span className="text-slate-500">Birthday:</span> {formatDate(customer.birthday)}</div>}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title="Applications" action={<Link href={`/applications/add?customerId=${id}`} className="text-sm text-brand-blue">Add</Link>}>
                {applications.length === 0 ? <p className="text-sm text-slate-500">No applications</p> : (
                  <div className="space-y-2">
                    {applications.map((app) => (
                      <Link key={app.id} href={`/applications/${app.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border">
                        <div><p className="text-sm font-medium">{app.referenceNumber}</p><p className="text-xs text-slate-500">{app.serviceName}</p></div>
                        <Badge status={app.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Payments">
                {payments.length === 0 ? <p className="text-sm text-slate-500">No payments</p> : (
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-green-600" /><div><p className="text-sm font-medium">{formatCurrency(p.amount)}</p><p className="text-xs text-slate-500">{p.serviceName}</p></div></div>
                        <Badge status={p.paymentStatus} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Documents">
                {documents.length === 0 ? <p className="text-sm text-slate-500">No documents</p> : (
                  <div className="space-y-2">
                    {documents.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 p-2 rounded-lg border">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <div><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-slate-500">{d.type}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
