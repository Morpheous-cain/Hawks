import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * EmptyState — used whenever a list, table, or panel has no data.
 * Editorial calm: icon in muted circle, italic serif title, muted description, optional CTA.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) => {
  const padding = size === "sm" ? "py-8 px-4" : size === "lg" ? "py-20 px-6" : "py-14 px-6";
  const iconSize = size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const titleSize = size === "sm" ? "text-lg" : "text-2xl";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        padding,
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-full border border-border bg-surface-2",
            iconSize,
          )}
        >
          <Icon className="h-5 w-5 text-text-muted" aria-hidden />
        </div>
      )}
      <h3 className={cn("font-display italic text-foreground", titleSize)}>{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
