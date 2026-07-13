import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number; // percentage e.g. 12 or -8
  deltaLabel?: string; // "vs last week"
  icon?: LucideIcon;
  intent?: "default" | "normal" | "caution" | "critical" | "info";
  sparkline?: ReactNode;
  footer?: ReactNode;
  className?: string;
  onClick?: () => void;
}

const intentRing: Record<NonNullable<StatTileProps["intent"]>, string> = {
  default: "",
  normal: "ring-1 ring-[hsl(var(--alert-normal)/0.3)]",
  caution: "ring-1 ring-[hsl(var(--alert-caution)/0.3)]",
  critical: "ring-1 ring-[hsl(var(--alert-critical)/0.3)]",
  info: "ring-1 ring-[hsl(var(--alert-info)/0.3)]",
};

/**
 * StatTile — KPI card for dashboards.
 * Mono numbers, muted label, optional delta + sparkline.
 * No glow, no gradient.
 */
export const StatTile = ({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  icon: Icon,
  intent = "default",
  sparkline,
  footer,
  className,
  onClick,
}: StatTileProps) => {
  const trend =
    delta === undefined ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-[hsl(var(--alert-normal))]"
      : trend === "down"
        ? "text-[hsl(var(--alert-critical))]"
        : "text-text-muted";

  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "group relative flex w-full flex-col rounded-lg border border-border bg-card p-5 text-left transition-colors duration-150",
        onClick && "hover:border-primary/40 hover:bg-surface-2 cursor-pointer",
        intentRing[intent],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-text-dim" aria-hidden />}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-medium tabular-nums text-foreground">{value}</span>
        {unit && <span className="text-sm font-medium text-text-muted">{unit}</span>}
      </div>

      {(delta !== undefined || sparkline) && (
        <div className="mt-3 flex items-center justify-between gap-3">
          {delta !== undefined && (
            <span className={cn("inline-flex items-center gap-1 text-xs font-medium", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span className="tabular-nums">{Math.abs(delta).toFixed(1)}%</span>
              {deltaLabel && <span className="ml-1 text-text-dim">{deltaLabel}</span>}
            </span>
          )}
          {sparkline && <div className="ml-auto h-8 w-24">{sparkline}</div>}
        </div>
      )}

      {footer && <div className="mt-4 border-t border-border pt-3 text-xs text-text-muted">{footer}</div>}
    </Comp>
  );
};

export default StatTile;
