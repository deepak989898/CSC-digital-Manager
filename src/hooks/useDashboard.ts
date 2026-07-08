"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments } from "@/lib/firebase/firestore";
import {
  Application,
  Customer,
  Payment,
  DashboardStats,
  StaffMember,
  AuditLog,
  Expense,
} from "@/types";
import { isDateToday } from "@/lib/utils";
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from "date-fns";

export interface SmartDashboardExtras {
  monthlyEarnings: number;
  lastMonthEarnings: number;
  todayApplications: number;
  customerGrowthPercent: number;
  topServicesByRevenue: { name: string; revenue: number; count: number }[];
  staffPerformance: { name: string; applications: number; payments: number }[];
  recentActivities: { type: string; description: string; time: string }[];
  monthlyExpenses: number;
  profit: number;
}

export function useDashboardStats() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [smart, setSmart] = useState<SmartDashboardExtras | null>(null);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [topServices, setTopServices] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.shopId) return;

    async function load() {
      setLoading(true);
      try {
        const shopId = profile!.shopId;
        const [customers, applications, payments, staff, auditLogs, expenses] = await Promise.all([
          getShopDocuments<Customer>("customers", shopId),
          getShopDocuments<Application>("applications", shopId),
          getShopDocuments<Payment>("payments", shopId),
          getShopDocuments<StaffMember>("staff", shopId),
          getShopDocuments<AuditLog>("auditLogs", shopId),
          getShopDocuments<Expense>("expenses", shopId),
        ]);

        const paidPayments = payments.filter((p) => p.paymentStatus === "paid");
        const todayPayments = paidPayments.filter((p) => isDateToday(p.paymentDate));

        const pendingApps = applications.filter(
          (a) => a.status === "pending" || a.status === "submitted" || a.status === "in_progress"
        );

        const unpaidAmount = applications.reduce((sum, a) => {
          const remaining = a.applicationFee - a.amountPaid;
          return remaining > 0 ? sum + remaining : sum;
        }, 0);

        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const thisMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const inRange = (dateStr: string, start: Date, end: Date) =>
          isWithinInterval(parseISO(dateStr), { start, end });

        const monthlyEarnings = paidPayments
          .filter((p) => inRange(p.paymentDate, thisMonthStart, thisMonthEnd))
          .reduce((s, p) => s + p.amount, 0);

        const lastMonthEarnings = paidPayments
          .filter((p) => inRange(p.paymentDate, lastMonthStart, lastMonthEnd))
          .reduce((s, p) => s + p.amount, 0);

        const monthlyExpenses = expenses
          .filter((e) => inRange(e.expenseDate, thisMonthStart, thisMonthEnd))
          .reduce((s, e) => s + e.amount, 0);

        const customersThisMonth = customers.filter((c) =>
          inRange(c.createdAt, thisMonthStart, thisMonthEnd)
        ).length;
        const customersLastMonth = customers.filter((c) =>
          inRange(c.createdAt, lastMonthStart, lastMonthEnd)
        ).length;
        const customerGrowthPercent =
          customersLastMonth > 0
            ? Math.round(((customersThisMonth - customersLastMonth) / customersLastMonth) * 100)
            : customersThisMonth > 0
              ? 100
              : 0;

        const serviceRevenue: Record<string, { revenue: number; count: number }> = {};
        paidPayments.forEach((p) => {
          if (!serviceRevenue[p.serviceName]) serviceRevenue[p.serviceName] = { revenue: 0, count: 0 };
          serviceRevenue[p.serviceName].revenue += p.amount;
          serviceRevenue[p.serviceName].count += 1;
        });
        const topServicesByRevenue = Object.entries(serviceRevenue)
          .sort(([, a], [, b]) => b.revenue - a.revenue)
          .slice(0, 5)
          .map(([name, data]) => ({ name, ...data }));

        const staffPerformance = staff.map((s) => ({
          name: s.name,
          applications: applications.filter((a) => a.userId === s.linkedUserId).length,
          payments: paidPayments.filter((p) => p.userId === s.linkedUserId).length,
        }));

        const recentActivities = auditLogs
          .slice(0, 8)
          .map((log) => ({
            type: log.action,
            description: `${log.userName} ${log.action} ${log.entity}: ${log.entityName}`,
            time: log.createdAt,
          }));

        setStats({
          totalCustomers: customers.length,
          totalApplications: applications.length,
          pendingApplications: pendingApps.length,
          completedApplications: applications.filter((a) => a.status === "completed").length,
          rejectedApplications: applications.filter((a) => a.status === "rejected").length,
          totalEarnings: paidPayments.reduce((sum, p) => sum + p.amount, 0),
          pendingPayments: unpaidAmount,
          todayEarnings: todayPayments.reduce((sum, p) => sum + p.amount, 0),
        });

        setSmart({
          monthlyEarnings,
          lastMonthEarnings,
          todayApplications: applications.filter((a) => isDateToday(a.createdAt)).length,
          customerGrowthPercent,
          topServicesByRevenue,
          staffPerformance,
          recentActivities,
          monthlyExpenses,
          profit: monthlyEarnings - monthlyExpenses,
        });

        setRecentApplications(
          [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
        );

        const serviceCounts: Record<string, number> = {};
        applications.forEach((a) => {
          serviceCounts[a.serviceName] = (serviceCounts[a.serviceName] || 0) + 1;
        });
        const top = Object.entries(serviceCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));
        setTopServices(top);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [profile?.shopId]);

  return { stats, smart, recentApplications, topServices, loading };
}
