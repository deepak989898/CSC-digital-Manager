import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function Card({ children, className, title, action }: CardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
          {action}
        </div>
      )}
      <div className={cn(!title && !action ? "p-6" : "p-6")}>{children}</div>
    </div>
  );
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = "blue",
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: "blue" | "green" | "orange" | "red" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-brand-blue",
    green: "bg-green-50 text-brand-green",
    orange: "bg-orange-50 text-brand-orange",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        </div>
        <div className={cn("p-3 rounded-lg", colors[color])}>{icon}</div>
      </div>
    </div>
  );
}
