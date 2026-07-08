"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getDocuments } from "@/lib/firebase/firestore";
import { Subscription } from "@/types";
import { StatCard } from "@/components/ui/Card";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { IndianRupee, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminRevenuePage() {
  const [stats, setStats] = useState({ total: 0, monthly: 0, active: 0, trial: 0 });
  const [chartData, setChartData] = useState<{ name: string; revenue: number }[]>([]);

  useEffect(() => {
    getDocuments<Subscription>("subscriptions").then((subs) => {
      const paid = subs.filter((s) => s.amount > 0);
      const total = paid.reduce((s, p) => s + p.amount, 0);
      const month = new Date().toISOString().slice(0, 7);
      const monthly = paid.filter((s) => s.createdAt.startsWith(month)).reduce((s, p) => s + p.amount, 0);
      const active = subs.filter((s) => s.status === "active").length;
      const trial = subs.filter((s) => s.status === "trial").length;

      const byPlan: Record<string, number> = {};
      paid.forEach((s) => { byPlan[s.planName] = (byPlan[s.planName] || 0) + s.amount; });

      setStats({ total, monthly, active, trial });
      setChartData(Object.entries(byPlan).map(([name, revenue]) => ({ name, revenue })));
    });
  }, []);

  return (
    <DashboardLayout title="Subscription Revenue">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Total Revenue" value={formatCurrency(stats.total)} icon={<IndianRupee className="h-5 w-5" />} color="green" />
          <StatCard title="This Month" value={formatCurrency(stats.monthly)} icon={<TrendingUp className="h-5 w-5" />} color="blue" />
          <StatCard title="Active Subs" value={stats.active} icon={<Users className="h-5 w-5" />} color="purple" />
          <StatCard title="Trial Subs" value={stats.trial} icon={<Users className="h-5 w-5" />} color="orange" />
        </div>
        <Card title="Revenue by Plan">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500 text-center py-8">No revenue data</p>}
        </Card>
      </div>
    </DashboardLayout>
  );
}
