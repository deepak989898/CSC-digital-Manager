"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { Customer, Application, DocumentRecord } from "@/types";
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
import { DOCUMENT_TYPES } from "@/lib/constants";
import { useEffect } from "react";
import { formatDateTime } from "@/lib/utils";

function getDocumentDisplayName(doc: DocumentRecord): string {
  if (doc.type === "other" && doc.customName?.trim()) return doc.customName.trim();
  if (doc.name?.trim()) return doc.name.trim();
  const found = DOCUMENT_TYPES.find((t) => t.value === doc.type);
  return found?.label || doc.type.replace(/_/g, " ");
}

export default function CustomersPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { data: customers, loading, remove } = useShopCollection<Customer>("customers");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});
  const [customerDocs, setCustomerDocs] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!profile?.shopId) return;
    Promise.all([
      getShopDocuments<Application>("applications", profile.shopId),
      getShopDocuments<DocumentRecord>("documents", profile.shopId),
    ]).then(([apps, docs]) => {
      const counts: Record<string, number> = {};
      apps.forEach((a) => {
        counts[a.customerId] = (counts[a.customerId] || 0) + 1;
      });
      setAppCounts(counts);

      const docMap: Record<string, Set<string>> = {};
      docs.forEach((d) => {
        if (!d.customerId) return;
        if (!docMap[d.customerId]) docMap[d.customerId] = new Set();
        docMap[d.customerId].add(getDocumentDisplayName(d));
      });
      const byCustomer: Record<string, string[]> = {};
      Object.entries(docMap).forEach(([customerId, names]) => {
        byCustomer[customerId] = Array.from(names).sort((a, b) => a.localeCompare(b));
      });
      setCustomerDocs(byCustomer);
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

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-slate-900 dark:text-slate-100">
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
                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Mobile</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 hidden md:table-cell">Address</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 hidden lg:table-cell">Documents</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Applications</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-300 hidden lg:table-cell">Joined</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((customer) => (
                      <tr key={customer.id} className="border-b border-slate-50 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          <div>{customer.fullName}</div>
                          {(customerDocs[customer.id]?.length ?? 0) > 0 && (
                            <div className="lg:hidden flex flex-wrap gap-1 mt-1">
                              {customerDocs[customer.id].map((docName) => (
                                <span
                                  key={`${customer.id}-m-${docName}`}
                                  className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] bg-blue-50 text-brand-blue dark:bg-blue-950/50 dark:text-blue-300"
                                >
                                  {docName}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{customer.mobile}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell truncate max-w-[200px]">
                          {customer.address}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {(customerDocs[customer.id]?.length ?? 0) > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {customerDocs[customer.id].map((docName) => (
                                <span
                                  key={`${customer.id}-${docName}`}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-brand-blue dark:bg-blue-950/50 dark:text-blue-300 border border-blue-100 dark:border-blue-900"
                                  title={docName}
                                >
                                  {docName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">No documents</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge status="active" label={String(appCounts[customer.id] || 0)} />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {customer.createdAt ? formatDateTime(customer.createdAt) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/customers/${customer.id}`}>
                              <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300">
                                <Eye className="h-4 w-4" />
                              </button>
                            </Link>
                            <Link href={`/customers/${customer.id}?edit=true`}>
                              <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300">
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
