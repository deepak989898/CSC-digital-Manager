import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type PageSize = "sm" | "md" | "lg" | "xl" | "full";

const sizeClass: Record<PageSize, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export function PageContainer({
  children,
  className,
  size = "lg",
}: {
  children: ReactNode;
  className?: string;
  size?: PageSize;
}) {
  return (
    <div className={cn("mx-auto w-full space-y-2", sizeClass[size], className)}>
      {children}
    </div>
  );
}
