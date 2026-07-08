"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { useAuth } from "@/contexts/AuthContext";
import { Expense } from "@/types";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { logAudit } from "@/lib/audit";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToCSV } from "@/lib/export";
import { Plus, Download, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

export default function ExpensesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: expenses, loading, create, remove } = useShopCollection<Expense>("expenses");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "miscellaneous", vendor: "", notes: "", paymentMethod: "cash", expenseDate: new Date().toISOString().split("T")[0] });

  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const monthly = expenses.filter((e) => e.expenseDate?.startsWith(month));
    const monthlyTotal = monthly.reduce((s, e) => s + e.amount, 0);
    const yearly = expenses.filter((e) => e.expenseDate?.startsWith(new Date().getFullYear().toString()));
    const yearlyTotal = yearly.reduce((s, e) => s + e.amount, 0);
    return { monthlyTotal, yearlyTotal, count: expenses.length };
  }, [expenses]);

  const { paginatedItems, currentPage, setCurrentPage, totalItems } = usePagination(expenses);

  const handleSave = async () => {
    if (!profile || !form.amount) { toast.error("Amount required"); return; }
    setSaving(true);
    try {
      const id = await create({ ...form, amount: Number(form.amount), userId: profile.userId, shopId: profile.shopId } as Omit<Expense, "id" | "createdAt" | "updatedAt">);
      await logAudit({ shopId: profile.shopId, userId: profile.userId, userName: profile.displayName, userEmail: profile.email, action: "create", entity: "expense", entityId: id, entityName: form.vendor || "Expense", details: formatCurrency(Number(form.amount)) });
      toast.success("Expense added");
      setModalOpen(false);
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const getCategoryLabel = (cat: string) => EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <DashboardLayout title="Expense Management">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Monthly Expenses" value={formatCurrency(stats.monthlyTotal)} icon={<IndianRupee className="h-5 w-5" />} color="orange" />
          <StatCard title="Yearly Expenses" value={formatCurrency(stats.yearlyTotal)} icon={<IndianRupee className="h-5 w-5" />} color="red" />
          <StatCard title="Total Records" value={stats.count} icon={<IndianRupee className="h-5 w-5" />} color="blue" />
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => exportToCSV(expenses, [{ key: "vendor", label: "Vendor" }, { key: "category", label: "Category" }, { key: "amount", label: "Amount" }, { key: "expenseDate", label: "Date" }], "expenses")}><Download className="h-4 w-4" /> Export</Button>
          <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add Expense</Button>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? <div className="p-8 text-center text-slate-500">Loading...</div> : expenses.length === 0 ? (
            <EmptyState title="No expenses" actionLabel="Add Expense" onAction={() => setModalOpen(true)} />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 dark:bg-slate-900"><th className="text-left px-4 py-3">Vendor</th><th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Amount</th><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Method</th></tr></thead>
                <tbody>{paginatedItems.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-3 font-medium">{e.vendor}</td>
                    <td className="px-4 py-3"><Badge status="submitted" label={getCategoryLabel(e.category)} /></td>
                    <td className="px-4 py-3 font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3">{formatDate(e.expenseDate)}</td>
                    <td className="px-4 py-3 capitalize">{e.paymentMethod}</td>
                  </tr>
                ))}</tbody>
              </table>
              <Pagination totalItems={totalItems} currentPage={currentPage} onPageChange={setCurrentPage} />
            </>
          )}
        </div>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Expense" footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}>
        <div className="space-y-3">
          <Input label="Amount (₹)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))} />
          <Input label="Vendor" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          <Input label="Date" type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
          <Select label="Payment Method" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} options={[{ value: "cash", label: "Cash" }, { value: "upi", label: "UPI" }, { value: "bank_transfer", label: "Bank Transfer" }]} />
          <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
