import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SLACountdownTimerProps {
  deadline: string | null;
  status: string;
}

const SLACountdownTimer = ({ deadline, status }: SLACountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline || status === 'resolved' || status === 'closed') {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      setTimeRemaining(diffMins);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline, status]);

  if (timeRemaining === null) return null;

  const isBreached = timeRemaining < 0;
  const isAtRisk = timeRemaining > 0 && timeRemaining <= 5;
  const isNormal = timeRemaining > 5;

  const getBadgeClass = () => {
    if (isBreached) return "bg-alert-critical animate-pulse";
    if (isAtRisk) return "bg-alert-caution animate-pulse";
    return "bg-alert-normal";
  };

  const getDisplayText = () => {
    if (isBreached) {
      const overdue = Math.abs(timeRemaining);
      return `SLA BREACHED: ${overdue}m overdue`;
    }
    if (timeRemaining < 60) {
      return `SLA: ${timeRemaining}m remaining`;
    }
    const hours = Math.floor(timeRemaining / 60);
    const mins = timeRemaining % 60;
    return `SLA: ${hours}h ${mins}m remaining`;
  };

  return (
    <Badge className={getBadgeClass()}>
      <Clock className="w-3 h-3 mr-1" />
      {getDisplayText()}
    </Badge>
  );
};

export default SLACountdownTimer;
