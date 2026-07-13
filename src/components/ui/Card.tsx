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
    <div className={cn("bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700">
          {title && <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
          {action}
        </div>
      )}
      <div className={cn(!title && !action ? "p-3" : "p-3")}>{children}</div>
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
    blue: "bg-blue-50 text-brand-blue dark:bg-blue-950 dark:text-blue-300",
    green: "bg-green-50 text-brand-green dark:bg-green-950 dark:text-green-300",
    orange: "bg-orange-50 text-brand-orange dark:bg-orange-950 dark:text-orange-300",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{title}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{value}</p>
          {trend && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{trend}</p>}
        </div>
        <div className={cn("p-2 rounded-lg", colors[color])}>{icon}</div>
      </div>
    </div>
  );
}
