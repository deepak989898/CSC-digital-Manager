"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getAllShops } from "@/lib/firebase/auth";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [shops, customers, applications, payments, subscriptions, staff] = await Promise.all([
          getAllShops(),
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
      } catch (err) {
        console.error("Admin dashboard load error:", err);
        setError("Failed to load platform data. Check Firestore rules and super admin role.");
        setStats({
          totalShops: 0,
          activeShops: 0,
          totalCustomers: 0,
          totalApplications: 0,
          totalPayments: 0,
          totalEarnings: 0,
          trialShops: 0,
          expiredShops: 0,
          subscriptionRevenue: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Super Admin Control Panel">
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout title="Super Admin Control Panel">
        <p className="text-slate-600 dark:text-slate-400">Unable to load dashboard.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Super Admin Control Panel">
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 px-4 py-3 text-sm text-orange-800 dark:text-orange-200">
            {error}
          </div>
        )}

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
                <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <item.icon className="h-5 w-5 text-brand-blue" />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="Platform Health">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2"><Server className="h-5 w-5 text-green-600" /><span className="text-sm font-medium text-slate-900 dark:text-slate-100">Firestore</span></div>
                <span className="text-xs text-green-600 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center gap-2"><HardDrive className="h-5 w-5 text-green-600" /><span className="text-sm font-medium text-slate-900 dark:text-slate-100">Firebase Storage</span></div>
                <span className="text-xs text-green-600 font-medium">Ready</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Server health monitoring ready for integration.</p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
