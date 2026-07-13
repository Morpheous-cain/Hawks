import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ControlRoomAlertsProps {
  alerts: any[];
  showAll?: boolean;
}

const ControlRoomAlerts = ({ alerts, showAll = false }: ControlRoomAlertsProps) => {
  const { user } = useAuth();

  const handleRespond = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("sos_alerts")
        .update({
          status: "responding",
          responded_by: user?.id,
          response_time: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Responding to SOS alert");
    } catch (error: any) {
      console.error("Error responding to alert:", error);
      toast.error("Failed to respond to alert");
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("sos_alerts")
        .update({
          status: "resolved",
          resolution_time: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("SOS alert resolved");
    } catch (error: any) {
      console.error("Error resolving alert:", error);
      toast.error("Failed to resolve alert");
    }
  };

  const displayAlerts = showAll ? alerts : alerts.slice(0, 3);

  if (alerts.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-foreground/80 font-medium">No active SOS alerts</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {displayAlerts.map((alert) => (
        <Card key={alert.id} className="p-4 border-destructive">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <h3 className="font-bold">{alert.alert_number}</h3>
                <p className="text-sm text-foreground/80 font-medium">
                  {alert.vehicles?.vehicle_id} - {alert.profiles?.full_name}
                </p>
              </div>
            </div>
            <Badge
              variant={alert.status === "active" ? "destructive" : "secondary"}
            >
              {alert.status.toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-2 text-sm mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{format(new Date(alert.triggered_at), "PPp")}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>
                GPS: {alert.gps_lat.toFixed(6)}, {alert.gps_lng.toFixed(6)}
              </span>
            </div>
          </div>

          {alert.status === "active" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRespond(alert.id)}
              >
                Respond
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`https://maps.google.com/?q=${alert.gps_lat},${alert.gps_lng}`, "_blank")}
              >
                View on Map
              </Button>
            </div>
          )}

          {alert.status === "responding" && (
            <Button
              size="sm"
              className="bg-alert-normal hover:bg-alert-normal/90"
              onClick={() => handleResolve(alert.id)}
            >
              Mark as Resolved
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ControlRoomAlerts;
