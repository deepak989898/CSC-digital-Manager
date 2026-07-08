"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getDocuments, updateDocument } from "@/lib/firebase/firestore";
import { getAllShops } from "@/lib/firebase/auth";
import { Subscription, Shop, Plan } from "@/types";
import { Badge } from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { addDays } from "date-fns";
import { toast } from "sonner";

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<(Subscription & { shopName?: string })[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [extendId, setExtendId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState("30");
  const [assignShop, setAssignShop] = useState("");
  const [assignPlan, setAssignPlan] = useState("");

  const load = async () => {
    const [subs, shopList, planList] = await Promise.all([
      getDocuments<Subscription>("subscriptions"),
      getAllShops(),
      getDocuments<Plan>("plans"),
    ]);
    setShops(shopList);
    setPlans(planList);
    setSubscriptions(subs.map((s) => ({
      ...s,
      shopName: shopList.find((sh) => sh.id === s.shopId)?.shopName || s.shopId,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  useEffect(() => { load(); }, []);

  const handleExtend = async () => {
    if (!extendId) return;
    const sub = subscriptions.find((s) => s.id === extendId);
    if (!sub) return;
    const newExpiry = addDays(new Date(sub.expiryDate), Number(extendDays)).toISOString();
    try {
      await updateDocument("subscriptions", extendId, { expiryDate: newExpiry, status: "active" });
      toast.success("Subscription extended");
      setExtendId(null);
      await load();
    } catch { toast.error("Failed to extend"); }
  };

  const toggleStatus = async (sub: Subscription) => {
    const newStatus = sub.status === "active" || sub.status === "trial" ? "suspended" : "active";
    try {
      await updateDocument("subscriptions", sub.id, { status: newStatus });
      await updateDocument("shops", sub.shopId, { isActive: newStatus === "active" });
      toast.success(`Subscription ${newStatus}`);
      await load();
    } catch { toast.error("Failed to update"); }
  };

  return (
    <DashboardLayout title="Subscriptions">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Shop</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Expiry</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{sub.shopName}</td>
                <td className="px-4 py-3">{sub.planName}</td>
                <td className="px-4 py-3">{formatCurrency(sub.amount)}</td>
                <td className="px-4 py-3"><Badge status={sub.status === "active" || sub.status === "trial" ? "active" : "inactive"} label={sub.status} /></td>
                <td className="px-4 py-3">{formatDate(sub.expiryDate)}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => setExtendId(sub.id)}>Extend</Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleStatus(sub)}>
                    {sub.status === "active" || sub.status === "trial" ? "Suspend" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal isOpen={!!extendId} onClose={() => setExtendId(null)} title="Extend Subscription" footer={<><Button variant="outline" onClick={() => setExtendId(null)}>Cancel</Button><Button onClick={handleExtend}>Extend</Button></>}>
        <Input label="Extend by (days)" type="number" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} />
      </Modal>
    </DashboardLayout>
  );
}
