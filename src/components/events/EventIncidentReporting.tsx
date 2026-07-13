import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, Plus, MapPin, Clock, User, Camera,
  FileText, CheckCircle, AlertCircle, Loader2, Eye, Send
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface EventIncidentReportingProps {
  eventId: string;
  eventName: string;
}

const EventIncidentReporting = ({ eventId, eventName }: EventIncidentReportingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewIncident, setViewIncident] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch incidents for this event
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['event-incidents', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('*, staff:assigned_to(full_name)')
        .or(`description.ilike.%${eventId}%,title.ilike.%event%`)
        .order('occurred_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    }
  });

  // Create incident mutation
  const createIncident = useMutation({
    mutationFn: async (incidentData: any) => {
      const incidentNumber = `EV-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      const { error } = await supabase
        .from('incidents')
        .insert({
          ...incidentData,
          incident_number: incidentNumber,
          status: 'open',
          occurred_at: new Date().toISOString()
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-incidents'] });
      toast.success('Incident reported successfully');
      setIsOpen(false);
    },
    onError: () => toast.error('Failed to report incident')
  });

  // Update incident status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-incidents'] });
      toast.success('Incident status updated');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createIncident.mutate({
      title: formData.get('title'),
      incident_type: formData.get('type'),
      severity: formData.get('severity'),
      location: formData.get('location'),
      description: `Event: ${eventName} (${eventId})\n\n${formData.get('description')}`,
    });
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-alert-critical/20 text-alert-critical',
      high: 'bg-red-500/20 text-red-500',
      medium: 'bg-alert-caution/20 text-alert-caution',
      low: 'bg-alert-normal/20 text-alert-normal'
    };
    return colors[severity] || 'bg-muted';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-500/20 text-red-500',
      assigned: 'bg-blue-500/20 text-blue-500',
      in_progress: 'bg-amber-500/20 text-amber-500',
      resolved: 'bg-green-500/20 text-green-500',
      closed: 'bg-muted text-muted-foreground'
    };
    return colors[status] || 'bg-muted';
  };

  const incidentStats = {
    total: incidents.length,
    open: incidents.filter((i: any) => i.status === 'open').length,
    inProgress: incidents.filter((i: any) => i.status === 'in_progress' || i.status === 'assigned').length,
    resolved: incidents.filter((i: any) => i.status === 'resolved' || i.status === 'closed').length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Incidents</p>
              <p className="text-xl font-bold">{incidentStats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="text-xl font-bold">{incidentStats.open}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Loader2 className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-xl font-bold">{incidentStats.inProgress}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-xl font-bold">{incidentStats.resolved}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Incident List */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-alert-caution" />
              Event Incidents
            </CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Report Incident
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Report Incident</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">{eventName}</p>
                    <p className="text-xs text-muted-foreground">Event Incident Report</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Incident Title *</Label>
                    <Input name="title" placeholder="Brief description of incident" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type *</Label>
                      <Select name="type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="medical">🏥 Medical Emergency</SelectItem>
                          <SelectItem value="security">🛡️ Security Breach</SelectItem>
                          <SelectItem value="vip">⭐ VIP Concern</SelectItem>
                          <SelectItem value="crowd">👥 Crowd Control</SelectItem>
                          <SelectItem value="theft">🚨 Theft/Robbery</SelectItem>
                          <SelectItem value="assault">⚠️ Assault</SelectItem>
                          <SelectItem value="property">🏢 Property Damage</SelectItem>
                          <SelectItem value="other">📋 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity *</Label>
                      <Select name="severity" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">🟢 Low</SelectItem>
                          <SelectItem value="medium">🟡 Medium</SelectItem>
                          <SelectItem value="high">🟠 High</SelectItem>
                          <SelectItem value="critical">🔴 Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location *</Label>
                    <Input name="location" placeholder="Specific area within venue" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea 
                      name="description" 
                      placeholder="Detailed description of the incident..."
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="gap-2">
                      <Send className="w-4 h-4" />
                      Submit Report
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading incidents...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500/50" />
              <p className="text-muted-foreground">No incidents reported</p>
              <p className="text-sm text-muted-foreground mt-1">All clear at this event</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incident</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident: any) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{incident.title}</p>
                        <p className="text-xs text-muted-foreground">{incident.incident_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {incident.incident_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{incident.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(incident.occurred_at), 'HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setViewIncident(incident)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {incident.status === 'open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => updateStatus.mutate({ id: incident.id, status: 'in_progress' })}
                          >
                            Handle
                          </Button>
                        )}
                        {incident.status === 'in_progress' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-green-500"
                            onClick={() => updateStatus.mutate({ id: incident.id, status: 'resolved' })}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Incident Dialog */}
      <Dialog open={!!viewIncident} onOpenChange={() => setViewIncident(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Incident Details</DialogTitle>
          </DialogHeader>
          {viewIncident && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg">{viewIncident.title}</h3>
                  <p className="text-sm text-muted-foreground">{viewIncident.incident_number}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getSeverityColor(viewIncident.severity)}>
                    {viewIncident.severity}
                  </Badge>
                  <Badge className={getStatusColor(viewIncident.status)}>
                    {viewIncident.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{viewIncident.incident_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{viewIncident.location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reported At</p>
                  <p className="font-medium">{format(new Date(viewIncident.occurred_at), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{viewIncident.staff?.full_name || 'Unassigned'}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Description</p>
                <p className="text-sm whitespace-pre-wrap">{viewIncident.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventIncidentReporting;
