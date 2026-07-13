import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IncidentCreateDialog } from "./IncidentCreateDialog";

const IncidentCommandCentre = () => {
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchIncidents();
    subscribeToIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*, sites(site_name), clients(legal_name)')
        .in('status', ['open', 'assigned', 'in_progress'])
        .order('occurred_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error: any) {
      console.error('Error fetching incidents:', error);
      toast.error('Failed to fetch incidents');
    }
  };

  const subscribeToIncidents = () => {
    const channel = supabase
      .channel('incidents-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchIncidents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateIncidentStatus = async (incidentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ status })
        .eq('id', incidentId);

      if (error) throw error;
      toast.success('Incident status updated');
      fetchIncidents();
    } catch (error: any) {
      console.error('Error updating incident:', error);
      toast.error('Failed to update incident status');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-alert-critical';
      case 'high': return 'bg-alert-caution';
      case 'medium': return 'bg-alert-caution/70';
      default: return 'bg-muted';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Incident Command Centre
            </span>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Incident
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
          {incidents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No active incidents</p>
          ) : (
            incidents.map((incident) => (
              <div
                key={incident.id}
                className="p-4 bg-muted/30 rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold">{incident.incident_number}</h3>
                    <p className="text-sm text-muted-foreground">
                      {incident.clients?.legal_name} - {incident.sites?.site_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Type: {incident.incident_type} | Location: {incident.location}
                    </p>
                    <p className="text-sm mt-2">{incident.description}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                    <Badge variant="outline">{incident.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {incident.status === 'open' && (
                    <Button size="sm" onClick={() => updateIncidentStatus(incident.id, 'assigned')}>
                      Assign
                    </Button>
                  )}
                  {incident.status === 'assigned' && (
                    <Button size="sm" onClick={() => updateIncidentStatus(incident.id, 'in_progress')}>
                      Start Response
                    </Button>
                  )}
                  {incident.status === 'in_progress' && (
                    <Button size="sm" onClick={() => updateIncidentStatus(incident.id, 'resolved')}>
                      Mark Resolved
                    </Button>
                  )}
                  <Button size="sm" variant="outline">View Details</Button>
                  <Button size="sm" variant="outline">Add Note</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <IncidentCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchIncidents}
      />
    </>
  );
};

export default IncidentCommandCentre;