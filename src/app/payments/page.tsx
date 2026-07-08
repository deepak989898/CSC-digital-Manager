"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useShopCollection } from "@/hooks/useShopCollection";
import { Payment } from "@/types";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Pagination, usePagination } from "@/components/ui/Pagination";
import { formatCurrency, formatDate, formatStatusLabel } from "@/lib/utils";
import { IndianRupee, CheckCircle, Clock, Receipt } from "lucide-react";

export default function PaymentsPage() {
  const { data: payments, loading } = useShopCollection<Payment>("payments");

  const stats = useMemo(() => {
    const paid = payments.filter((p) => p.paymentStatus === "paid");
    const pending = payments.filter((p) => p.paymentStatus !== "paid");
    return {
      total: paid.reduce((s, p) => s + p.amount, 0),
      received: paid.length,
      pending: pending.reduce((s, p) => s + p.amount, 0),
    };
  }, [payments]);

  const { paginatedItems, currentPage, setCurrentPage, totalItems } =
    usePagination(payments);

  return (
    <DashboardLayout title="Payments">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Earnings" value={formatCurrency(stats.total)} icon={<IndianRupee className="h-5 w-5" />} color="green" />
          <StatCard title="Received" value={stats.received} icon={<CheckCircle className="h-5 w-5" />} color="blue" />
          <StatCard title="Pending" value={formatCurrency(stats.pending)} icon={<Clock className="h-5 w-5" />} color="orange" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6"><TableSkeleton /></div>
          ) : payments.length === 0 ? (
            <EmptyState title="No payments" description="Payments will appear when recorded" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Service</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Amount</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Method</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Date</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{payment.customerName}</td>
                        <td className="px-4 py-3">{payment.serviceName}</td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3 capitalize">{formatStatusLabel(payment.paymentMethod)}</td>
                        <td className="px-4 py-3"><Badge status={payment.paymentStatus} /></td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-500">{formatDate(payment.paymentDate)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/applications/${payment.applicationId}`} className="inline-flex p-1.5 rounded hover:bg-slate-100 text-slate-500">
                            <Receipt className="h-4 w-4" />
                          </Link>
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
      </div>
    </DashboardLayout>
  );
}
