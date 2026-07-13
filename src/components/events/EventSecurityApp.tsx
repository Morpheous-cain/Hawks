import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  UserCheck, AlertTriangle, MapPin, Clock, CheckCircle, XCircle,
  Users, Shield, Radio, QrCode, Camera, FileText, Navigation,
  Search, Plus, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const EventSecurityApp = () => {
  const [activeTab, setActiveTab] = useState("checkin");
  const [searchQuery, setSearchQuery] = useState("");
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState("all");
  const queryClient = useQueryClient();

  // Fetch active event
  const { data: activeEvent } = useQuery({
    queryKey: ['active-event'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('status', 'in_progress')
        .limit(1)
        .single();
      if (error) return null;
      return data;
    }
  });

  // Fetch event assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['event-assignments', activeEvent?.id],
    queryFn: async () => {
      if (!activeEvent?.id) return [];
      const { data, error } = await supabase
        .from('event_staff_assignments')
        .select('*, staff(full_name, position, phone)')
        .eq('event_id', activeEvent.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeEvent?.id
  });

  // Fetch event incidents (using incidents table with site filter)
  const { data: incidents = [] } = useQuery({
    queryKey: ['event-incidents', activeEvent?.venue],
    queryFn: async () => {
      if (!activeEvent?.venue) return [];
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .ilike('location', `%${activeEvent.venue}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeEvent?.venue
  });

  // Real-time subscriptions for live updates
  useEffect(() => {
    const assignmentsChannel = supabase
      .channel('event-assignments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_staff_assignments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['event-assignments'] });
      })
      .subscribe();

    const incidentsChannel = supabase
      .channel('event-incidents-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        queryClient.invalidateQueries({ queryKey: ['event-incidents'] });
        toast.info("Incident activity updated");
      })
      .subscribe();

    const eventsChannel = supabase
      .channel('security-events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'security_events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['active-event'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(assignmentsChannel);
      supabase.removeChannel(incidentsChannel);
      supabase.removeChannel(eventsChannel);
    };
  }, [queryClient]);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('event_staff_assignments')
        .update({ 
          status: 'checked_in',
          check_in_time: new Date().toISOString()
        })
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-assignments'] });
      toast.success("Staff checked in successfully");
    },
    onError: () => toast.error("Failed to check in staff")
  });

  // Create incident mutation
  const createIncidentMutation = useMutation({
    mutationFn: async (incidentData: any) => {
      const { error } = await supabase
        .from('incidents')
        .insert({
          title: incidentData.title,
          incident_type: incidentData.incident_type,
          severity: incidentData.severity || 'medium',
          location: incidentData.location,
          description: incidentData.description,
          incident_number: `EI-${Date.now()}`,
          status: 'open',
          occurred_at: new Date().toISOString()
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-incidents'] });
      toast.success("Incident reported successfully");
      setIsIncidentDialogOpen(false);
    },
    onError: () => toast.error("Failed to report incident")
  });

  const handleReportIncident = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createIncidentMutation.mutate({
      title: formData.get('title'),
      incident_type: formData.get('type'),
      severity: formData.get('severity'),
      location: formData.get('location'),
      description: formData.get('description')
    });
  };

  const zones = [
    { id: "zone-a", name: "Zone A - Main Entrance", status: "secure", personnel: 5 },
    { id: "zone-b", name: "Zone B - VIP Area", status: "attention", personnel: 3 },
    { id: "zone-c", name: "Zone C - Stage Area", status: "secure", personnel: 8 },
    { id: "zone-d", name: "Zone D - Food Court", status: "secure", personnel: 4 },
    { id: "zone-e", name: "Zone E - Parking", status: "secure", personnel: 2 },
  ];

  const filteredAssignments = assignments.filter((a: any) => {
    const matchesSearch = a.staff?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === 'all' || a.role?.includes(selectedZone);
    return matchesSearch && matchesZone;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in': return 'bg-alert-normal';
      case 'assigned': return 'bg-alert-caution';
      case 'checked_out': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-alert-critical';
      case 'high': return 'bg-alert-critical/70';
      case 'medium': return 'bg-alert-caution';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="space-y-4">
      {/* Event Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {activeEvent?.event_name || "No Active Event"}
              </h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {activeEvent && (
                  <>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {activeEvent.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {activeEvent.start_time} - {activeEvent.end_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {activeEvent.expected_attendance} guests
                    </span>
                  </>
                )}
              </div>
            </div>
            <Badge className={activeEvent?.security_level === 'high' ? 'bg-alert-critical' : 'bg-primary'}>
              <Shield className="w-3 h-3 mr-1" />
              {activeEvent?.security_level || 'N/A'} Security
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-alert-normal/20">
              <UserCheck className="w-5 h-5 text-alert-normal" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Checked In</p>
              <p className="text-xl font-bold">
                {assignments.filter((a: any) => a.status === 'checked_in').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-alert-caution/20">
              <Users className="w-5 h-5 text-alert-caution" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">
                {assignments.filter((a: any) => a.status === 'assigned').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-alert-critical/20">
              <AlertTriangle className="w-5 h-5 text-alert-critical" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open Incidents</p>
              <p className="text-xl font-bold">
                {incidents.filter((i: any) => i.status === 'open').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Zones</p>
              <p className="text-xl font-bold">{zones.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checkin" className="gap-2">
            <UserCheck className="w-4 h-4" />
            Check-In
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="zones" className="gap-2">
            <MapPin className="w-4 h-4" />
            Zone Patrol
          </TabsTrigger>
        </TabsList>

        {/* Check-In Tab */}
        <TabsContent value="checkin" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <QrCode className="w-4 h-4" />
                Scan QR
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredAssignments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No staff assignments found</p>
                  </div>
                ) : (
                  filteredAssignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {assignment.staff?.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{assignment.staff?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{assignment.role}</p>
                          <p className="text-xs text-muted-foreground">
                            Shift: {assignment.shift_start} - {assignment.shift_end}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status === 'checked_in' ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Checked In</>
                          ) : assignment.status === 'assigned' ? (
                            'Pending'
                          ) : (
                            'Checked Out'
                          )}
                        </Badge>
                        {assignment.status === 'assigned' && (
                          <Button
                            size="sm"
                            onClick={() => checkInMutation.mutate(assignment.id)}
                            disabled={checkInMutation.isPending}
                          >
                            {checkInMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Report Incident
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Incident</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleReportIncident} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Incident Title</Label>
                    <Input name="title" placeholder="Brief description" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select name="type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disturbance">Disturbance</SelectItem>
                          <SelectItem value="theft">Theft</SelectItem>
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="access">Access Violation</SelectItem>
                          <SelectItem value="fire">Fire/Safety</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select name="severity" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select name="location" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map(zone => (
                          <SelectItem key={zone.id} value={zone.name}>{zone.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea name="description" placeholder="Detailed description..." rows={4} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={createIncidentMutation.isPending}>
                    {createIncidentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 mr-2" />
                    )}
                    Submit Report
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {incidents.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No incidents reported</p>
                </Card>
              ) : (
                incidents.map((incident: any) => (
                  <Card key={incident.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                          <Badge variant="outline">{incident.incident_type}</Badge>
                        </div>
                        <p className="font-medium">{incident.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {incident.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(incident.reported_at), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                      <Badge variant={incident.status === 'open' ? 'destructive' : 'secondary'}>
                        {incident.status}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Zone Patrol Tab */}
        <TabsContent value="zones" className="space-y-4">
          <div className="grid gap-4">
            {zones.map((zone) => (
              <Card key={zone.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      zone.status === 'secure' ? 'bg-alert-normal/20' : 'bg-alert-caution/20'
                    }`}>
                      <MapPin className={`w-6 h-6 ${
                        zone.status === 'secure' ? 'text-alert-normal' : 'text-alert-caution'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {zone.personnel} personnel assigned
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={zone.status === 'secure' ? 'bg-alert-normal' : 'bg-alert-caution'}>
                      {zone.status === 'secure' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Secure</>
                      ) : (
                        <><AlertTriangle className="w-3 h-3 mr-1" /> Attention</>
                      )}
                    </Badge>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Navigation className="w-4 h-4" />
                      Patrol
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventSecurityApp;
