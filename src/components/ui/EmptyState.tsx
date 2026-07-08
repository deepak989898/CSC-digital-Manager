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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 bg-slate-100 rounded-full mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
