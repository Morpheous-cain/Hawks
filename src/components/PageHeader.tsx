import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Black Hawk SOC-OS PageHeader — Editorial Premium
 *
 * Editorial layout: small uppercase eyebrow, large display title (serif),
 * muted description, optional action slot on the right.
 * No glow chip, no pulse.
 */
const PageHeader = ({ title, description, icon: Icon, eyebrow, actions, className }: PageHeaderProps) => {
  return (
    <header className={cn("mb-8 flex items-start justify-between gap-6 border-b border-border pb-6", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="mb-2 flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            {Icon && <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />}
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="font-display text-4xl font-normal italic leading-none text-foreground md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm text-text-muted md:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
};

export default PageHeader;
export { PageHeader };
