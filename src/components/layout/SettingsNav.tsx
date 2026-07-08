"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Bell, Receipt, Shield, Users, CreditCard, Palette } from "lucide-react";

const settingsLinks = [
  { href: "/settings/profile", label: "Shop Profile", icon: User },
  { href: "/settings/app", label: "App Settings", icon: Palette },
  { href: "/staff", label: "Staff Management", icon: Users },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/receipt", label: "Receipt Settings", icon: Receipt },
  { href: "/settings/security", label: "Security", icon: Shield },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {settingsLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-blue text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
