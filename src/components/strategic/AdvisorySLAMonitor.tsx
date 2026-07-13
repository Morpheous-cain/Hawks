import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { differenceInMinutes } from "date-fns";

interface AdvisorySLAMonitorProps {
  advisories: any[];
  onAdvisoryClick: (advisory: any) => void;
}

const AdvisorySLAMonitor = ({ advisories, onAdvisoryClick }: AdvisorySLAMonitorProps) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const activeAdvisories = advisories.filter(a => a.status === "Active" && !a.acknowledged_by);
  const breachedAdvisories = advisories.filter(a => a.sla_breached && a.status === "Active");
  const atRiskAdvisories = activeAdvisories.filter(a => {
    if (!a.sla_deadline) return false;
    const minutesLeft = differenceInMinutes(new Date(a.sla_deadline), now);
    return minutesLeft <= 3 && minutesLeft > 0;
  });

  // Don't render if nothing to show
  if (breachedAdvisories.length === 0 && atRiskAdvisories.length === 0 && activeAdvisories.length === 0) return null;

  const pendingAdvisories = activeAdvisories.filter(
    a => !atRiskAdvisories.includes(a) && !breachedAdvisories.includes(a)
  );

  return (
    <div className="rounded-lg border border-border/30 bg-card/30 overflow-hidden">
      <div className="px-4 py-2 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-alert-caution" />
          <span className="text-xs font-semibold text-foreground">SLA & Acknowledgment</span>
        </div>
        <div className="flex items-center gap-3">
          {breachedAdvisories.length > 0 && (
            <span className="text-[10px] font-bold text-alert-critical">{breachedAdvisories.length} breached</span>
          )}
          {atRiskAdvisories.length > 0 && (
            <span className="text-[10px] font-bold text-alert-caution">{atRiskAdvisories.length} at risk</span>
          )}
          {pendingAdvisories.length > 0 && (
            <span className="text-[10px] text-muted-foreground">{pendingAdvisories.length} pending</span>
          )}
        </div>
      </div>

      <div className="p-2 flex flex-wrap gap-1.5">
        {/* Breached items */}
        {breachedAdvisories.slice(0, 4).map(advisory => (
          <button
            key={advisory.id}
            onClick={() => onAdvisoryClick(advisory)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-alert-critical/8 border border-alert-critical/20 hover:bg-alert-critical/15 transition-colors text-left"
          >
            <AlertTriangle className="w-3 h-3 text-alert-critical shrink-0" />
            <span className="text-[11px] font-medium text-foreground truncate max-w-[200px]">{advisory.title}</span>
            <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 shrink-0">BREACH</Badge>
          </button>
        ))}

        {/* At risk items */}
        {atRiskAdvisories.slice(0, 4).map(advisory => {
          const minutesLeft = differenceInMinutes(new Date(advisory.sla_deadline), now);
          return (
            <button
              key={advisory.id}
              onClick={() => onAdvisoryClick(advisory)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-alert-caution/8 border border-alert-caution/20 hover:bg-alert-caution/15 transition-colors text-left"
            >
              <Clock className="w-3 h-3 text-alert-caution shrink-0" />
              <span className="text-[11px] font-medium text-foreground truncate max-w-[200px]">{advisory.title}</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-alert-caution/30 text-alert-caution shrink-0">
                {minutesLeft}m
              </Badge>
            </button>
          );
        })}

        {/* Pending acknowledgments (compact) */}
        {pendingAdvisories.slice(0, 3).map(advisory => (
          <button
            key={advisory.id}
            onClick={() => onAdvisoryClick(advisory)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors text-left"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-[11px] text-foreground/70 truncate max-w-[200px]">{advisory.title}</span>
          </button>
        ))}
        {pendingAdvisories.length > 3 && (
          <span className="flex items-center px-2 text-[10px] text-muted-foreground">
            +{pendingAdvisories.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
};

export default AdvisorySLAMonitor;
