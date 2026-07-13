"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Bell, Receipt, Shield, Users, CreditCard, Palette, Globe, CloudOff, FileText } from "lucide-react";

const settingsLinks = [
  { href: "/settings/profile", label: "Shop Profile", icon: User },
  { href: "/settings/app", label: "App Settings", icon: Palette },
  { href: "/settings/gst", label: "GST & Invoices", icon: Receipt },
  { href: "/settings/forms", label: "Form Templates", icon: FileText },
  { href: "/settings/branding", label: "Branding", icon: Palette },
  { href: "/settings/domain", label: "Custom Domain", icon: Globe },
  { href: "/settings/reminders", label: "Reminders", icon: Bell },
  { href: "/settings/offline", label: "Offline / PWA", icon: CloudOff },
  { href: "/staff", label: "Staff Management", icon: Users },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/receipt", label: "Receipt Settings", icon: Receipt },
  { href: "/settings/security", label: "Security", icon: Shield },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1.5 mb-3">
      {settingsLinks.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
              isActive
                ? "bg-brand-blue text-white"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
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
