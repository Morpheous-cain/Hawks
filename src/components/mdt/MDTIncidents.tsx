import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface MDTIncidentsProps {
  vehicleId: string | null;
}

const incidentTypes = [
  "Suspicious Person",
  "Break-in",
  "Accident",
  "Fire",
  "Alarm Activation",
  "Medical Emergency",
  "Other",
];

const MDTIncidents = ({ vehicleId }: MDTIncidentsProps) => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    incident_type: "",
    description: "",
    action_taken: "",
    location: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchIncidents();
    const unsubscribe = subscribeToIncidents();
    return () => unsubscribe?.();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setIncidents(data || []);
    } catch (error: any) {
      console.error("Error fetching incidents:", error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToIncidents = () => {
    const channel = supabase
      .channel("mdt-incidents-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents",
        },
        () => {
          fetchIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.incident_type || !formData.description || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const incidentNumber = `INC-${Date.now()}`;
      
      const { error } = await supabase.from("incidents").insert([{
        incident_number: incidentNumber,
        incident_type: formData.incident_type,
        title: `${formData.incident_type} at ${formData.location}`,
        description: formData.description,
        location: formData.location,
        occurred_at: new Date().toISOString(),
        reported_by: user?.id,
        severity: "medium",
        status: "open",
      }]);

      if (error) throw error;

      toast.success("Incident reported successfully");
      setFormData({
        incident_type: "",
        description: "",
        action_taken: "",
        location: "",
      });
      setShowForm(false);
      fetchIncidents();
    } catch (error: any) {
      console.error("Error reporting incident:", error);
      toast.error("Failed to report incident");
    } finally {
      setSubmitting(false);
    }
  };

  const severityColors: Record<string, string> = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  };

  const statusColors: Record<string, string> = {
    open: "bg-red-500",
    investigating: "bg-yellow-500",
    resolved: "bg-green-500",
    closed: "bg-muted",
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-muted-foreground">Loading incidents...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
          {showForm ? "Cancel" : "Report New Incident"}
        </Button>
        <Button variant="outline" size="sm" onClick={fetchIncidents} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Report Incident</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="incident_type">Incident Type *</Label>
              <Select
                value={formData.incident_type}
                onValueChange={(value) => setFormData({ ...formData, incident_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select incident type" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter location"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what happened..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="action_taken">Action Taken</Label>
              <Textarea
                id="action_taken"
                value={formData.action_taken}
                onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                placeholder="Describe what actions you took..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit Incident Report"}
            </Button>
          </form>
        </Card>
      )}

      {incidents.length === 0 ? (
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No recent incidents</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <Card key={incident.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{incident.incident_number}</p>
                    <Badge className={severityColors[incident.severity] || "bg-yellow-500"}>
                      {(incident.severity || "medium").toUpperCase()}
                    </Badge>
                    <Badge className={statusColors[incident.status] || "bg-muted"}>
                      {(incident.status || "open").toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{incident.incident_type}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {incident.created_at ? format(new Date(incident.created_at), "MMM d, HH:mm") : ""}
                </span>
              </div>
              <p className="text-sm mb-1"><strong>Location:</strong> {incident.location}</p>
              <p className="text-sm text-muted-foreground">{incident.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MDTIncidents;
