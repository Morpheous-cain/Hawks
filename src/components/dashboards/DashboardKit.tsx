import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";

/**
 * DashboardKit — reusable building blocks for role-specific dashboards.
 * All blocks are presentational; data is fed in by the calling dashboard
 * via the useDashboardMetrics hook.
 */

export const DashboardHeader = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  gradient = "from-primary to-primary",
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  gradient?: string;
  children?: ReactNode;
}) => (
  <section className="relative overflow-hidden rounded-2xl border border-border bg-surface-1 p-6 md:p-8">
    <div
      aria-hidden
      className={cn(
        "absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br opacity-20 blur-3xl",
        gradient,
      )}
    />
    <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg shrink-0", gradient)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-2xs font-mono uppercase tracking-[0.22em] text-text-muted">{eyebrow}</div>
          <h1 className="mt-1 font-display text-2xl italic md:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-text-muted">{description}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  </section>
);

export const KpiGrid = ({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 | 5 | 6 }) => (
  <section
    className={cn(
      "grid gap-px overflow-hidden rounded-xl border border-border bg-border",
      cols === 2 && "grid-cols-2",
      cols === 3 && "grid-cols-2 md:grid-cols-3",
      cols === 4 && "grid-cols-2 md:grid-cols-4",
      cols === 5 && "grid-cols-2 md:grid-cols-5",
      cols === 6 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
    )}
  >
    {children}
  </section>
);

export const KpiTile = ({
  label,
  value,
  hint,
  loading,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  loading?: boolean;
  tone?: "default" | "good" | "warn" | "bad";
  icon?: LucideIcon;
}) => (
  <div className="bg-card p-4 md:p-5">
    <div className="flex items-center justify-between">
      <div className="text-2xs font-mono uppercase tracking-[0.2em] text-text-muted">{label}</div>
      {Icon && <Icon className="h-3.5 w-3.5 text-text-dim" />}
    </div>
    <div
      className={cn(
        "mt-2 font-mono text-2xl tabular-nums",
        tone === "good" && "text-emerald-500",
        tone === "warn" && "text-amber-500",
        tone === "bad" && "text-red-500",
        tone === "default" && "text-foreground",
        loading && "opacity-40",
      )}
    >
      {loading ? "—" : value}
    </div>
    {hint && <div className="mt-1 text-2xs text-text-dim">{hint}</div>}
  </div>
);

export const Panel = ({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <Card className={cn("p-5", className)}>
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-2xs font-bold uppercase tracking-[0.2em] text-text-muted">{title}</h2>
      {action}
    </div>
    {children}
  </Card>
);

export const QuickLink = ({
  to,
  label,
  desc,
  icon: Icon,
}: {
  to: string;
  label: string;
  desc?: string;
  icon: LucideIcon;
}) => (
  <Link to={to}>
    <div className="group flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:border-primary/40 hover:bg-surface-2">
      <Icon className="h-4 w-4 text-primary" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {desc && <div className="truncate text-xs text-text-muted">{desc}</div>}
      </div>
      <ArrowRight className="h-4 w-4 text-text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </div>
  </Link>
);

export const StatusBadge = ({
  status,
  tone,
}: {
  status: string;
  tone?: "good" | "warn" | "bad" | "info";
}) => (
  <Badge
    variant="outline"
    className={cn(
      tone === "good" && "border-emerald-500/40 text-emerald-500",
      tone === "warn" && "border-amber-500/40 text-amber-500",
      tone === "bad" && "border-red-500/40 text-red-500",
      tone === "info" && "border-blue-500/40 text-blue-500",
    )}
  >
    {status}
  </Badge>
);

export const EmptyState = ({ message }: { message: string }) => (
  <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-text-muted">
    {message}
  </div>
);

export const ListRow = ({
  primary,
  secondary,
  trailing,
  to,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  trailing?: ReactNode;
  to?: string;
}) => {
  const inner = (
    <div className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-surface-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-foreground">{primary}</div>
        {secondary && <div className="truncate text-xs text-text-muted">{secondary}</div>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};
