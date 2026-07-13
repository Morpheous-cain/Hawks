import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  CalendarDays, Plus, MapPin, Users, Shield, Clock, CheckCircle2, 
  AlertTriangle, Ticket, Building, Calendar, Search, Download, 
  Edit, Trash2, Eye, UserPlus, Star, Filter, BarChart3, 
  Phone, Mail, DollarSign, FileText, Clock3, AlertCircle,
  Radio, Siren, Activity, Camera
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { exportToCSV, exportToPDF } from "@/utils/exportData";
import EventRiskAssessment from "@/components/events/EventRiskAssessment";
import EventIncidentReporting from "@/components/events/EventIncidentReporting";
import EventCommunication from "@/components/events/EventCommunication";
import EventEmergencyPanel from "@/components/events/EventEmergencyPanel";
import EventReporting from "@/components/events/EventReporting";
import EventMonitoringDashboard from "@/components/events/EventMonitoringDashboard";


const EventSecurity = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewEvent, setViewEvent] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['security-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*, clients(legal_name, primary_contact_name)')
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch event assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['event-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_staff_assignments')
        .select('*, security_events(event_name, event_date, venue), staff(full_name, position, phone)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch staff for assignment
  const { data: staff = [] } = useQuery({
    queryKey: ['available-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, full_name, position, phone')
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, legal_name')
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    }
  });

  // Create event mutation
  const createEvent = useMutation({
    mutationFn: async (eventData: any) => {
      const { error } = await supabase
        .from('security_events')
        .insert(eventData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
      toast.success('Event created successfully');
      setIsCreateOpen(false);
    },
    onError: () => toast.error('Failed to create event')
  });

  // Assign staff mutation
  const assignStaff = useMutation({
    mutationFn: async (assignmentData: any) => {
      const { error } = await supabase
        .from('event_staff_assignments')
        .insert(assignmentData);
      if (error) throw error;
      
      // Update staff_assigned count
      const { error: updateError } = await supabase
        .from('security_events')
        .update({ staff_assigned: (selectedEvent?.staff_assigned || 0) + 1 })
        .eq('id', assignmentData.event_id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
      toast.success('Staff assigned successfully');
      setIsAssignOpen(false);
    },
    onError: () => toast.error('Failed to assign staff')
  });

  // Update event status
  const updateEventStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('security_events')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
      toast.success('Event status updated');
    }
  });

  // Delete event
  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('security_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-events'] });
      toast.success('Event deleted');
    },
    onError: () => toast.error('Failed to delete event')
  });

  const handleCreateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createEvent.mutate({
      event_name: formData.get('name'),
      event_type: formData.get('type'),
      client_id: formData.get('client') || null,
      venue: formData.get('venue'),
      venue_address: formData.get('address'),
      event_date: formData.get('date'),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      expected_attendance: parseInt(formData.get('attendance') as string) || 100,
      security_level: formData.get('security_level'),
      staff_required: parseInt(formData.get('staff_required') as string) || 5,
      description: formData.get('description'),
      special_requirements: formData.get('special_requirements'),
      status: 'planned'
    });
  };

  const handleAssignStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    assignStaff.mutate({
      event_id: selectedEvent?.id,
      staff_id: formData.get('staff_id'),
      role: formData.get('role'),
      shift_start: formData.get('shift_start'),
      shift_end: formData.get('shift_end'),
      notes: formData.get('notes'),
      status: 'assigned'
    });
  };

  // Filter events
  const filteredEvents = events.filter((e: any) => {
    const matchesSearch = e.event_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.venue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.clients?.legal_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats calculations
  const upcomingEvents = events.filter((e: any) => 
    (e.status === 'planned' || e.status === 'confirmed') && isAfter(new Date(e.event_date), new Date())
  ).length;
  const activeEvents = events.filter((e: any) => e.status === 'in_progress').length;
  const completedEvents = events.filter((e: any) => e.status === 'completed').length;
  const totalStaffAssigned = assignments.length;
  const highSecurityEvents = events.filter((e: any) => e.security_level === 'high').length;
  const totalExpectedAttendance = events.reduce((sum: number, e: any) => sum + (e.expected_attendance || 0), 0);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'bg-primary/20 text-primary',
      confirmed: 'bg-alert-caution/20 text-alert-caution',
      in_progress: 'bg-alert-normal/20 text-alert-normal',
      completed: 'bg-muted text-muted-foreground',
      cancelled: 'bg-alert-critical/20 text-alert-critical'
    };
    return colors[status] || 'bg-muted';
  };

  const getSecurityLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      high: 'bg-alert-critical/20 text-alert-critical',
      medium: 'bg-alert-caution/20 text-alert-caution',
      low: 'bg-alert-normal/20 text-alert-normal'
    };
    return colors[level] || 'bg-muted';
  };

  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      corporate: '🏢',
      concert: '🎵',
      conference: '📊',
      wedding: '💒',
      sports: '⚽',
      political: '🏛️',
      religious: '⛪',
      other: '📅'
    };
    return icons[type] || '📅';
  };

  const handleExport = () => {
    const exportData = events.map((e: any) => ({
      'Event Name': e.event_name,
      'Type': e.event_type,
      'Client': e.clients?.legal_name || '-',
      'Venue': e.venue,
      'Date': format(new Date(e.event_date), 'yyyy-MM-dd'),
      'Security Level': e.security_level,
      'Staff Required': e.staff_required,
      'Staff Assigned': e.staff_assigned || 0,
      'Expected Attendance': e.expected_attendance,
      'Status': e.status
    }));
    exportToCSV(exportData, 'event_security');
    toast.success('Events exported');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Security Management"
        description="Plan, manage, and coordinate security for events, concerts, and special occasions"
        icon={CalendarDays}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
                <p className="text-xl font-bold">{upcomingEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-alert-normal/10 to-alert-normal/5 border-alert-normal/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-normal/20">
                <Shield className="w-5 h-5 text-alert-normal" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold">{activeEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Staff Assigned</p>
                <p className="text-xl font-bold">{totalStaffAssigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-alert-critical/10 to-alert-critical/5 border-alert-critical/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-critical/20">
                <AlertTriangle className="w-5 h-5 text-alert-critical" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">High Security</p>
                <p className="text-xl font-bold">{highSecurityEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Ticket className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expected Guests</p>
                <p className="text-xl font-bold">{totalExpectedAttendance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-alert-caution/10 to-alert-caution/5 border-alert-caution/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-alert-caution/20">
                <CheckCircle2 className="w-5 h-5 text-alert-caution" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{completedEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search events, venues, clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 bg-primary">
                  <Plus className="w-4 h-4" />
                  New Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Create Security Event</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <form onSubmit={handleCreateEvent} className="space-y-6 py-4">
                    {/* Event Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Event Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Event Name *</Label>
                          <Input name="name" placeholder="e.g., Corporate Gala 2025" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Event Type *</Label>
                          <Select name="type" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="corporate">🏢 Corporate Event</SelectItem>
                              <SelectItem value="concert">🎵 Concert</SelectItem>
                              <SelectItem value="conference">📊 Conference</SelectItem>
                              <SelectItem value="wedding">💒 Wedding</SelectItem>
                              <SelectItem value="sports">⚽ Sports Event</SelectItem>
                              <SelectItem value="political">🏛️ Political Rally</SelectItem>
                              <SelectItem value="religious">⛪ Religious Gathering</SelectItem>
                              <SelectItem value="other">📅 Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Client & Venue */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Client & Venue</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Client (Optional)</Label>
                          <Select name="client">
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client: any) => (
                                <SelectItem key={client.id} value={client.id}>{client.legal_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Venue Name *</Label>
                            <Input name="venue" placeholder="e.g., KICC" required />
                          </div>
                          <div className="space-y-2">
                            <Label>Venue Address</Label>
                            <Input name="address" placeholder="Full address" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Date & Time</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Event Date *</Label>
                          <Input name="date" type="date" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Start Time *</Label>
                          <Input name="start_time" type="time" required />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time *</Label>
                          <Input name="end_time" type="time" required />
                        </div>
                      </div>
                    </div>

                    {/* Security Requirements */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Security Requirements</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Expected Attendance</Label>
                          <Input name="attendance" type="number" placeholder="100" defaultValue={100} />
                        </div>
                        <div className="space-y-2">
                          <Label>Security Level *</Label>
                          <Select name="security_level" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">🟢 Low</SelectItem>
                              <SelectItem value="medium">🟡 Medium</SelectItem>
                              <SelectItem value="high">🔴 High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Staff Required *</Label>
                          <Input name="staff_required" type="number" placeholder="5" defaultValue={5} />
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Additional Information</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Event Description</Label>
                          <Textarea name="description" placeholder="Event details and overview..." rows={3} />
                        </div>
                        <div className="space-y-2">
                          <Label>Special Security Requirements</Label>
                          <Textarea name="special_requirements" placeholder="VIP protection, access control specifics, equipment needs..." rows={3} />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                      <Button type="submit">Create Event</Button>
                    </div>
                  </form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 lg:w-auto lg:inline-grid">
          <TabsTrigger value="events" className="gap-2">
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Monitor</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Risk</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Incidents</span>
          </TabsTrigger>
          <TabsTrigger value="comms" className="gap-2">
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">Comms</span>
          </TabsTrigger>
          <TabsTrigger value="emergency" className="gap-2">
            <Siren className="w-4 h-4" />
            <span className="hidden sm:inline">Emergency</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>


        <TabsContent value="events" className="mt-4">
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="w-5 h-5 text-primary" />
                Security Events
                <Badge variant="secondary" className="ml-2">{filteredEvents.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Event</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Security</TableHead>
                    <TableHead>Staffing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">Loading events...</TableCell>
                    </TableRow>
                  ) : filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No events found</p>
                        <p className="text-sm text-muted-foreground mt-1">Create an event to get started</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((event: any) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getEventTypeIcon(event.event_type)}</span>
                            <div>
                              <p className="font-medium">{event.event_name}</p>
                              <Badge variant="outline" className="text-xs mt-1">{event.event_type}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {event.clients?.legal_name || (
                            <span className="text-muted-foreground">No client</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{event.venue}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{format(new Date(event.event_date), 'MMM dd, yyyy')}</p>
                            <p className="text-muted-foreground">{event.start_time} - {event.end_time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSecurityLevelColor(event.security_level)}>
                            {event.security_level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(event.staff_assigned || 0) / event.staff_required * 100} 
                              className="w-16 h-2" 
                            />
                            <span className="text-xs text-muted-foreground">
                              {event.staff_assigned || 0}/{event.staff_required}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedEvent(event);
                                setIsAssignOpen(true);
                              }}
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => setViewEvent(event)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                if (confirm('Delete this event?')) {
                                  deleteEvent.mutate(event.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-4">
          <EventMonitoringDashboard event={selectedEvent || events[0]} assignments={assignments} />
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card className="bg-card/50 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                Staff Assignments
                <Badge variant="secondary" className="ml-2">{assignments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No staff assignments yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Assign staff to events to see them here</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment: any) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {assignment.staff?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{assignment.staff?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{assignment.staff?.position}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{assignment.security_events?.event_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{assignment.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {assignment.security_events?.event_date && 
                            format(new Date(assignment.security_events.event_date), 'MMM dd, yyyy')
                          }
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {assignment.shift_start} - {assignment.shift_end}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(assignment.status)}>
                            {assignment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-4">
          <EventRiskAssessment event={selectedEvent || events[0]} />
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <EventIncidentReporting 
            eventId={selectedEvent?.id || events[0]?.id || ''} 
            eventName={selectedEvent?.event_name || events[0]?.event_name || 'Event'} 
          />
        </TabsContent>

        <TabsContent value="comms" className="mt-4">
          <EventCommunication 
            eventId={selectedEvent?.id || events[0]?.id || ''} 
            eventName={selectedEvent?.event_name || events[0]?.event_name || 'Event'}
            assignments={assignments}
          />
        </TabsContent>

        <TabsContent value="emergency" className="mt-4">
          <EventEmergencyPanel 
            eventId={selectedEvent?.id || events[0]?.id || ''} 
            eventName={selectedEvent?.event_name || events[0]?.event_name || 'Event'} 
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <EventReporting 
            event={selectedEvent || events[0]} 
            assignments={assignments}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Events by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['corporate', 'concert', 'conference', 'wedding', 'sports', 'political', 'religious', 'other'].map((type) => {
                    const count = events.filter((e: any) => e.event_type === type).length;
                    const percentage = events.length > 0 ? (count / events.length) * 100 : 0;
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {getEventTypeIcon(type)}
                            <span className="capitalize">{type}</span>
                          </span>
                          <span className="text-muted-foreground">{count} events</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Event Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Total Events</span>
                    <span className="text-xl font-bold text-primary">{events.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Avg Staff Per Event</span>
                    <span className="text-xl font-bold text-primary">
                      {events.length > 0 
                        ? Math.round(events.reduce((a: number, e: any) => a + (e.staff_required || 0), 0) / events.length)
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Completion Rate</span>
                    <span className="text-xl font-bold text-primary">
                      {events.length > 0 
                        ? Math.round(completedEvents / events.length * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Avg Attendance</span>
                    <span className="text-xl font-bold text-primary">
                      {events.length > 0 
                        ? Math.round(totalExpectedAttendance / events.length)
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assign Staff Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Staff to Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <form onSubmit={handleAssignStaff} className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{selectedEvent.event_name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedEvent.event_date), 'MMM dd, yyyy')} at {selectedEvent.venue}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Select Staff Member *</Label>
                <Select name="staff_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name} - {s.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select name="role" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Team Leader">Team Leader</SelectItem>
                    <SelectItem value="Security Guard">Security Guard</SelectItem>
                    <SelectItem value="Access Control">Access Control</SelectItem>
                    <SelectItem value="Crowd Control">Crowd Control</SelectItem>
                    <SelectItem value="VIP Protection">VIP Protection</SelectItem>
                    <SelectItem value="Patrol Officer">Patrol Officer</SelectItem>
                    <SelectItem value="CCTV Operator">CCTV Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shift Start</Label>
                  <Input name="shift_start" type="time" defaultValue={selectedEvent.start_time} />
                </div>
                <div className="space-y-2">
                  <Label>Shift End</Label>
                  <Input name="shift_end" type="time" defaultValue={selectedEvent.end_time} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea name="notes" placeholder="Special instructions..." />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
                <Button type="submit">Assign Staff</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Event Dialog */}
      <Dialog open={!!viewEvent} onOpenChange={() => setViewEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {viewEvent && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{getEventTypeIcon(viewEvent.event_type)}</span>
                <div>
                  <h3 className="text-xl font-bold">{viewEvent.event_name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge className={getStatusColor(viewEvent.status)}>
                      {viewEvent.status?.replace('_', ' ')}
                    </Badge>
                    <Badge className={getSecurityLevelColor(viewEvent.security_level)}>
                      {viewEvent.security_level} security
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-medium">{viewEvent.clients?.legal_name || 'No client'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{viewEvent.event_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(viewEvent.event_date), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{viewEvent.start_time} - {viewEvent.end_time}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Venue</p>
                  <p className="font-medium">{viewEvent.venue}</p>
                  {viewEvent.venue_address && (
                    <p className="text-sm text-muted-foreground">{viewEvent.venue_address}</p>
                  )}
                </div>
              </div>

              <Card className="p-4 bg-muted/30">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{viewEvent.expected_attendance}</p>
                    <p className="text-xs text-muted-foreground">Expected Guests</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{viewEvent.staff_required}</p>
                    <p className="text-xs text-muted-foreground">Staff Required</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{viewEvent.staff_assigned || 0}</p>
                    <p className="text-xs text-muted-foreground">Staff Assigned</p>
                  </div>
                </div>
              </Card>

              {viewEvent.description && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Description</p>
                  <p className="text-sm">{viewEvent.description}</p>
                </div>
              )}

              {viewEvent.special_requirements && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Special Requirements</p>
                  <p className="text-sm">{viewEvent.special_requirements}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventSecurity;
