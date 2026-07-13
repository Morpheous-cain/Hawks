import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, MapPin, AlertTriangle } from "lucide-react";

interface AlarmResponseWorkflowProps {
  alarm: any;
}

const AlarmResponseWorkflow = ({ alarm }: AlarmResponseWorkflowProps) => {
  const steps = [
    {
      label: "Triggered",
      completed: true,
      timestamp: alarm.triggered_at,
      icon: AlertTriangle,
    },
    {
      label: "Acknowledged",
      completed: !!alarm.acknowledged_at,
      timestamp: alarm.acknowledged_at,
      icon: CheckCircle,
    },
    {
      label: "Dispatched",
      completed: !!alarm.dispatched_at,
      timestamp: alarm.dispatched_at,
      icon: MapPin,
    },
    {
      label: "Arrived",
      completed: !!alarm.arrived_at,
      timestamp: alarm.arrived_at,
      icon: MapPin,
    },
    {
      label: "Resolved",
      completed: !!alarm.resolved_at,
      timestamp: alarm.resolved_at,
      icon: CheckCircle,
    },
  ];

  return (
    <Card className="p-4">
      <h4 className="font-semibold text-sm mb-4">Response Workflow</h4>
      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-start gap-3">
              <div className={`mt-1 ${step.completed ? 'text-alert-normal' : 'text-foreground/70'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${step.completed ? 'text-foreground' : 'text-foreground/80'}`}>
                    {step.label}
                  </p>
                  {step.completed ? (
                    <Badge variant="outline" className="text-xs">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-foreground/70 font-medium">
                      Pending
                    </Badge>
                  )}
                </div>
                {step.completed && step.timestamp && index > 0 && steps[index - 1].timestamp && (
                  <p className="text-xs text-foreground/70 font-medium mt-1">
                    +{Math.round((new Date(step.timestamp).getTime() - new Date(steps[index - 1].timestamp).getTime()) / 60000)} min
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {alarm.response_time_minutes && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Total Response Time</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">
                {alarm.response_time_minutes} minutes
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AlarmResponseWorkflow;
