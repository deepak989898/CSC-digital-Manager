"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getActivePlans } from "@/lib/subscription";
import { Plan, BillingCycle } from "@/types";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Check, Crown } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function SubscriptionPlansPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  useEffect(() => {
    getActivePlans().then((p) => { setPlans(p.filter((pl) => !pl.isTrial)); setLoading(false); });
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    if (!profile) return;
    const amount = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
    if (amount <= 0) { toast.error("Cannot subscribe to free plan"); return; }

    setPaying(plan.id);
    try {
      const res = await fetch("/api/razorpay/create-subscription-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, planId: plan.id, billingCycle, shopId: profile.shopId, userId: profile.userId }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      await new Promise((resolve) => { script.onload = resolve; });

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "CSC Digital Manager",
        description: `${plan.name} - ${billingCycle}`,
        order_id: order.id,
        handler: async (response: Record<string, string>) => {
          const verifyRes = await fetch("/api/razorpay/verify-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, planId: plan.id, billingCycle, shopId: profile.shopId, userId: profile.userId }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            toast.success("Subscription activated!");
            router.push("/subscription");
          } else toast.error("Payment verification failed");
        },
        theme: { color: "#2563eb" },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(null);
    }
  };

  return (
    <DashboardLayout title="Choose a Plan">
      <div className="space-y-6">
        <div className="flex justify-center gap-2">
          <Button variant={billingCycle === "monthly" ? "primary" : "outline"} size="sm" onClick={() => setBillingCycle("monthly")}>Monthly</Button>
          <Button variant={billingCycle === "yearly" ? "primary" : "outline"} size="sm" onClick={() => setBillingCycle("yearly")}>Yearly (Save 17%)</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-80 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              const isPremium = plan.slug === "premium";
              return (
                <Card key={plan.id} className={isPremium ? "ring-2 ring-brand-orange" : ""}>
                  <div className="text-center mb-4">
                    <div className="inline-flex p-2 bg-blue-50 rounded-lg mb-2">
                      <Crown className={`h-6 w-6 ${isPremium ? "text-brand-orange" : "text-brand-blue"}`} />
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-3xl font-bold text-brand-blue mt-2">
                      {formatCurrency(price)}
                      <span className="text-sm font-normal text-slate-500">/{billingCycle === "yearly" ? "yr" : "mo"}</span>
                    </p>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-brand-green shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={isPremium ? "orange" : "primary"} onClick={() => handleSubscribe(plan)} loading={paying === plan.id}>
                    Subscribe
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
