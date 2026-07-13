import { MapPin, AlertTriangle, Shield, Cloud, Siren, TrendingUp } from "lucide-react";

interface AdvisorySummaryStatsProps {
  advisories: any[];
  onCategoryClick: (category: string) => void;
  activeCategory: string;
}

const categories = [
  { key: "all", label: "All", icon: Siren, accent: "primary" },
  { key: "Traffic", label: "Traffic", icon: MapPin, accent: "primary" },
  { key: "Protest", label: "Protest", icon: AlertTriangle, accent: "alert-caution" },
  { key: "Terror", label: "Terror", icon: Shield, accent: "alert-critical" },
  { key: "Weather", label: "Weather", icon: Cloud, accent: "primary" },
  { key: "Crime", label: "Crime", icon: AlertTriangle, accent: "alert-caution" },
];

const AdvisorySummaryStats = ({ advisories, onCategoryClick, activeCategory }: AdvisorySummaryStatsProps) => {
  const getCount = (key: string) =>
    key === "all" ? advisories.length : advisories.filter(a => a.category === key).length;

  const getCriticalCount = (key: string) => {
    const items = key === "all" ? advisories : advisories.filter(a => a.category === key);
    return items.filter(a => a.severity === "CRITICAL").length;
  };

  const getActiveCount = (key: string) => {
    const items = key === "all" ? advisories : advisories.filter(a => a.category === key);
    return items.filter(a => a.status === "Active").length;
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {categories.map(({ key, label, icon: Icon, accent }) => {
        const count = getCount(key);
        const criticalCount = getCriticalCount(key);
        const activeCount = getActiveCount(key);
        const isActive = activeCategory === key;

        return (
          <button
            key={key}
            onClick={() => onCategoryClick(key)}
            className={`
              group relative flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-200
              ${isActive
                ? `border-${accent}/40 bg-${accent}/8 shadow-sm`
                : "border-border/30 bg-card/30 hover:border-border/50 hover:bg-card/50"
              }
            `}
          >
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center shrink-0
              ${isActive ? `bg-${accent}/15` : "bg-muted/30"}
            `}>
              <Icon className={`w-4 h-4 ${isActive ? `text-${accent}` : "text-muted-foreground"}`} />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className={`text-lg font-bold tabular-nums leading-none ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                {count}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                {label}
              </span>
            </div>
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-alert-critical px-1 text-[9px] font-bold text-white shadow-sm">
                {criticalCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default AdvisorySummaryStats;
