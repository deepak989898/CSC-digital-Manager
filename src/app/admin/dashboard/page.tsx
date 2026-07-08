"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAllShops, getAllUsers } from "@/lib/firebase/auth";
import { getDocuments } from "@/lib/firebase/firestore";
import { Customer, Application, Payment, PlatformStats, Subscription, StaffMember } from "@/types";
import { StatCard } from "@/components/ui/Card";
import { Card } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  Store, Users, FileText, IndianRupee, Crown, UserPlus,
  HardDrive, AlertTriangle, CheckCircle, Server,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [staffCount, setStaffCount] = useState(0);
  const [activePlanCount, setActivePlanCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [shops, , customers, applications, payments, subscriptions, staff] = await Promise.all([
        getAllShops(),
        getAllUsers(),
        getDocuments<Customer>("customers"),
        getDocuments<Application>("applications"),
        getDocuments<Payment>("payments"),
        getDocuments<Subscription>("subscriptions"),
        getDocuments<StaffMember>("staff"),
      ]);

      const paidPayments = payments.filter((p) => p.paymentStatus === "paid");
      const now = new Date();
      const activePlans = subscriptions.filter(
        (s) => s.status === "active" && new Date(s.expiryDate) > now
      );
      const expiredPlans = subscriptions.filter(
        (s) => s.status === "expired" || new Date(s.expiryDate) <= now
      );
      const trialShops = subscriptions.filter((s) => s.status === "trial").length;
      const subscriptionRevenue = subscriptions
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + s.amount, 0);

      setStats({
        totalShops: shops.length,
        activeShops: shops.filter((s) => s.isActive).length,
        totalCustomers: customers.length,
        totalApplications: applications.length,
        totalPayments: payments.length,
        totalEarnings: paidPayments.reduce((s, p) => s + p.amount, 0),
        trialShops,
        expiredShops: expiredPlans.length,
        subscriptionRevenue,
      });
      setStaffCount(staff.length);
      setActivePlanCount(activePlans.length);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !stats) {
    return (
      <DashboardLayout title="Super Admin Control Panel">
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Super Admin Control Panel">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Shops" value={stats.totalShops} icon={<Store className="h-5 w-5" />} color="blue" trend={`${stats.activeShops} active`} />
          <StatCard title="Total Customers" value={stats.totalCustomers} icon={<Users className="h-5 w-5" />} color="purple" />
          <StatCard title="Total Applications" value={stats.totalApplications} icon={<FileText className="h-5 w-5" />} color="orange" />
          <StatCard title="Total Staff" value={staffCount} icon={<UserPlus className="h-5 w-5" />} color="blue" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Platform Revenue" value={formatCurrency(stats.totalEarnings)} icon={<IndianRupee className="h-5 w-5" />} color="green" />
          <StatCard title="Subscription Revenue" value={formatCurrency(stats.subscriptionRevenue || 0)} icon={<Crown className="h-5 w-5" />} color="green" />
          <StatCard title="Active Plans" value={activePlanCount} icon={<CheckCircle className="h-5 w-5" />} color="green" trend={`${stats.trialShops || 0} on trial`} />
          <StatCard title="Expired Plans" value={stats.expiredShops || 0} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Quick Actions">
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/admin/shops", label: "Manage Shops", icon: Store },
                { href: "/admin/plans", label: "Plan Management", icon: Crown },
                { href: "/admin/subscriptions", label: "Subscriptions", icon: IndianRupee },
                { href: "/admin/announcements", label: "Global Notifications", icon: Users },
                { href: "/admin/revenue", label: "Platform Revenue", icon: IndianRupee },
                { href: "/admin/usage", label: "Storage & Usage", icon: HardDrive },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <item.icon className="h-5 w-5 text-brand-blue" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="Platform Health">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2"><Server className="h-5 w-5 text-green-600" /><span className="text-sm font-medium">Firestore</span></div>
                <span className="text-xs text-green-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-green-600" /><span className="text-sm font-medium">Firebase Storage</span></div>
                <span className="text-xs text-green-600 font-medium">Ready</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2"><Crown className="h-5 w-5 text-brand-blue" /><span className="text-sm font-medium">Feature Toggles</span></div>
                <span className="text-xs text-brand-blue font-medium">Via Plans</span>
              </div>
              <p className="text-xs text-slate-500">Server health monitoring ready for integration with external monitoring services.</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
