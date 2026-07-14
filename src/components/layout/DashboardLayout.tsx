"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { canAccessRoute, isStaffRole } from "@/lib/permissions";

export function DashboardLayout({
  children,
  title,
  showSearch,
  searchValue,
  onSearchChange,
}: {
  children: React.ReactNode;
  title: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Always open pages at the top — avoid leftover scroll from previous route
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
  }, [pathname]);

  useEffect(() => {
    if (!loading && profile) {
      if (profile.isActive === false) {
        router.push("/login");
        return;
      }

      const isAdminRoute = pathname.startsWith("/admin");

      // Super admin always uses admin panel
      if (profile.role === "super_admin" && !isAdminRoute) {
        router.replace("/admin/dashboard");
        return;
      }

      if (profile.role === "shop_owner" && isAdminRoute) {
        router.replace("/dashboard");
        return;
      }

      if (isStaffRole(profile.role) && isAdminRoute) {
        router.replace("/dashboard");
        return;
      }

      if (
        profile.role === "shop_owner" &&
        !profile.profileComplete &&
        !pathname.startsWith("/settings")
      ) {
        router.replace("/settings/profile");
        return;
      }

      if (isStaffRole(profile.role) && !canAccessRoute(profile, pathname)) {
        router.replace("/dashboard");
      }
    }
  }, [loading, profile, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        <PageSkeleton />
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <NetworkStatusBanner />
        <Topbar
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
          showSearch={showSearch}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
        />
        <main className="app-compact flex-1 p-2 lg:p-3 overflow-auto text-slate-900 dark:text-slate-100">{children}</main>
      </div>
    </div>
  );
}
