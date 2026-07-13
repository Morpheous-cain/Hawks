import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Users, Plus, Search, Filter, Download, UserCheck, UserX, UserCog, AlertTriangle, Wallet, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StaffActionDialog from "@/components/StaffActionDialog";
import PayrollManagement from "@/components/staff/PayrollManagement";
import { StaffCreateDialog } from "@/components/staff/StaffCreateDialog";
import { UserAccountCreateDialog } from "@/components/staff/UserAccountCreateDialog";
import { OrganizationalChart } from "@/components/staff/OrganizationalChart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const StaffManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("staff");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [userAccountDialogOpen, setUserAccountDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [actionType, setActionType] = useState<string>("");
  const [staffData, setStaffData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryStats, setSummaryStats] = useState({
    active: 0,
    offDuty: 0,
    onLeave: 0,
    suspended: 0,
  });

  const fetchStaff = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) throw error;

      const staff = data || [];
      setStaffData(staff);

      // Calculate stats from real data
      setSummaryStats({
        active: staff.filter((s) => s.status === "active").length,
        offDuty: staff.filter((s) => s.status === "off_duty").length,
        onLeave: staff.filter((s) => s.status === "on_leave").length,
        suspended: staff.filter((s) => s.status === "suspended").length,
      });
    } catch (error: any) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();

    const channel = supabase
      .channel("staff-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, () => {
        fetchStaff();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStaff]);

  const statusConfig: Record<string, { label: string; color: string; textColor: string }> = {
    active: { label: "Active", color: "bg-alert-normal", textColor: "text-primary-foreground" },
    "off-duty": { label: "Off Duty", color: "bg-muted", textColor: "text-muted-foreground" },
    off_duty: { label: "Off Duty", color: "bg-muted", textColor: "text-muted-foreground" },
    "on-leave": { label: "On Leave", color: "bg-primary", textColor: "text-primary-foreground" },
    on_leave: { label: "On Leave", color: "bg-primary", textColor: "text-primary-foreground" },
    suspended: { label: "Suspended", color: "bg-alert-caution", textColor: "text-primary-foreground" },
    terminated: { label: "Terminated", color: "bg-alert-critical", textColor: "text-primary-foreground" },
    transferred: { label: "Transferred", color: "bg-accent", textColor: "text-accent-foreground" },
    resigned: { label: "Resigned", color: "bg-alert-caution", textColor: "text-primary-foreground" },
    deserted: { label: "Deserted (AWOL)", color: "bg-alert-critical", textColor: "text-primary-foreground" },
  };

  const statsCards = [
    { label: "Total Active", value: summaryStats.active, icon: UserCheck, color: "text-alert-normal" },
    { label: "Off Duty", value: summaryStats.offDuty, icon: UserX, color: "text-foreground/70" },
    { label: "On Leave", value: summaryStats.onLeave, icon: UserCog, color: "text-primary" },
    { label: "Suspended", value: summaryStats.suspended, icon: AlertTriangle, color: "text-alert-caution" },
  ];

  const handleAction = (staff: any, action: string) => {
    setSelectedStaff(staff);
    if (action === "create-account") {
      setUserAccountDialogOpen(true);
    } else {
      setActionType(action);
      setActionDialogOpen(true);
    }
  };

  const filteredStaff = staffData.filter((staff) => {
    const matchesSearch =
      (staff.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.staff_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.assigned_site || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      staff.status === statusFilter ||
      staff.status === statusFilter.replace("-", "_");
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    if (staffData.length === 0) {
      toast.info("No staff data to export");
      return;
    }
    const csv = [
      ["Staff ID", "Name", "ID Number", "Phone", "Site", "Status", "Date Employed"].join(","),
      ...staffData.map((s) =>
        [s.staff_id, s.full_name, s.id_number, s.phone, s.assigned_site, s.status, s.date_employed].join(",")
      ),
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Staff report exported");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management & Responsibilities"
        description="Control Room personnel tracking, deployment management, and payroll - Black Hawk Operations Console"
        icon={Users}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="staff" className="gap-2">
            <Users className="w-4 h-4" />
            Staff Directory
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <Wallet className="w-4 h-4" />
            Payroll
          </TabsTrigger>
          <TabsTrigger value="org-chart" className="gap-2">
            <Building2 className="w-4 h-4" />
            Org Structure
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6 mt-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statsCards.map((stat, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </Card>
            ))}
          </div>

          {/* Control Panel */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, ID, or site..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="off-duty">Off Duty</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="transferred">Transferred</SelectItem>
                    <SelectItem value="resigned">Resigned</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="deserted">Deserted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="outline" className="gap-2 flex-1 md:flex-none" onClick={handleExport}>
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
                <Button
                  className="gap-2 bg-gradient-command flex-1 md:flex-none"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  New Officer
                </Button>
              </div>
            </div>
          </Card>

          {/* Staff Table */}
          <Card>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading staff...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((staff) => {
                      const config = statusConfig[staff.status] || statusConfig.active;
                      return (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">{staff.staff_id || "—"}</TableCell>
                          <TableCell>{staff.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">{staff.id_number || "—"}</TableCell>
                          <TableCell className="text-sm">
                            <div>{staff.phone || "—"}</div>
                            {staff.phone2 && <div className="text-muted-foreground">{staff.phone2}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{staff.assigned_site || "Unassigned"}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${config.color} ${config.textColor}`}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Select onValueChange={(value) => handleAction(staff, value)}>
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Action..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="create-account">Create Portal Account</SelectItem>
                                <SelectItem value="off-duty">Mark Off Duty</SelectItem>
                                <SelectItem value="leave">Grant Leave</SelectItem>
                                <SelectItem value="transfer">Transfer</SelectItem>
                                <SelectItem value="suspend">Suspend</SelectItem>
                                <SelectItem value="terminate">Terminate</SelectItem>
                                <SelectItem value="reinstate">Reinstate</SelectItem>
                                <SelectItem value="view-history">View History</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery || statusFilter !== "all" ? "No staff match your filters" : "No staff records found. Click 'New Officer' to add staff."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>

          <StaffActionDialog
            open={actionDialogOpen}
            onOpenChange={setActionDialogOpen}
            staff={selectedStaff}
            actionType={actionType}
          />

          <StaffCreateDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSuccess={() => {
              setCreateDialogOpen(false);
              fetchStaff();
            }}
          />

          <UserAccountCreateDialog
            open={userAccountDialogOpen}
            onOpenChange={setUserAccountDialogOpen}
            staff={selectedStaff}
            onSuccess={() => {}}
          />

          <Card className="p-4 bg-muted/50 border-l-4 border-l-primary">
            <h3 className="font-semibold text-sm mb-2 text-foreground">Data Governance Principles</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ All entries must be <strong>Accurate, Timely, Accountable, and Auditable</strong></li>
              <li>✓ Every status change requires supporting documentation</li>
              <li>✓ Control Room Operator enters data → Supervisor verifies → COO approves</li>
              <li>✓ No deletions allowed - incorrect entries marked "VOID" with audit trail</li>
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="mt-6">
          <PayrollManagement />
        </TabsContent>

        <TabsContent value="org-chart" className="mt-6">
          <OrganizationalChart />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffManagement;
