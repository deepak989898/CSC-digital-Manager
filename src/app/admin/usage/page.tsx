"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAllShops } from "@/lib/firebase/auth";
import { getShopUsageCounts } from "@/lib/subscription";
import { getShopSubscription } from "@/lib/subscription";
import { Shop } from "@/types";
import { Badge } from "@/components/ui/Badge";

interface ShopUsage {
  shop: Shop;
  usage: { customers: number; applications: number; storageMB: number; staff: number };
  planName: string;
}

export default function AdminUsagePage() {
  const [data, setData] = useState<ShopUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const shops = await getAllShops();
      const results: ShopUsage[] = [];
      for (const shop of shops.slice(0, 50)) {
        const [usage, sub] = await Promise.all([
          getShopUsageCounts(shop.id),
          getShopSubscription(shop.id),
        ]);
        results.push({ shop, usage, planName: sub?.planName || "None" });
      }
      setData(results.sort((a, b) => b.usage.applications - a.usage.applications));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <DashboardLayout title="Usage by Shop">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
        {loading ? <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading usage data...</div> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Shop</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Customers</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Applications</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Storage MB</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Staff</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(({ shop, usage, planName }) => (
                <tr key={shop.id} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{shop.shopName || shop.ownerName}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{planName}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{usage.customers}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{usage.applications}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{usage.storageMB}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{usage.staff}</td>
                  <td className="px-4 py-3"><Badge status={shop.isActive ? "active" : "inactive"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
