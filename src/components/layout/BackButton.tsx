"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getBackFallback, getBackLabel, shouldShowBackButton } from "@/lib/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  /** Override automatic visibility (e.g. standalone pages without DashboardLayout) */
  forceShow?: boolean;
}

export function BackButton({ className, forceShow = false }: BackButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";

  const visible = forceShow || shouldShowBackButton(pathname);
  if (!visible) return null;

  const handleBack = () => {
    const fallback = getBackFallback(pathname, isSuperAdmin);
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={getBackLabel(pathname, isSuperAdmin)}
      title={getBackLabel(pathname, isSuperAdmin)}
      className={cn(
        "shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg",
        "text-slate-600 dark:text-slate-300",
        "hover:bg-slate-100 dark:hover:bg-slate-800",
        "border border-slate-200 dark:border-slate-700",
        "transition-colors",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
