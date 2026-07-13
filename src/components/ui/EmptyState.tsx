import { FileX, Inbox, Users, Search } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  icon?: "inbox" | "users" | "file" | "search";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const icons = {
  inbox: Inbox,
  users: Users,
  file: FileX,
  search: Search,
};

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const Icon = icons[icon];
  return (
    <div className="flex flex-col items-center justify-center py-8 px-3 text-center">
      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-2">
        <Icon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-0.5">{title}</h3>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-2">{description}</p>}
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
