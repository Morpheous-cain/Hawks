import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface KpiTileProps {
  label: string;
  value: string | number;
  delta?: number;
  unit?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  onClick?: () => void;
  loading?: boolean;
}

const TONE: Record<string, string> = {
  default: "border-border/60",
  success: "border-emerald-500/40 bg-emerald-500/5",
  warning: "border-amber-500/40 bg-amber-500/5",
  danger: "border-red-500/40 bg-red-500/5",
  info: "border-blue-500/40 bg-blue-500/5",
};

const ICON_TONE: Record<string, string> = {
  default: "text-muted-foreground",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-red-500",
  info: "text-blue-500",
};

export const KpiTile = ({
  label, value, delta, unit, icon: Icon, tone = "default", onClick, loading,
}: KpiTileProps) => {
  const TrendIcon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta == null || delta === 0
    ? "text-muted-foreground"
    : delta > 0 ? "text-emerald-500" : "text-red-500";

  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(onClick && "cursor-pointer")}
    >
      <Card className={cn("p-4 backdrop-blur transition-all", TONE[tone])}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {loading ? "—" : value}
              </span>
              {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
            </div>
            {delta != null && (
              <div className={cn("flex items-center gap-1 text-[11px] font-medium", trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span>{delta > 0 ? "+" : ""}{delta}%</span>
              </div>
            )}
          </div>
          <div className={cn("rounded-lg p-2 bg-background/60", ICON_TONE[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default KpiTile;
