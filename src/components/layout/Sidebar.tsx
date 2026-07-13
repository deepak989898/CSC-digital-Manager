"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  X,
  Shield,
  Store,
  Bell,
  Clock,
  UserPlus,
  Crown,
  Megaphone,
  TrendingUp,
  PieChart,
  Bot,
  Calendar,
  Package,
  Receipt,
  Headphones,
  UserCheck,
  Database,
  ShieldCheck,
  Sparkles,
  FileSignature,
  Workflow,
  CloudOff,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logout } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Permission } from "@/types";

const shopNavItems: { href: string; label: string; icon: typeof LayoutDashboard; permission?: Permission }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/customers", label: "Customers", icon: Users, permission: "customers_view" },
  { href: "/services", label: "Services", icon: Briefcase },
  { href: "/applications", label: "Applications", icon: FileText, permission: "applications_view" },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/esign", label: "eSign", icon: FileSignature },
  { href: "/payments", label: "Payments", icon: CreditCard, permission: "payments_view" },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/attendance", label: "Attendance", icon: UserCheck },
  { href: "/tickets", label: "Help Desk", icon: Headphones },
  { href: "/marketing", label: "Marketing", icon: Sparkles },
  { href: "/automation", label: "Automation", icon: Workflow },
  { href: "/reminders", label: "Reminders", icon: Clock },
  { href: "/sync-status", label: "Sync Status", icon: CloudOff },
  { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports_view" },
  { href: "/reports/advanced", label: "Advanced Reports", icon: PieChart, permission: "reports_view" },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/audit-logs", label: "Audit Logs", icon: ShieldCheck },
  { href: "/backup", label: "Backup", icon: Database },
  { href: "/subscription", label: "Subscription", icon: Crown },
  { href: "/staff", label: "Staff", icon: UserPlus },
  { href: "/settings/profile", label: "Settings", icon: Settings },
];

const adminNavItems = [
  { href: "/admin/dashboard", label: "Admin Dashboard", icon: Shield },
  { href: "/admin/shops", label: "Shops", icon: Store },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/plans", label: "Plans", icon: Crown },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/usage", label: "Usage", icon: BarChart3 },
  { href: "/admin/features", label: "Phase 4 Features", icon: Sparkles },
  { href: "/admin/white-label", label: "White-Label", icon: Palette },
  { href: "/admin/esign-settings", label: "eSign Settings", icon: FileSignature },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const { can, isOwner } = usePermissions();
  const router = useRouter();
  const isAdmin = profile?.role === "super_admin";

  const filteredShopNav = shopNavItems.filter((item) => {
    if (!item.permission) return true;
    if (isOwner) return true;
    return can(item.permission);
  });

  const navItems = isAdmin ? adminNavItems : filteredShopNav;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-navy-950 text-white flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-navy-800">
          <Link href={isAdmin ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-3">
            <Image src="/logo.png" alt="CSC Digital Manager" width={40} height={40} className="rounded-lg" />
            <div>
              <p className="text-sm font-bold leading-tight">CSC Digital</p>
              <p className="text-xs text-navy-300">Manager</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-navy-800 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                  isActive ? "bg-brand-blue text-white" : "text-navy-200 hover:bg-navy-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-navy-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-navy-200 hover:bg-navy-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
