import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, parseISO, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function isDateToday(date: string): boolean {
  return isToday(parseISO(date));
}

export function getTodayStart(): string {
  return startOfDay(new Date()).toISOString();
}

export function generateReferenceNumber(prefix: string, count: number): string {
  return `${prefix}${String(count + 1).padStart(3, "0")}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
    submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
    in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
    partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
    unpaid: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
    active: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
    inactive: "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200",
    verified: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
    low: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
    vip: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200";
}

export function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function validateFile(file: File): string | null {
  if (file.size > 10 * 1024 * 1024) {
    return "File size must be less than 10MB";
  }
  return null;
}

export function getPaymentStatus(
  applicationFee: number,
  amountPaid: number
): "unpaid" | "partial" | "paid" {
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid < applicationFee) return "partial";
  return "paid";
}
