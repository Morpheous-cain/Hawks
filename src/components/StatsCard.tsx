import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  status?: "normal" | "caution" | "critical";
}

const StatsCard = ({ title, value, icon: Icon, trend, status = "normal" }: StatsCardProps) => {
  const statusColors = {
    normal: "border-alert-normal bg-alert-normal/15 shadow-[0_0_30px_hsl(var(--alert-normal)/0.2)]",
    caution: "border-alert-caution bg-alert-caution/15 shadow-[0_0_30px_hsl(var(--alert-caution)/0.2)]",
    critical: "border-alert-critical bg-alert-critical/15 shadow-[0_0_30px_hsl(var(--alert-critical)/0.2)]",
  };

  const iconColors = {
    normal: "bg-alert-normal/30 text-alert-normal shadow-[0_0_20px_hsl(var(--alert-normal)/0.15)]",
    caution: "bg-alert-caution/30 text-alert-caution shadow-[0_0_20px_hsl(var(--alert-caution)/0.15)]",
    critical: "bg-alert-critical/30 text-alert-critical shadow-[0_0_20px_hsl(var(--alert-critical)/0.15)]",
  };

  return (
    <Card className={`p-4 border-2 ${statusColors[status]} transition-all hover:shadow-glow-strong hover:scale-[1.02] animate-in fade-in-0 slide-in-from-bottom-4 duration-500 relative z-20`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-foreground/90 font-semibold mb-1 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-foreground transition-all duration-300">{value}</p>
          {trend && (
            <p className="text-xs text-primary/70 font-medium mt-1 animate-in fade-in duration-500">{trend}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${iconColors[status]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
