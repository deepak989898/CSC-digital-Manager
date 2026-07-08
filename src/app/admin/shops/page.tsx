"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAllShops } from "@/lib/firebase/auth";
import { updateDocument } from "@/lib/firebase/firestore";
import { Shop } from "@/types";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [search, setSearch] = useState("");

  const loadShops = async () => {
    const data = await getAllShops();
    setShops(data);
    setLoading(false);
  };

  useEffect(() => {
    loadShops();
  }, []);

  const filtered = shops.filter(
    (s) =>
      s.shopName.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      s.mobile.includes(search)
  );

  const { paginatedItems, currentPage, setCurrentPage, totalItems } =
    usePagination(filtered);

  const toggleShop = async (shop: Shop) => {
    try {
      await updateDocument("shops", shop.id, { isActive: !shop.isActive });
      await updateDocument("users", shop.userId, { isActive: !shop.isActive });
      toast.success(`Shop ${shop.isActive ? "deactivated" : "activated"}`);
      await loadShops();
    } catch {
      toast.error("Failed to update shop status");
    }
  };

  return (
    <DashboardLayout title="All Shops" showSearch searchValue={search} onSearchChange={setSearch}>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Shop Name</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Owner</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Mobile</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">City</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300 hidden md:table-cell">Joined</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((shop) => (
                    <tr key={shop.id} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{shop.shopName || "—"}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{shop.ownerName}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{shop.mobile || "—"}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{shop.city || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge status={shop.isActive ? "active" : "inactive"} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-500 dark:text-slate-400">{formatDate(shop.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setSelectedShop(shop)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                            <Eye className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                          </button>
                          <Button variant="ghost" size="sm" onClick={() => toggleShop(shop)}>
                            {shop.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination totalItems={totalItems} currentPage={currentPage} onPageChange={setCurrentPage} />
          </>
        )}
      </div>

      <Modal isOpen={!!selectedShop} onClose={() => setSelectedShop(null)} title="Shop Details">
        {selectedShop && (
          <div className="space-y-2 text-sm">
            <p><span className="text-slate-500">Shop:</span> {selectedShop.shopName}</p>
            <p><span className="text-slate-500">Owner:</span> {selectedShop.ownerName}</p>
            <p><span className="text-slate-500">Mobile:</span> {selectedShop.mobile}</p>
            <p><span className="text-slate-500">Email:</span> {selectedShop.email}</p>
            <p><span className="text-slate-500">Address:</span> {selectedShop.address}, {selectedShop.city}, {selectedShop.state} - {selectedShop.pincode}</p>
            {selectedShop.cscId && <p><span className="text-slate-500">CSC ID:</span> {selectedShop.cscId}</p>}
            <p><span className="text-slate-500">Status:</span> <Badge status={selectedShop.isActive ? "active" : "inactive"} /></p>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
