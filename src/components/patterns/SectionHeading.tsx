import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * SectionHeading — used inside a page to introduce a panel/section.
 * Smaller than PageHeader; serif italic title for editorial rhythm.
 */
export const SectionHeading = ({
  title,
  eyebrow,
  description,
  actions,
  className,
}: SectionHeadingProps) => {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-2xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-2xl italic leading-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
};

export default SectionHeading;
