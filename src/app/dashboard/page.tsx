"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useDashboardStats } from "@/hooks/useDashboard";
import { StatCard } from "@/components/ui/Card";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  IndianRupee,
  TrendingUp,
  Wallet,
  Bot,
  Calendar,
  Plus,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { useSubscription } from "@/hooks/useSubscription";
import { useReminders } from "@/hooks/useReminders";
import { SubscriptionCard } from "@/components/subscription/SubscriptionCard";
import { PlanUsageCard } from "@/components/subscription/PlanUsageCard";
import { getShopDocuments } from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Payment } from "@/types";

const CHART_COLORS = ["#f97316", "#2563eb", "#8b5cf6", "#22c55e", "#ef4444"];

export default function DashboardPage() {
  const { profile } = useAuth();
  const { stats, smart, recentApplications, topServices, loading, smartLoading } = useDashboardStats();
  const { subscription, plan, usage, loading: subLoading } = useSubscription();
  const { reminders: upcomingReminders } = useReminders(true);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!profile?.shopId) return;
    getShopDocuments<Payment>("payments", profile.shopId).then((p) => setRecentPayments(p.slice(0, 5)));
  }, [profile?.shopId]);

  if (loading || !stats) {
    return (
      <DashboardLayout title="Smart Dashboard">
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  const chartData = [
    { name: "Pending", value: stats.pendingApplications },
    { name: "Completed", value: stats.completedApplications },
    { name: "Rejected", value: stats.rejectedApplications },
  ].filter((d) => d.value > 0);

  return (
    <DashboardLayout title="Smart Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { href: "/customers/add", label: "Add Customer", icon: Users },
            { href: "/applications/add", label: "New Application", icon: FileText },
            { href: "/payments", label: "Record Payment", icon: IndianRupee },
            { href: "/appointments", label: "Book Schedule", icon: Calendar },
            { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
            { href: "/expenses", label: "Add Expense", icon: Wallet },
            { href: "/tickets", label: "New Ticket", icon: Clock },
            { href: "/reports/advanced", label: "View Reports", icon: TrendingUp },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow text-center">
              <action.icon className="h-5 w-5 text-brand-blue" />
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{action.label}</span>
            </Link>
          ))}
        </div>

        {(smart || smartLoading) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {smartLoading && !smart ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                ))}
              </>
            ) : smart ? (
              <>
            <StatCard title="Monthly Revenue" value={formatCurrency(smart.monthlyEarnings)} icon={<IndianRupee className="h-5 w-5" />} color="green" trend={smart.lastMonthEarnings > 0 ? `${Math.round(((smart.monthlyEarnings - smart.lastMonthEarnings) / smart.lastMonthEarnings) * 100)}% vs last month` : undefined} />
            <StatCard title="Monthly Profit" value={formatCurrency(smart.profit)} icon={<TrendingUp className="h-5 w-5" />} color="blue" />
            <StatCard title="Today's Applications" value={smart.todayApplications} icon={<Plus className="h-5 w-5" />} color="purple" />
            <StatCard title="Customer Growth" value={`${smart.customerGrowthPercent}%`} icon={smart.customerGrowthPercent >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />} color={smart.customerGrowthPercent >= 0 ? "green" : "red"} />
              </>
            ) : null}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Total Applications"
            value={stats.totalApplications}
            icon={<FileText className="h-5 w-5" />}
            color="purple"
          />
          <StatCard
            title="Completed"
            value={stats.completedApplications}
            icon={<CheckCircle className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            title="Total Earnings"
            value={formatCurrency(stats.totalEarnings)}
            icon={<IndianRupee className="h-5 w-5" />}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pending Applications"
            value={stats.pendingApplications}
            icon={<Clock className="h-5 w-5" />}
            color="orange"
          />
          <StatCard
            title="Rejected"
            value={stats.rejectedApplications}
            icon={<XCircle className="h-5 w-5" />}
            color="red"
          />
          <StatCard
            title="Pending Payments"
            value={formatCurrency(stats.pendingPayments)}
            icon={<Wallet className="h-5 w-5" />}
            color="orange"
          />
          <StatCard
            title="Today's Earnings"
            value={formatCurrency(stats.todayEarnings)}
            icon={<TrendingUp className="h-5 w-5" />}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SubscriptionCard subscription={subscription} planName={plan?.name} monthlyPrice={plan?.monthlyPrice} loading={subLoading} />
          <PlanUsageCard usage={usage} planName={plan?.name} loading={subLoading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Applications Overview" className="lg:col-span-1">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No applications yet</p>
            )}
          </Card>

          <Card title="Top Services" className="lg:col-span-1">
            {topServices.length > 0 ? (
              <div className="space-y-3">
                {topServices.map((service, i) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                      <span className="text-sm text-slate-700">{service.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-blue">
                      {service.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No data yet</p>
            )}
          </Card>

          <Card
            title="Recent Applications"
            className="lg:col-span-1"
            action={
              <Link href="/applications" className="text-sm text-brand-blue hover:underline">
                View all
              </Link>
            }
          >
            {recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{app.customerName}</p>
                      <p className="text-xs text-slate-500">{app.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <Badge status={app.status} />
                      <p className="text-xs text-slate-400 mt-1">{formatDate(app.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No applications yet</p>
            )}
          </Card>
        </div>

        {smart && smart.recentActivities.length > 0 && (
          <Card title="Recent Activities" action={<Link href="/audit-logs" className="text-sm text-brand-blue hover:underline">View all</Link>}>
            <div className="space-y-2">
              {smart.recentActivities.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                  <Activity className="h-4 w-4 text-brand-blue shrink-0" />
                  <div className="flex-1"><p className="text-sm">{a.description}</p></div>
                  <p className="text-xs text-slate-400">{formatDate(a.time)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {smart && smart.topServicesByRevenue.length > 0 && (
            <Card title="Top Services by Revenue">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={smart.topServicesByRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}
          {smart && smart.staffPerformance.length > 0 && (
            <Card title="Staff Performance">
              <div className="space-y-3">
                {smart.staffPerformance.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-2 rounded-lg border">
                    <span className="text-sm font-medium">{s.name}</span>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>{s.applications} apps</span>
                      <span>{s.payments} payments</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Service Performance">
            {topServices.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topServices}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-slate-500 text-center py-8">No data</p>}
          </Card>

          <Card title="Recent Payments" action={<Link href="/payments" className="text-sm text-brand-blue hover:underline">View all</Link>}>
            {recentPayments.length > 0 ? (
              <div className="space-y-2">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex justify-between p-2 rounded-lg hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium">{p.customerName}</p>
                      <p className="text-xs text-slate-500">{p.serviceName}</p>
                    </div>
                    <p className="text-sm font-semibold text-brand-green">{formatCurrency(p.amount)}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-500 text-center py-8">No payments yet</p>}
          </Card>
        </div>

        {upcomingReminders.length > 0 && (
          <Card title="Upcoming Reminders" action={<Link href="/reminders" className="text-sm text-brand-blue hover:underline">View all</Link>}>
            <div className="space-y-2">
              {upcomingReminders.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">{r.customerName}</p>
                      <p className="text-xs text-slate-500">{r.message}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{formatDate(r.reminderDate)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
