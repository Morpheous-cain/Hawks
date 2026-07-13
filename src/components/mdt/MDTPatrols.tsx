import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, CheckCircle, MessageSquare, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MDTPatrolsProps {
  vehicleId: string | null;
}

const MDTPatrols = ({ vehicleId }: MDTPatrolsProps) => {
  const [patrols, setPatrols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatrols();
    const unsubscribe = subscribeToPatrols();
    return () => unsubscribe?.();
  }, [vehicleId]);

  const fetchPatrols = async () => {
    setLoading(true);
    try {
      // Fetch mobile patrols from database - show all if no vehicle assigned
      const { data, error } = await supabase
        .from("mobile_patrols")
        .select("*")
        .in("status", ["not_started", "in_progress", "delayed"])
        .order("start_time", { ascending: true })
        .limit(10);

      if (error) throw error;
      setPatrols(data || []);
    } catch (error: any) {
      console.error("Error fetching patrols:", error);
      setPatrols([]);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPatrols = () => {
    const channel = supabase
      .channel("mdt-patrols-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mobile_patrols",
        },
        () => {
          fetchPatrols();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleStartPatrol = async (patrolId: string) => {
    try {
      const { error } = await supabase
        .from("mobile_patrols")
        .update({
          status: "in_progress",
          actual_start: new Date().toISOString(),
        })
        .eq("id", patrolId);

      if (error) throw error;

      if (vehicleId) {
        await supabase
          .from("vehicles")
          .update({ status: "on_patrol" })
          .eq("id", vehicleId);
      }

      toast.success("Patrol started");
      fetchPatrols();
    } catch (error: any) {
      console.error("Error starting patrol:", error);
      toast.error("Failed to start patrol");
    }
  };

  const handleCompletePatrol = async (patrolId: string) => {
    try {
      const { error } = await supabase
        .from("mobile_patrols")
        .update({
          status: "completed",
          actual_end: new Date().toISOString(),
        })
        .eq("id", patrolId);

      if (error) throw error;

      if (vehicleId) {
        await supabase
          .from("vehicles")
          .update({ status: "available" })
          .eq("id", vehicleId);
      }

      toast.success("Patrol completed");
      fetchPatrols();
    } catch (error: any) {
      console.error("Error completing patrol:", error);
      toast.error("Failed to complete patrol");
    }
  };

  const priorityColors: Record<string, string> = {
    normal: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  const statusColors: Record<string, string> = {
    not_started: "bg-muted",
    in_progress: "bg-blue-500",
    delayed: "bg-yellow-500",
    completed: "bg-green-500",
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-muted-foreground">Loading patrols...</p>
      </Card>
    );
  }

  if (patrols.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground mb-4">No active patrols assigned</p>
        <Button variant="outline" onClick={fetchPatrols} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchPatrols} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>
      
      {patrols.map((patrol) => (
        <Card key={patrol.id} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold">{patrol.patrol_id}</h3>
                <Badge className={priorityColors[patrol.priority] || "bg-blue-500"}>
                  {(patrol.priority || "normal").toUpperCase()}
                </Badge>
                <Badge className={statusColors[patrol.status] || "bg-muted"}>
                  {(patrol.status || "not_started").replace("_", " ").toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {(patrol.patrol_type || "routine").replace("_", " ")}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Client:</span>
                <p className="font-medium">{patrol.client_name || "N/A"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Site:</span>
                <p className="font-medium">{patrol.site_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Start Time:</span>
                <p className="font-medium">
                  {patrol.start_time ? format(new Date(patrol.start_time), "HH:mm") : "N/A"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Route:</span>
                <p className="font-medium">{patrol.route_name || "Standard"}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {patrol.status === "not_started" && (
              <Button
                onClick={() => handleStartPatrol(patrol.id)}
                className="gap-2"
                size="sm"
              >
                <PlayCircle className="w-4 h-4" />
                Start Patrol
              </Button>
            )}
            {patrol.status === "in_progress" && (
              <Button
                onClick={() => handleCompletePatrol(patrol.id)}
                className="gap-2 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CheckCircle className="w-4 h-4" />
                Complete Patrol
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={async () => {
                const note = window.prompt(`Send note for patrol ${patrol.patrol_id}:`);
                if (!note) return;
                const { error } = await supabase.from("communication_tickets").insert({
                  channel: "dispatch",
                  subject: `Patrol note · ${patrol.patrol_id}`,
                  message: note,
                  priority: "normal",
                  status: "new",
                } as any);
                if (error) toast.error("Failed to send note");
                else toast.success("Note sent to control room");
              }}
            >
              <MessageSquare className="w-4 h-4" />
              Send Note
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default MDTPatrols;
