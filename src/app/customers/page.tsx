"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { Customer } from "@/types";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { ConfirmModal } from "@/components/ui/Modal";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getShopDocuments } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Application } from "@/types";
import { useEffect } from "react";

export default function CustomersPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: customers, loading, remove } = useShopCollection<Customer>("customers");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!profile?.shopId) return;
    getShopDocuments<Application>("applications", profile.shopId).then((apps) => {
      const counts: Record<string, number> = {};
      apps.forEach((a) => {
        counts[a.customerId] = (counts[a.customerId] || 0) + 1;
      });
      setAppCounts(counts);
    });
  }, [profile?.shopId, customers]);

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search)
  );

  const { paginatedItems, currentPage, setCurrentPage, totalItems } =
    usePagination(filtered);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await remove(deleteId);
      toast.success("Customer deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardLayout
      title="Customers"
      showSearch
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => router.push("/customers/add")}>
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6"><TableSkeleton /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="users"
              title="No customers yet"
              description="Add your first customer to get started"
              actionLabel="Add Customer"
              onAction={() => router.push("/customers/add")}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Mobile</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Address</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Applications</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((customer) => (
                      <tr key={customer.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{customer.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">{customer.mobile}</td>
                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell truncate max-w-[200px]">
                          {customer.address}
                        </td>
                        <td className="px-4 py-3">
                          <Badge status="active" label={String(appCounts[customer.id] || 0)} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/customers/${customer.id}`}>
                              <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
                                <Eye className="h-4 w-4" />
                              </button>
                            </Link>
                            <Link href={`/customers/${customer.id}?edit=true`}>
                              <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
                                <Pencil className="h-4 w-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() => setDeleteId(customer.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                totalItems={totalItems}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        loading={deleting}
      />
    </DashboardLayout>
  );
}
