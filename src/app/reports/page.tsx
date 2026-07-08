"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments } from "@/lib/firebase/firestore";
import { Payment, Application, Customer } from "@/types";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { IndianRupee, Users, FileText, CheckCircle } from "lucide-react";

const COLORS = ["#2563eb", "#f97316", "#22c55e", "#8b5cf6", "#ef4444"];

export default function ReportsPage() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!profile?.shopId) return;
    Promise.all([
      getShopDocuments<Payment>("payments", profile.shopId),
      getShopDocuments<Application>("applications", profile.shopId),
      getShopDocuments<Customer>("customers", profile.shopId),
    ]).then(([p, a, c]) => {
      setPayments(p);
      setApplications(a);
      setCustomers(c);
      setLoading(false);
    });
  }, [profile?.shopId]);

  const filteredPayments = useMemo(() => {
    if (!dateFrom && !dateTo) return payments.filter((p) => p.paymentStatus === "paid");
    return payments.filter((p) => {
      if (p.paymentStatus !== "paid") return false;
      const date = parseISO(p.paymentDate);
      if (dateFrom && dateTo) {
        return isWithinInterval(date, {
          start: startOfDay(parseISO(dateFrom)),
          end: endOfDay(parseISO(dateTo)),
        });
      }
      if (dateFrom) return date >= startOfDay(parseISO(dateFrom));
      if (dateTo) return date <= endOfDay(parseISO(dateTo));
      return true;
    });
  }, [payments, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const totalEarnings = filteredPayments.reduce((s, p) => s + p.amount, 0);
    const today = new Date().toISOString().split("T")[0];
    const dailyEarnings = filteredPayments
      .filter((p) => p.paymentDate.startsWith(today))
      .reduce((s, p) => s + p.amount, 0);
    const month = today.slice(0, 7);
    const monthlyEarnings = filteredPayments
      .filter((p) => p.paymentDate.startsWith(month))
      .reduce((s, p) => s + p.amount, 0);

    const serviceEarnings: Record<string, number> = {};
    filteredPayments.forEach((p) => {
      serviceEarnings[p.serviceName] = (serviceEarnings[p.serviceName] || 0) + p.amount;
    });

    const statusCounts = {
      pending: applications.filter((a) => a.status === "pending" || a.status === "submitted" || a.status === "in_progress").length,
      completed: applications.filter((a) => a.status === "completed").length,
    };

    return {
      totalEarnings,
      dailyEarnings,
      monthlyEarnings,
      serviceEarnings: Object.entries(serviceEarnings).map(([name, amount]) => ({ name, amount })),
      statusCounts,
      customerCount: customers.length,
    };
  }, [filteredPayments, applications, customers]);

  if (loading) {
    return (
      <DashboardLayout title="Reports">
        <PageSkeleton />
      </DashboardLayout>
    );
  }

  const statusChart = [
    { name: "Pending", value: stats.statusCounts.pending },
    { name: "Completed", value: stats.statusCounts.completed },
  ].filter((d) => d.value > 0);

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input label="From Date" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="sm:w-48" />
          <Input label="To Date" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="sm:w-48" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Earnings" value={formatCurrency(stats.totalEarnings)} icon={<IndianRupee className="h-5 w-5" />} color="green" />
          <StatCard title="Daily Earnings" value={formatCurrency(stats.dailyEarnings)} icon={<IndianRupee className="h-5 w-5" />} color="blue" />
          <StatCard title="Monthly Earnings" value={formatCurrency(stats.monthlyEarnings)} icon={<IndianRupee className="h-5 w-5" />} color="purple" />
          <StatCard title="Customers" value={stats.customerCount} icon={<Users className="h-5 w-5" />} color="blue" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Pending Applications" value={stats.statusCounts.pending} icon={<FileText className="h-5 w-5" />} color="orange" />
          <StatCard title="Completed Applications" value={stats.statusCounts.completed} icon={<CheckCircle className="h-5 w-5" />} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Service-wise Earnings">
            {stats.serviceEarnings.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.serviceEarnings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No earnings data</p>
            )}
          </Card>

          <Card title="Applications by Status">
            {statusChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusChart} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                    {statusChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No application data</p>
            )}
          </Card>
        </div>

        <Card title="Recent Payments">
          {filteredPayments.length === 0 ? (
            <p className="text-sm text-slate-500">No payments in selected period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 font-medium text-slate-600">Customer</th>
                    <th className="text-left py-2 font-medium text-slate-600">Service</th>
                    <th className="text-left py-2 font-medium text-slate-600">Amount</th>
                    <th className="text-left py-2 font-medium text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.slice(0, 10).map((p) => (
                    <tr key={p.id} className="border-b border-slate-50">
                      <td className="py-2">{p.customerName}</td>
                      <td className="py-2">{p.serviceName}</td>
                      <td className="py-2 font-semibold">{formatCurrency(p.amount)}</td>
                      <td className="py-2 text-slate-500">{formatDate(p.paymentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
