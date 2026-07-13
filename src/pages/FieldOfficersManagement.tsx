import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, Plus, Search, Filter, UserPlus, MapPin, Route, 
  Shield, Wrench, Dog, Car, Radio, Calendar, Truck,
  Eye, Edit, Trash2, MoreVertical, CheckCircle, XCircle,
  Building2, Clock
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FieldOfficer {
  id: string;
  user_id: string;
  staff_id: string | null;
  officer_code: string;
  role: string;
  status: string;
  responsibilities: string[];
  device_id: string | null;
  last_login: string | null;
  notes: string | null;
  created_at: string;
  profiles?: { full_name: string; email: string; phone: string };
  staff?: { full_name: string; position: string; current_site: string };
  site_assignments?: any[];
  patrol_assignments?: any[];
}

const roleOptions = [
  { value: "guard", label: "Guard", icon: Shield },
  { value: "patrol_officer", label: "Patrol Officer", icon: Route },
  { value: "response_officer", label: "Response Officer", icon: Radio },
  { value: "supervisor", label: "Supervisor", icon: Users },
  { value: "technician", label: "Technician", icon: Wrench },
  { value: "k9_handler", label: "K9 Handler", icon: Dog },
  { value: "escort_officer", label: "Escort Officer", icon: Car },
  { value: "investigator", label: "Investigator", icon: Eye },
  { value: "event_guard", label: "Event Guard", icon: Calendar },
  { value: "rider", label: "Rider", icon: Truck },
  { value: "driver", label: "Driver", icon: Car },
  { value: "qrf_team", label: "QRF Team", icon: Shield },
];

const responsibilityOptions = [
  { value: "incident_reporting", label: "Incident Reporting" },
  { value: "patrol_scanning", label: "Patrol Scanning" },
  { value: "attendance", label: "Attendance" },
  { value: "sos_panic", label: "SOS/Panic" },
  { value: "dispatch_handling", label: "Dispatch Handling" },
  { value: "bodycam_recording", label: "Body Cam Recording" },
  { value: "k9_patrol", label: "K9 Patrol" },
  { value: "escort_duty", label: "Escort Duty" },
  { value: "investigation", label: "Investigation" },
  { value: "event_security", label: "Event Security" },
  { value: "delivery", label: "Delivery" },
  { value: "technical_maintenance", label: "Technical Maintenance" },
];

const statusOptions = [
  { value: "active", label: "Active", color: "bg-green-500" },
  { value: "inactive", label: "Inactive", color: "bg-gray-500" },
  { value: "on_leave", label: "On Leave", color: "bg-yellow-500" },
  { value: "suspended", label: "Suspended", color: "bg-red-500" },
  { value: "terminated", label: "Terminated", color: "bg-red-700" },
];

const FieldOfficersManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignSitesDialogOpen, setIsAssignSitesDialogOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<FieldOfficer | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    user_id: "",
    staff_id: "",
    role: "guard",
    status: "active",
    responsibilities: [] as string[],
    notes: "",
  });

  // Fetch field officers from staff table with role-based data
  const { data: officers = [], isLoading } = useQuery({
    queryKey: ["field-officers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("full_name");
      
      if (error) throw error;
      
      // Transform staff to field officers format
      return (data || []).map(staff => ({
        id: staff.id,
        user_id: staff.id,
        staff_id: staff.id,
        officer_code: staff.staff_id || `FO-${staff.id.slice(0, 8)}`,
        role: staff.duty_category || "guard",
        status: staff.status || "active",
        responsibilities: [],
        device_id: null,
        last_login: null,
        notes: null,
        created_at: staff.created_at,
        staff: {
          full_name: staff.full_name,
          position: staff.position,
          current_site: staff.current_site,
        },
      }));
    },
  });

  // Fetch sites for assignment
  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("*, clients(legal_name)")
        .order("site_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch patrols for assignment
  const { data: patrols = [] } = useQuery({
    queryKey: ["patrols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patrols")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch users for selection
  const { data: users = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Create officer mutation
  const createOfficerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const userName = users.find(u => u.id === data.user_id)?.full_name || "New Officer";
      const { error } = await supabase.from("staff").insert([{
        full_name: userName,
        staff_id: `FO-${Date.now()}`,
        duty_category: data.role,
        status: data.status as "active" | "deserted" | "off_duty" | "on_leave" | "resigned" | "suspended" | "terminated" | "transferred",
        date_employed: new Date().toISOString().split('T')[0],
        national_id: "",
        phone: "",
        position: data.role,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-officers"] });
      toast.success("Officer created successfully");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create officer: " + error.message);
    },
  });

  // Update officer mutation
  const updateOfficerMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<typeof formData>) => {
      const updateData: any = {};
      if (data.role) updateData.duty_category = data.role;
      if (data.status) updateData.status = data.status;
      
      const { error } = await supabase
        .from("staff")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-officers"] });
      toast.success("Officer updated successfully");
      setSelectedOfficer(null);
    },
    onError: (error) => {
      toast.error("Failed to update officer: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      user_id: "",
      staff_id: "",
      role: "guard",
      status: "active",
      responsibilities: [],
      notes: "",
    });
  };

  const handleResponsibilityChange = (responsibility: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: checked
        ? [...prev.responsibilities, responsibility]
        : prev.responsibilities.filter(r => r !== responsibility),
    }));
  };

  // Filter officers
  const filteredOfficers = officers.filter(officer => {
    const matchesSearch = 
      officer.staff?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.officer_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || officer.role === filterRole;
    const matchesStatus = filterStatus === "all" || officer.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: string) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption?.icon || Shield;
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Badge variant="outline" className={`${statusOption?.color} text-white border-0`}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Field Officers Management" 
        description="Manage field officers, roles, site assignments, and access control"
        icon={Users}
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{officers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Officers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {officers.filter(o => o.status === "active").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {officers.filter(o => o.status === "on_leave").length}
                  </p>
                  <p className="text-sm text-muted-foreground">On Leave</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sites.length}</p>
                  <p className="text-sm text-muted-foreground">Sites</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="officers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="officers">Officers Directory</TabsTrigger>
            <TabsTrigger value="assignments">Site Assignments</TabsTrigger>
            <TabsTrigger value="roles">Role Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="officers" className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-1 gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search officers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roleOptions.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Officer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Field Officer</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Select User</Label>
                        <Select
                          value={formData.user_id}
                          onValueChange={(v) => setFormData(p => ({ ...p, user_id: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select user..." />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name || user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(v) => setFormData(p => ({ ...p, role: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map(role => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Responsibilities</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {responsibilityOptions.map(resp => (
                          <div key={resp.value} className="flex items-center gap-2">
                            <Checkbox
                              id={resp.value}
                              checked={formData.responsibilities.includes(resp.value)}
                              onCheckedChange={(checked) => 
                                handleResponsibilityChange(resp.value, checked as boolean)
                              }
                            />
                            <Label htmlFor={resp.value} className="text-sm font-normal">
                              {resp.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Additional notes..."
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => createOfficerMutation.mutate(formData)}>
                        Create Officer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Officers Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Officer</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading officers...
                        </TableCell>
                      </TableRow>
                    ) : filteredOfficers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No officers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOfficers.map((officer) => {
                        const RoleIcon = getRoleIcon(officer.role);
                        return (
                          <TableRow key={officer.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                  <RoleIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{officer.staff?.full_name || "Unknown"}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {officer.staff?.position || "Field Officer"}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {officer.officer_code}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {roleOptions.find(r => r.value === officer.role)?.label || officer.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {officer.staff?.current_site || "Unassigned"}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(officer.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedOfficer(officer)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedOfficer(officer);
                                    setIsAssignSitesDialogOpen(true);
                                  }}>
                                    <MapPin className="h-4 w-4 mr-2" />
                                    Assign Sites
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    updateOfficerMutation.mutate({
                                      id: officer.id,
                                      status: officer.status === "active" ? "inactive" : "active",
                                    });
                                  }}>
                                    {officer.status === "active" ? (
                                      <>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Site Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sites.map(site => (
                    <div key={site.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{site.site_name}</p>
                        <p className="text-sm text-muted-foreground">{site.address}</p>
                        <p className="text-xs text-muted-foreground">
                          Client: {site.clients?.legal_name || "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {officers.filter(o => o.staff?.current_site === site.site_name).length} Officers
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${site.client_id || ""}`)}>
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                  {sites.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No sites configured
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roleOptions.map(role => {
                const Icon = role.icon;
                const roleCount = officers.filter(o => o.role === role.value).length;
                return (
                  <Card key={role.value}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{role.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {roleCount} officers
                          </p>
                        </div>
                        <Badge variant="secondary">{roleCount}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Site Assignment Dialog */}
        <Dialog open={isAssignSitesDialogOpen} onOpenChange={setIsAssignSitesDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Assign Sites to {selectedOfficer?.staff?.full_name}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              <div className="space-y-2 p-1">
                {sites.map(site => (
                  <div 
                    key={site.id} 
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer"
                    onClick={() => {
                      if (selectedOfficer) {
                        updateOfficerMutation.mutate({
                          id: selectedOfficer.id,
                          // In a full implementation, this would update site assignments
                        });
                        toast.success(`Assigned to ${site.site_name}`);
                      }
                    }}
                  >
                    <Checkbox 
                      checked={selectedOfficer?.staff?.current_site === site.site_name}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{site.site_name}</p>
                      <p className="text-sm text-muted-foreground">{site.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAssignSitesDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                toast.success("Assignments saved");
                setIsAssignSitesDialogOpen(false);
              }}>
                Save Assignments
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FieldOfficersManagement;
