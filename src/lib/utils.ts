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
    pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    in_progress: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    paid: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    partial: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    unpaid: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    inactive: "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300",
  };
  return colors[status] || "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300";
}

export function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function validateFile(file: File): string | null {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return "Only JPEG, PNG, WebP and PDF files are allowed";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "File size must be less than 5MB";
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
