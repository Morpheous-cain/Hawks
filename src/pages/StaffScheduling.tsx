import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import LoadingPulse from "@/components/LoadingPulse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Clock, MapPin } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { toast } from "sonner";

export default function StaffScheduling() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [formData, setFormData] = useState({
    staff_id: "",
    client_id: "",
    site_id: "",
    shift_date: format(new Date(), "yyyy-MM-dd"),
    shift_start: "06:00",
    shift_end: "18:00",
    shift_type: "day",
    notes: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
    
    // Set up real-time subscription for schedules
    const channel = supabase
      .channel('schedules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules'
        },
        () => {
          fetchSchedules();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedWeek]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchSchedules(),
        fetchStaff(),
        fetchClients(),
        fetchSites(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    const weekStart = startOfWeek(selectedWeek);
    const weekEnd = addDays(weekStart, 6);

    const { data, error } = await supabase
      .from("schedules")
      .select(`
        *,
        staff:staff_id(full_name, staff_id),
        clients:client_id(legal_name),
        sites:site_id(site_name)
      `)
      .gte("shift_date", format(weekStart, "yyyy-MM-dd"))
      .lte("shift_date", format(weekEnd, "yyyy-MM-dd"))
      .order("shift_date", { ascending: true });
    
    if (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Failed to load schedules");
    }
    
    setSchedules(data || []);
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("id, full_name, staff_id")
      .eq("status", "active");
    
    if (error) {
      console.error("Error fetching staff:", error);
    }
    setStaff(data || []);
  };

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("id, legal_name");
    if (error) {
      console.error("Error fetching clients:", error);
    }
    setClients(data || []);
  };

  const fetchSites = async () => {
    const { data, error } = await supabase.from("sites").select("id, site_name, client_id");
    if (error) {
      console.error("Error fetching sites:", error);
    }
    setSites(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase.from("schedules").insert([{
        ...formData,
        created_by: user?.id,
        status: "scheduled",
      }]);

      if (error) throw error;

      toast.success("Schedule created successfully");
      setOpen(false);
      setFormData({
        staff_id: "",
        client_id: "",
        site_id: "",
        shift_date: format(new Date(), "yyyy-MM-dd"),
        shift_start: "06:00",
        shift_end: "18:00",
        shift_type: "day",
        notes: "",
      });
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateScheduleStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("schedules")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Schedule ${status}`);
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <LoadingPulse />;

  const getStatusBadge = (status: string) => {
    const variants: any = {
      scheduled: "secondary",
      active: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getShiftTypeBadge = (type: string) => {
    return <Badge variant="outline">{type}</Badge>;
  };

  const weekStart = startOfWeek(selectedWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const scheduledShifts = schedules.filter(s => s.status === 'scheduled').length;
  const activeShifts = schedules.filter(s => s.status === 'active').length;
  const completedShifts = schedules.filter(s => s.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          icon={Calendar}
          title="Staff Scheduling"
          description="Manage staff deployments and shift schedules"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
              <DialogDescription>
                Assign staff to shifts at client sites
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Staff Member *</Label>
                  <Select
                    required
                    value={formData.staff_id}
                    onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name} ({member.staff_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Shift Date *</Label>
                  <Input
                    type="date"
                    required
                    value={formData.shift_date}
                    onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shift Start *</Label>
                  <Input
                    type="time"
                    required
                    value={formData.shift_start}
                    onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shift End *</Label>
                  <Input
                    type="time"
                    required
                    value={formData.shift_end}
                    onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shift Type *</Label>
                  <Select
                    value={formData.shift_type}
                    onValueChange={(value) => setFormData({ ...formData, shift_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day Shift</SelectItem>
                      <SelectItem value="night">Night Shift</SelectItem>
                      <SelectItem value="split">Split Shift</SelectItem>
                      <SelectItem value="overtime">Overtime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Client *</Label>
                  <Select
                    required
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value, site_id: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.legal_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Site *</Label>
                  <Select
                    required
                    value={formData.site_id}
                    onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                    disabled={!formData.client_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      {sites
                        .filter((site) => site.client_id === formData.client_id)
                        .map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.site_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special instructions or notes"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Schedule</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledShifts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeShifts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedShifts}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                Week of {format(weekStart, "MMM dd, yyyy")}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
              >
                Previous Week
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(new Date())}
              >
                Current Week
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
              >
                Next Week
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Date</TableHead>
                  <TableHead className="min-w-[150px]">Staff</TableHead>
                  <TableHead className="min-w-[150px]">Client</TableHead>
                  <TableHead className="min-w-[150px]">Site</TableHead>
                  <TableHead className="min-w-[140px]">Shift Time</TableHead>
                  <TableHead className="min-w-[100px]">Type</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No schedules found for this week
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        {format(new Date(schedule.shift_date), "EEE, MMM dd")}
                      </TableCell>
                      <TableCell>{schedule.staff?.full_name || "N/A"}</TableCell>
                      <TableCell>{schedule.clients?.legal_name || "N/A"}</TableCell>
                      <TableCell>{schedule.sites?.site_name || "N/A"}</TableCell>
                      <TableCell>
                        {schedule.shift_start} - {schedule.shift_end}
                      </TableCell>
                      <TableCell>{getShiftTypeBadge(schedule.shift_type)}</TableCell>
                      <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                      <TableCell>
                        <Select
                          value={schedule.status}
                          onValueChange={(value) => updateScheduleStatus(schedule.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}