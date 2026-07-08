"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { useAuth } from "@/contexts/AuthContext";
import { InventoryItem } from "@/types";
import { INVENTORY_CATEGORIES } from "@/lib/constants";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { StatCard } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

export default function InventoryPage() {
  const { profile } = useAuth();
  const { data: items, loading, create } = useShopCollection<InventoryItem>("inventory");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Other", quantity: "1", minStock: "5", purchaseDate: new Date().toISOString().split("T")[0], supplier: "", warrantyExpiry: "", unitPrice: "" });

  const lowStock = useMemo(() => items.filter((i) => i.quantity <= i.minStock), [items]);
  const { paginatedItems, currentPage, setCurrentPage, totalItems } = usePagination(items);

  const handleSave = async () => {
    if (!profile || !form.name) return;
    setSaving(true);
    try {
      await create({ ...form, quantity: Number(form.quantity), minStock: Number(form.minStock), unitPrice: Number(form.unitPrice) || 0, userId: profile.userId, shopId: profile.shopId } as Omit<InventoryItem, "id" | "createdAt" | "updatedAt">);
      toast.success("Item added");
      setModalOpen(false);
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout title="Inventory">
      <div className="space-y-6">
        {lowStock.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <p className="text-sm text-orange-800 dark:text-orange-200">{lowStock.length} item(s) low on stock: {lowStock.map((i) => i.name).join(", ")}</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Items" value={items.length} icon={<Package className="h-5 w-5" />} color="blue" />
          <StatCard title="Low Stock" value={lowStock.length} icon={<AlertTriangle className="h-5 w-5" />} color="orange" />
          <StatCard title="Categories" value={new Set(items.map((i) => i.category)).size} icon={<Package className="h-5 w-5" />} color="purple" />
        </div>
        <div className="flex justify-end"><Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add Item</Button></div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
          {loading ? <div className="p-8 text-center">Loading...</div> : items.length === 0 ? (
            <EmptyState title="No inventory items" actionLabel="Add Item" onAction={() => setModalOpen(true)} />
          ) : (
            <>
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 dark:bg-slate-900"><th className="text-left px-4 py-3">Item</th><th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Stock</th><th className="text-left px-4 py-3">Supplier</th><th className="text-left px-4 py-3">Warranty</th></tr></thead>
                <tbody>{paginatedItems.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3"><Badge status={item.quantity <= item.minStock ? "pending" : "active"} label={`${item.quantity} / min ${item.minStock}`} /></td>
                    <td className="px-4 py-3">{item.supplier}</td>
                    <td className="px-4 py-3">{item.warrantyExpiry ? formatDate(item.warrantyExpiry) : "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
              <Pagination totalItems={totalItems} currentPage={currentPage} onPageChange={setCurrentPage} />
            </>
          )}
        </div>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Inventory Item" footer={<><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}>
        <div className="space-y-3">
          <Input label="Item Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={INVENTORY_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Input label="Min Stock Alert" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
          </div>
          <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <Input label="Purchase Date" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
          <Input label="Warranty Expiry" type="date" value={form.warrantyExpiry} onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })} />
        </div>
      </Modal>
    </DashboardLayout>
  );
}
