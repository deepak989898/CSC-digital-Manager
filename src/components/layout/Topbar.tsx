"use client";

import { useState } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/firebase/auth";
import { toast } from "sonner";

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export function Topbar({
  title,
  onMenuClick,
  searchValue,
  onSearchChange,
  showSearch = false,
}: TopbarProps) {
  const { profile, shop } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isSuperAdmin = profile?.role === "super_admin";

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-3 lg:px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {showSearch && onSearchChange ? (
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
              <input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none w-40 lg:w-56 placeholder:text-slate-400"
              />
            </div>
          ) : (
            !isSuperAdmin && <GlobalSearch />
          )}

          {!isSuperAdmin && <NotificationBell />}
          <PWAInstallButton className="hidden sm:inline-flex" />

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="h-8 w-8 rounded-full bg-brand-blue flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                {shop?.photoURL || profile?.photoURL ? (
                  <Image
                    src={shop?.photoURL || profile?.photoURL || ""}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  (profile?.displayName?.[0] || "U").toUpperCase()
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight">
                  {isSuperAdmin ? profile?.displayName : (shop?.ownerName || profile?.displayName)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isSuperAdmin ? "Super Admin" : (shop?.shopName || "My Shop")}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden md:block" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                  {isSuperAdmin ? (
                    <>
                      <Link
                        href="/admin/dashboard"
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/settings/profile"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile Settings
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
