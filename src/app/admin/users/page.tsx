"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAllUsers } from "@/lib/firebase/auth";
import { updateDocument } from "@/lib/firebase/firestore";
import { UserProfile } from "@/types";
import { Badge } from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const { paginatedItems, currentPage, setCurrentPage, totalItems } =
    usePagination(filtered);

  const changeRole = async (user: UserProfile, role: string) => {
    try {
      await updateDocument("users", user.id, { role });
      toast.success("Role updated");
      await loadUsers();
    } catch {
      toast.error("Failed to update role");
    }
  };

  return (
    <DashboardLayout title="All Users" showSearch searchValue={search} onSearchChange={setSearch}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((user) => (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{user.displayName}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge status={user.role === "super_admin" ? "submitted" : "active"} label={user.role === "super_admin" ? "Super Admin" : "Shop Owner"} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={user.isActive ? "active" : "inactive"} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-500">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Select
                          value={user.role}
                          onChange={(e) => changeRole(user, e.target.value)}
                          options={[
                            { value: "shop_owner", label: "Shop Owner" },
                            { value: "super_admin", label: "Super Admin" },
                          ]}
                          className="w-36"
                        />
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
    </DashboardLayout>
  );
}
