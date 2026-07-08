"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getShopDocuments } from "@/lib/firebase/firestore";
import { Customer, Application, Payment, Service } from "@/types";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const { profile } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<{ type: string; label: string; href: string }[]>([]);

  useEffect(() => {
    if (!query || query.length < 2 || !profile?.shopId) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const q = query.toLowerCase();
      const [customers, applications, payments, services] = await Promise.all([
        getShopDocuments<Customer>("customers", profile.shopId),
        getShopDocuments<Application>("applications", profile.shopId),
        getShopDocuments<Payment>("payments", profile.shopId),
        getShopDocuments<Service>("services", profile.shopId),
      ]);

      const found: { type: string; label: string; href: string }[] = [];

      customers
        .filter((c) => c.fullName.toLowerCase().includes(q) || c.mobile.includes(q))
        .slice(0, 3)
        .forEach((c) => found.push({ type: "Customer", label: c.fullName, href: `/customers/${c.id}` }));

      applications
        .filter((a) => a.referenceNumber.toLowerCase().includes(q) || a.customerName.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((a) => found.push({ type: "Application", label: `${a.referenceNumber} - ${a.customerName}`, href: `/applications/${a.id}` }));

      payments
        .filter((p) => p.customerName.toLowerCase().includes(q) || p.serviceName.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach((p) => found.push({ type: "Payment", label: `${p.customerName} - ₹${p.amount}`, href: "/payments" }));

      services
        .filter((s) => s.name.toLowerCase().includes(q))
        .slice(0, 2)
        .forEach((s) => found.push({ type: "Service", label: s.name, href: "/services" }));

      setResults(found);
      setOpen(found.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, profile?.shopId]);

  return (
    <div className="relative hidden md:block">
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search customers, applications..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="bg-transparent text-sm outline-none w-48 lg:w-64"
        />
      </div>
      {open && results.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-64 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => { router.push(r.href); setOpen(false); setQuery(""); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="text-sm text-slate-900">{r.label}</span>
                <span className="text-xs text-slate-400">{r.type}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
