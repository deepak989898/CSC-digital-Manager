"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments } from "@/lib/firebase/firestore";
import { Customer, Application, Payment, StaffMember, Expense } from "@/types";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { exportToCSV, printPage } from "@/lib/export";
import { formatCurrency, formatDate } from "@/lib/utils";
import { parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Download, Printer } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";

export default function AdvancedReportsPage() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportType, setReportType] = useState("earnings");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!profile?.shopId) return;
    Promise.all([
      getShopDocuments<Customer>("customers", profile.shopId),
      getShopDocuments<Application>("applications", profile.shopId),
      getShopDocuments<Payment>("payments", profile.shopId),
      getShopDocuments<StaffMember>("staff", profile.shopId),
      getShopDocuments<Expense>("expenses", profile.shopId),
    ]).then(([c, a, p, s, e]) => {
      setCustomers(c); setApplications(a); setPayments(p); setStaff(s); setExpenses(e); setLoading(false);
    });
  }, [profile?.shopId]);

  const filterByDate = <T extends { createdAt?: string; paymentDate?: string }>(items: T[], dateField: keyof T) => {
    if (!dateFrom && !dateTo) return items;
    return items.filter((item) => {
      const dateStr = String(item[dateField] || item.createdAt || "");
      if (!dateStr) return false;
      const date = parseISO(dateStr);
      if (dateFrom && dateTo) return isWithinInterval(date, { start: startOfDay(parseISO(dateFrom)), end: endOfDay(parseISO(dateTo)) });
      if (dateFrom) return date >= startOfDay(parseISO(dateFrom));
      if (dateTo) return date <= endOfDay(parseISO(dateTo));
      return true;
    });
  };

  const filteredPayments = useMemo(() => filterByDate(payments, "paymentDate").filter((p) => p.paymentStatus === "paid"), [payments, dateFrom, dateTo]);
  const filteredApps = useMemo(() => {
    let apps = filterByDate(applications, "createdAt");
    if (statusFilter) apps = apps.filter((a) => a.status === statusFilter);
    return apps;
  }, [applications, dateFrom, dateTo, statusFilter]);

  const earningsChart = useMemo(() => {
    const byMonth: Record<string, number> = {};
    filteredPayments.forEach((p) => {
      const month = p.paymentDate.slice(0, 7);
      byMonth[month] = (byMonth[month] || 0) + p.amount;
    });
    return Object.entries(byMonth).sort().map(([name, amount]) => ({ name, amount }));
  }, [filteredPayments]);

  const serviceRevenue = useMemo(() => {
    const byService: Record<string, number> = {};
    filteredPayments.forEach((p) => { byService[p.serviceName] = (byService[p.serviceName] || 0) + p.amount; });
    return Object.entries(byService).map(([name, revenue]) => ({ name, revenue }));
  }, [filteredPayments]);

  const filteredExpenses = useMemo(() => filterByDate(expenses, "expenseDate"), [expenses, dateFrom, dateTo]);
  const totalEarnings = filteredPayments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalEarnings - totalExpenses;

  const handleExport = () => {
    if (reportType === "earnings") {
      exportToCSV(filteredPayments, [
        { key: "customerName", label: "Customer" },
        { key: "serviceName", label: "Service" },
        { key: "amount", label: "Amount" },
        { key: "paymentMethod", label: "Method" },
        { key: "paymentDate", label: "Date" },
      ], "earnings_report");
    } else if (reportType === "applications") {
      exportToCSV(filteredApps, [
        { key: "referenceNumber", label: "Ref" },
        { key: "customerName", label: "Customer" },
        { key: "serviceName", label: "Service" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Date" },
      ], "applications_report");
    } else if (reportType === "expenses") {
      exportToCSV(filteredExpenses, [
        { key: "category", label: "Category" },
        { key: "amount", label: "Amount" },
        { key: "vendor", label: "Vendor" },
        { key: "paymentMethod", label: "Method" },
        { key: "expenseDate", label: "Date" },
      ], "expenses_report");
    }
  };

  if (loading) return <DashboardLayout title="Advanced Reports"><div className="p-8 text-center text-slate-500">Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout title="Advanced Reports">
      <div className="space-y-6 no-print">
        <div className="flex flex-wrap gap-3 items-end">
          <Input label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          <Input label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          <Select label="Report" value={reportType} onChange={(e) => setReportType(e.target.value)} options={[
            { value: "earnings", label: "Earnings" },
            { value: "applications", label: "Applications" },
            { value: "pending", label: "Pending Payments" },
            { value: "growth", label: "Customer Growth" },
            { value: "expenses", label: "Expenses" },
            { value: "profit", label: "Profit & Loss" },
          ]} className="w-48" />
          {reportType === "applications" && (
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={[
              { value: "pending", label: "Pending" }, { value: "completed", label: "Completed" }, { value: "rejected", label: "Rejected" },
            ]} placeholder="All" className="w-40" />
          )}
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" onClick={printPage}><Printer className="h-4 w-4" /> Print</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card><p className="text-sm text-slate-500">Total Earnings</p><p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p></Card>
          <Card><p className="text-sm text-slate-500">Total Expenses</p><p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p></Card>
          <Card><p className="text-sm text-slate-500">Profit</p><p className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(profit)}</p></Card>
          <Card><p className="text-sm text-slate-500">Applications</p><p className="text-2xl font-bold">{filteredApps.length}</p></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Earnings Over Time">
            {earningsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={earningsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-slate-500 text-center py-8">No data</p>}
          </Card>
          <Card title="Service-wise Revenue">
            {serviceRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={serviceRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-slate-500 text-center py-8">No data</p>}
          </Card>
        </div>

        <Card title="Application Status Breakdown">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {["pending", "submitted", "in_progress", "completed", "rejected"].map((status) => (
              <div key={status} className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold">{filteredApps.filter((a) => a.status === status).length}</p>
                <p className="text-xs text-slate-500 capitalize">{status.replace("_", " ")}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
