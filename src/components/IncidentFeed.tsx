import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Incident {
  id: string;
  incident_number: string;
  title: string;
  incident_type: string;
  location: string;
  created_at: string;
  status: string;
  severity: string;
  staff?: { full_name: string } | null;
}

const IncidentFeed = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const { data } = await supabase
        .from("incidents")
        .select("id, incident_number, title, incident_type, location, created_at, status, severity, staff(full_name)")
        .in("status", ["open", "investigating", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(10);

      setIncidents((data as any) || []);
    } catch (error) {
      console.error("Error fetching incidents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    const channel = supabase
      .channel("incident-feed-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, () => {
        fetchIncidents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statusConfig: Record<string, string> = {
    open: "bg-alert-critical text-primary-foreground",
    investigating: "bg-alert-caution text-primary-foreground",
    in_progress: "bg-primary text-primary-foreground",
    resolved: "bg-alert-normal text-primary-foreground",
    closed: "bg-muted text-muted-foreground",
  };

  const priorityConfig: Record<string, string> = {
    low: "border-muted-foreground/30",
    medium: "border-alert-caution/30",
    high: "border-alert-caution/50",
    critical: "border-alert-critical/30 shadow-glow",
  };

  if (loading) {
    return (
      <Card className="p-4 h-full border-border">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Loading incidents...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 h-full border-border">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Live Incident Feed</h3>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          {incidents.length} Active
        </Badge>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {incidents.length > 0 ? (
          incidents.map((incident) => (
            <div
              key={incident.id}
              className={`p-3 rounded-lg bg-card border-l-4 ${priorityConfig[incident.severity] || priorityConfig.medium} hover:bg-secondary/50 transition-colors cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">
                    {incident.title || incident.incident_type || "Incident"}
                  </p>
                  <p className="text-xs font-medium text-foreground/80 mt-1">
                    {incident.incident_number}
                  </p>
                </div>
                <Badge className={statusConfig[incident.status] || statusConfig.open}>
                  {incident.status?.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-1.5 mt-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <MapPin className="w-3 h-3" />
                  <span>{incident.location || "Unknown location"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}</span>
                </div>
                {incident.staff?.full_name && (
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                    <User className="w-3 h-3" />
                    <span>{incident.staff.full_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No active incidents
          </div>
        )}
      </div>
    </Card>
  );
};

export default IncidentFeed;
