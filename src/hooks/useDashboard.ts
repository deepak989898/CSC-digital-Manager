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

function buildStats(
  customers: Customer[],
  applications: Application[],
  payments: Payment[]
): { stats: DashboardStats; recentApplications: Application[]; topServices: { name: string; count: number }[] } {
  const paidPayments = payments.filter((p) => p.paymentStatus === "paid");
  const todayPayments = paidPayments.filter((p) => isDateToday(p.paymentDate));
  const pendingApps = applications.filter(
    (a) => a.status === "pending" || a.status === "submitted" || a.status === "in_progress"
  );
  const unpaidAmount = applications.reduce((sum, a) => {
    const remaining = a.applicationFee - a.amountPaid;
    return remaining > 0 ? sum + remaining : sum;
  }, 0);

  const serviceCounts: Record<string, number> = {};
  applications.forEach((a) => {
    serviceCounts[a.serviceName] = (serviceCounts[a.serviceName] || 0) + 1;
  });
  const topServices = Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    stats: {
      totalCustomers: customers.length,
      totalApplications: applications.length,
      pendingApplications: pendingApps.length,
      completedApplications: applications.filter((a) => a.status === "completed").length,
      rejectedApplications: applications.filter((a) => a.status === "rejected").length,
      totalEarnings: paidPayments.reduce((sum, p) => sum + p.amount, 0),
      pendingPayments: unpaidAmount,
      todayEarnings: todayPayments.reduce((sum, p) => sum + p.amount, 0),
    },
    recentApplications: [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    topServices,
  };
}

function buildSmartExtras(
  customers: Customer[],
  applications: Application[],
  payments: Payment[],
  staff: StaffMember[],
  auditLogs: AuditLog[],
  expenses: Expense[]
): SmartDashboardExtras {
  const paidPayments = payments.filter((p) => p.paymentStatus === "paid");
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
      : customersThisMonth > 0 ? 100 : 0;

  const serviceRevenue: Record<string, { revenue: number; count: number }> = {};
  paidPayments.forEach((p) => {
    if (!serviceRevenue[p.serviceName]) serviceRevenue[p.serviceName] = { revenue: 0, count: 0 };
    serviceRevenue[p.serviceName].revenue += p.amount;
    serviceRevenue[p.serviceName].count += 1;
  });

  return {
    monthlyEarnings,
    lastMonthEarnings,
    todayApplications: applications.filter((a) => isDateToday(a.createdAt)).length,
    customerGrowthPercent,
    topServicesByRevenue: Object.entries(serviceRevenue)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data })),
    staffPerformance: staff.map((s) => ({
      name: s.name,
      applications: applications.filter((a) => a.userId === s.linkedUserId).length,
      payments: paidPayments.filter((p) => p.userId === s.linkedUserId).length,
    })),
    recentActivities: auditLogs.slice(0, 8).map((log) => ({
      type: log.action,
      description: `${log.userName} ${log.action} ${log.entity}: ${log.entityName}`,
      time: log.createdAt,
    })),
    monthlyExpenses,
    profit: monthlyEarnings - monthlyExpenses,
  };
}

export function useDashboardStats() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [smart, setSmart] = useState<SmartDashboardExtras | null>(null);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [topServices, setTopServices] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [smartLoading, setSmartLoading] = useState(true);

  useEffect(() => {
    if (!profile?.shopId) {
      setLoading(false);
      setSmartLoading(false);
      return;
    }

    let cancelled = false;
    const shopId = profile.shopId;

    async function loadCore() {
      setLoading(true);
      try {
        const [customers, applications, payments] = await Promise.all([
          getShopDocuments<Customer>("customers", shopId),
          getShopDocuments<Application>("applications", shopId),
          getShopDocuments<Payment>("payments", shopId),
        ]);
        if (cancelled) return;
        const result = buildStats(customers, applications, payments);
        setStats(result.stats);
        setRecentApplications(result.recentApplications);
        setTopServices(result.topServices);
      } catch {
        if (!cancelled) {
          setStats({
            totalCustomers: 0, totalApplications: 0, pendingApplications: 0,
            completedApplications: 0, rejectedApplications: 0, totalEarnings: 0,
            pendingPayments: 0, todayEarnings: 0,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadSmart() {
      setSmartLoading(true);
      try {
        const [customers, applications, payments, staff, auditLogs, expenses] = await Promise.all([
          getShopDocuments<Customer>("customers", shopId),
          getShopDocuments<Application>("applications", shopId),
          getShopDocuments<Payment>("payments", shopId),
          getShopDocuments<StaffMember>("staff", shopId),
          getShopDocuments<AuditLog>("auditLogs", shopId),
          getShopDocuments<Expense>("expenses", shopId),
        ]);
        if (cancelled) return;
        setSmart(buildSmartExtras(customers, applications, payments, staff, auditLogs, expenses));
      } catch {
        if (!cancelled) setSmart(null);
      } finally {
        if (!cancelled) setSmartLoading(false);
      }
    }

    loadCore();
    loadSmart();

    return () => { cancelled = true; };
  }, [profile?.shopId]);

  return { stats, smart, recentApplications, topServices, loading, smartLoading };
}
