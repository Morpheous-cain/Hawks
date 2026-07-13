import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { getSLAColor } from "@/lib/colors";

interface SLAStatusBadgeProps {
  triggeredAt: string;
  slaDeadline: string;
  status: string;
}

export const SLAStatusBadge = ({ triggeredAt, slaDeadline, status }: SLAStatusBadgeProps) => {
  const now = new Date();
  const deadline = new Date(slaDeadline);
  const triggered = new Date(triggeredAt);
  const minutesSinceTrigger = Math.floor((now.getTime() - triggered.getTime()) / 60000);
  const minutesToDeadline = Math.floor((deadline.getTime() - now.getTime()) / 60000);

  const isResolved = status === "resolved" || status === "false_alarm";
  const colors = getSLAColor(minutesToDeadline, isResolved);
  
  // Determine status text
  let statusText = "Within SLA";
  if (isResolved) {
    statusText = minutesToDeadline >= 0 ? "Resolved - Met SLA" : "Resolved - Breached SLA";
  } else if (minutesToDeadline < 0) {
    statusText = `BREACHED (${Math.abs(minutesToDeadline)}m over)`;
  } else if (minutesToDeadline <= 3) {
    statusText = `AT RISK (${minutesToDeadline}m left)`;
  } else {
    statusText = `Within SLA (${minutesToDeadline}m left)`;
  }

  return (
    <div className="flex flex-col gap-1">
      <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border}`}>
        <Clock className="w-3 h-3 mr-1" />
        {statusText}
      </Badge>
      <span className="text-xs text-foreground/80 font-medium">
        {minutesSinceTrigger}m since trigger
      </span>
    </div>
  );
};
