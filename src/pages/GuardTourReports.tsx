import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import LoadingPulse from "@/components/LoadingPulse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck, Download, Shield, Users, AlertTriangle, Clock,
  MapPin, Eye, Activity, CheckCircle2, XCircle, Timer, Bell,
  TrendingUp, UserCheck, Radio, RefreshCw, Search, Wifi, WifiOff
} from "lucide-react";
import { format, startOfDay, endOfDay, differenceInMinutes, subHours } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function GuardTourReports() {
  const [loading, setLoading] = useState(true);
  const [patrols, setPatrols] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedSite, setSelectedSite] = useState("all");
  const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
  const [searchTerm, setSearchTerm] = useState("");
  const [isLive, setIsLive] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchPatrols(), fetchClients(), fetchSites(),
      fetchCheckpoints(), fetchStaff(), fetchAttendance(), fetchIncidents()
    ]);
    setLastRefresh(new Date());
    setLoading(false);
  }, [dateFilter, selectedClient, selectedSite]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('guard-monitoring')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patrols' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patrol_checkpoints' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => fetchData())
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const fetchPatrols = async () => {
    const { data } = await supabase.from("patrols")
      .select("*, staff:supervisor_id(full_name)")
      .gte("start_time", startOfDay(new Date(dateFilter)).toISOString())
      .lte("start_time", endOfDay(new Date(dateFilter)).toISOString())
      .order("start_time", { ascending: false });
    let results = data || [];
    if (selectedClient !== "all") results = results.filter((r: any) => r.client_id === selectedClient);
    if (selectedSite !== "all") results = results.filter((r: any) => r.site_id === selectedSite);
    setPatrols(results);
  };

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, legal_name");
    setClients(data || []);
  };

  const fetchSites = async () => {
    const { data } = await supabase.from("sites").select("id, site_name, client_id");
    setSites(data || []);
  };

  const fetchCheckpoints = async () => {
    const { data } = await supabase.from("patrol_checkpoints")
      .select("*")
      .gte("scanned_at", startOfDay(new Date(dateFilter)).toISOString())
      .lte("scanned_at", endOfDay(new Date(dateFilter)).toISOString())
      .order("scanned_at", { ascending: true });
    setCheckpoints(data || []);
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff")
      .select("id, full_name, employee_id, position, status, phone")
      .in("position", ["Guard", "guard", "Officer", "officer", "Field Officer", "field_officer", "Patrol Officer", "patrol_officer", "Security Guard", "security_guard"])
      .order("full_name");
    setStaff(data || []);
  };

  const fetchAttendance = async () => {
    const { data } = await supabase.from("attendance")
      .select("*, staff:staff_id(full_name, employee_id)")
      .gte("check_in", startOfDay(new Date(dateFilter)).toISOString())
      .lte("check_in", endOfDay(new Date(dateFilter)).toISOString())
      .order("check_in", { ascending: false });
    setAttendance(data || []);
  };

  const fetchIncidents = async () => {
    const { data } = await supabase.from("incidents")
      .select("*")
      .gte("created_at", startOfDay(new Date(dateFilter)).toISOString())
      .lte("created_at", endOfDay(new Date(dateFilter)).toISOString())
      .order("created_at", { ascending: false })
      .limit(20);
    setIncidents(data || []);
  };

  // === Computed Stats ===
  const verifiedCount = patrols.reduce((sum, p) => sum + (p.checkpoints_verified || 0), 0);
  const totalCheckpoints = patrols.reduce((sum, p) => sum + (p.checkpoints_total || 0), 0);
  const complianceRate = totalCheckpoints > 0 ? Math.round((verifiedCount / totalCheckpoints) * 100) : 0;
  const activePatrols = patrols.filter(p => p.status === "active" || p.status === "in_progress");
  const completedPatrols = patrols.filter(p => p.status === "completed");
  const missedCheckpoints = totalCheckpoints - verifiedCount;
  const onDutyGuards = attendance.filter(a => !a.check_out);
  const checkedOutGuards = attendance.filter(a => a.check_out);

  // Late check-ins (more than 15 min after expected)
  const lateCheckIns = attendance.filter(a => {
    if (!a.check_in) return false;
    const checkInTime = new Date(a.check_in);
    const hour = checkInTime.getHours();
    // If checked in after :15 of the hour, consider late
    return checkInTime.getMinutes() > 15 && (hour === 6 || hour === 18 || hour === 7 || hour === 19);
  });

  // Alerts computation
  const alerts: { type: string; severity: string; message: string; time: string }[] = [];
  
  patrols.forEach(p => {
    if (p.status === "active" && p.checkpoints_verified === 0 && p.start_time) {
      const minsSinceStart = differenceInMinutes(new Date(), new Date(p.start_time));
      if (minsSinceStart > 30) {
        alerts.push({
          type: "no_scan",
          severity: "critical",
          message: `${p.staff?.full_name || "Unknown"} - No checkpoint scans for ${minsSinceStart} min (Patrol ${p.patrol_id})`,
          time: format(new Date(p.start_time), "HH:mm")
        });
      }
    }
    if (p.checkpoints_total > 0 && p.checkpoints_verified < p.checkpoints_total && p.status === "completed") {
      alerts.push({
        type: "missed",
        severity: "warning",
        message: `${p.staff?.full_name || "Unknown"} missed ${p.checkpoints_total - p.checkpoints_verified} checkpoints (Patrol ${p.patrol_id})`,
        time: p.end_time ? format(new Date(p.end_time), "HH:mm") : "—"
      });
    }
  });

  if (missedCheckpoints > 5) {
    alerts.push({
      type: "compliance",
      severity: "critical",
      message: `${missedCheckpoints} total checkpoints missed today — compliance at ${complianceRate}%`,
      time: format(new Date(), "HH:mm")
    });
  }

  // PDF Export
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("BLACK HAWK SOC-OS", 14, 20);
    doc.setFontSize(12);
    doc.text("Guard Monitoring System Report", 14, 28);
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(dateFilter), "dd MMMM yyyy")}`, 14, 36);
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, 14, 42);
    doc.text(`Guards On Duty: ${onDutyGuards.length} | Patrols: ${patrols.length} | Compliance: ${complianceRate}%`, 14, 50);

    autoTable(doc, {
      startY: 58,
      head: [["Patrol ID", "Guard/Supervisor", "Start", "End", "Status", "Verified", "Total", "Compliance"]],
      body: patrols.map(p => [
        p.patrol_id || "—",
        p.staff?.full_name || "N/A",
        p.start_time ? format(new Date(p.start_time), "HH:mm") : "—",
        p.end_time ? format(new Date(p.end_time), "HH:mm") : "—",
        p.status || "—",
        String(p.checkpoints_verified || 0),
        String(p.checkpoints_total || 0),
        p.checkpoints_total > 0 ? `${Math.round(((p.checkpoints_verified || 0) / p.checkpoints_total) * 100)}%` : "—"
      ]),
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59] },
    });

    if (checkpoints.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.text("Checkpoint Scan Log", 14, finalY);
      autoTable(doc, {
        startY: finalY + 5,
        head: [["Checkpoint", "Scanned By", "Time", "GPS", "Notes"]],
        body: checkpoints.map(cp => [
          cp.checkpoint_id || "—",
          cp.scanned_by || "—",
          cp.scanned_at ? format(new Date(cp.scanned_at), "HH:mm:ss") : "—",
          cp.gps_coordinates || "—",
          cp.notes || "—",
        ]),
        theme: "grid",
        headStyles: { fillColor: [30, 41, 59] },
      });
    }

    if (alerts.length > 0) {
      const finalY2 = (doc as any).lastAutoTable?.finalY + 15 || 120;
      doc.setFontSize(12);
      doc.text("Alerts & Exceptions", 14, finalY2);
      autoTable(doc, {
        startY: finalY2 + 5,
        head: [["Severity", "Alert", "Time"]],
        body: alerts.map(a => [a.severity.toUpperCase(), a.message, a.time]),
        theme: "grid",
        headStyles: { fillColor: [180, 50, 50] },
      });
    }

    doc.save(`Guard_Monitoring_Report_${dateFilter}.pdf`);
    toast.success("PDF report generated");
  };

  if (loading) return <LoadingPulse />;

  const filteredStaff = staff.filter(s =>
    !searchTerm || s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader icon={ClipboardCheck} title="Guard Monitoring System" description="Live guard monitoring, patrol verification & compliance tracking" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-card border border-border">
            {isLive ? <Wifi className="w-3 h-3 text-alert-normal animate-pulse" /> : <WifiOff className="w-3 h-3 text-destructive" />}
            <span className={isLive ? "text-alert-normal" : "text-destructive"}>{isLive ? "LIVE" : "OFFLINE"}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
          <Button size="sm" onClick={generatePDF}>
            <Download className="h-4 w-4 mr-1" />Export PDF
          </Button>
        </div>
      </div>

      {/* Live Status Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        <StatusCard icon={Users} label="Guards On Duty" value={onDutyGuards.length} color="text-primary" />
        <StatusCard icon={Activity} label="Active Patrols" value={activePatrols.length} color="text-alert-normal" />
        <StatusCard icon={CheckCircle2} label="Completed" value={completedPatrols.length} color="text-primary" />
        <StatusCard icon={MapPin} label="Checkpoints Hit" value={verifiedCount} color="text-alert-normal" />
        <StatusCard icon={XCircle} label="Missed" value={missedCheckpoints} color={missedCheckpoints > 0 ? "text-destructive" : "text-muted-foreground"} />
        <StatusCard icon={Timer} label="Late Check-Ins" value={lateCheckIns.length} color={lateCheckIns.length > 0 ? "text-alert-caution" : "text-muted-foreground"} />
        <StatusCard icon={AlertTriangle} label="Alerts" value={alerts.length} color={alerts.length > 0 ? "text-destructive" : "text-muted-foreground"} />
        <Card className="border-border bg-card/80">
          <CardContent className="p-3 flex flex-col items-center justify-center h-full">
            <TrendingUp className={`w-5 h-5 mb-1 ${complianceRate >= 90 ? "text-alert-normal" : complianceRate >= 70 ? "text-alert-caution" : "text-destructive"}`} />
            <div className={`text-xl font-bold ${complianceRate >= 90 ? "text-alert-normal" : complianceRate >= 70 ? "text-alert-caution" : "text-destructive"}`}>{complianceRate}%</div>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Progress */}
      <Card className="border-border bg-card/80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Overall Checkpoint Compliance</span>
            <span className="text-sm text-muted-foreground">{verifiedCount} / {totalCheckpoints} checkpoints verified</span>
          </div>
          <Progress value={complianceRate} className="h-3" />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-border bg-card/80">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search guards..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 w-52" />
            </div>
            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
            <Select value={selectedClient} onValueChange={v => { setSelectedClient(v); setSelectedSite("all"); }}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Clients</SelectItem>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.legal_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Sites</SelectItem>{sites.filter(s => selectedClient === "all" || s.client_id === selectedClient).map(s => <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-auto">Last refresh: {format(lastRefresh, "HH:mm:ss")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="live" className="gap-1"><Eye className="w-3.5 h-3.5" />Live Status</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1"><UserCheck className="w-3.5 h-3.5" />Attendance</TabsTrigger>
          <TabsTrigger value="patrols" className="gap-1"><Radio className="w-3.5 h-3.5" />Patrols</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1"><Bell className="w-3.5 h-3.5" />Alerts <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">{alerts.length}</Badge></TabsTrigger>
          <TabsTrigger value="performance" className="gap-1"><TrendingUp className="w-3.5 h-3.5" />Performance</TabsTrigger>
        </TabsList>

        {/* === LIVE STATUS TAB === */}
        <TabsContent value="live" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* On-Duty Guards */}
            <Card className="lg:col-span-2 border-border bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />Guards Currently On Duty ({onDutyGuards.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {onDutyGuards.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No guards currently on duty</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {onDutyGuards.map(a => {
                      const minutesOnDuty = differenceInMinutes(new Date(), new Date(a.check_in));
                      const hours = Math.floor(minutesOnDuty / 60);
                      const mins = minutesOnDuty % 60;
                      return (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-alert-normal animate-pulse" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{a.staff?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{a.site} • {a.shift_type || "Standard"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-primary">{hours}h {mins}m</p>
                            <p className="text-[10px] text-muted-foreground">on duty</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Alerts Feed */}
            <Card className="border-border bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-alert-caution" />Live Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-8 h-8 text-alert-normal mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">All clear — no alerts</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {alerts.map((alert, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${alert.severity === "critical" ? "border-destructive/50 bg-destructive/10" : "border-alert-caution/30 bg-alert-caution/5"}`}>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${alert.severity === "critical" ? "text-destructive" : "text-alert-caution"}`} />
                          <div>
                            <p className="text-xs font-medium">{alert.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{alert.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Patrols Quick View */}
          <Card className="border-border bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-alert-normal" />Active Patrols in Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activePatrols.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No active patrols right now</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patrol ID</TableHead>
                      <TableHead>Guard/Supervisor</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Checkpoints</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePatrols.map(p => {
                      const mins = p.start_time ? differenceInMinutes(new Date(), new Date(p.start_time)) : 0;
                      const prog = p.checkpoints_total > 0 ? Math.round(((p.checkpoints_verified || 0) / p.checkpoints_total) * 100) : 0;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs">{p.patrol_id}</TableCell>
                          <TableCell className="font-medium">{p.staff?.full_name || "N/A"}</TableCell>
                          <TableCell>{p.start_time ? format(new Date(p.start_time), "HH:mm") : "—"}</TableCell>
                          <TableCell>{Math.floor(mins / 60)}h {mins % 60}m</TableCell>
                          <TableCell>{p.checkpoints_verified || 0}/{p.checkpoints_total || 0}</TableCell>
                          <TableCell><Progress value={prog} className="h-2 w-20" /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ATTENDANCE TAB === */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <StatusCard icon={UserCheck} label="Checked In" value={attendance.length} color="text-primary" />
            <StatusCard icon={Users} label="On Duty Now" value={onDutyGuards.length} color="text-alert-normal" />
            <StatusCard icon={Clock} label="Checked Out" value={checkedOutGuards.length} color="text-muted-foreground" />
            <StatusCard icon={Timer} label="Late Arrivals" value={lateCheckIns.length} color={lateCheckIns.length > 0 ? "text-alert-caution" : "text-muted-foreground"} />
          </div>

          <Card className="border-border bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Attendance Log — {format(new Date(dateFilter), "dd MMM yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No attendance records for this date</TableCell></TableRow>
                  ) : attendance.map(a => {
                    const duration = a.check_out
                      ? differenceInMinutes(new Date(a.check_out), new Date(a.check_in))
                      : differenceInMinutes(new Date(), new Date(a.check_in));
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.staff?.full_name || "Unknown"}</TableCell>
                        <TableCell>{a.site}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{a.shift_type || "Standard"}</Badge></TableCell>
                        <TableCell>{format(new Date(a.check_in), "HH:mm")}</TableCell>
                        <TableCell>{a.check_out ? format(new Date(a.check_out), "HH:mm") : <Badge className="bg-alert-normal/20 text-alert-normal border-alert-normal/30 text-[10px]">On Duty</Badge>}</TableCell>
                        <TableCell>{Math.floor(duration / 60)}h {duration % 60}m</TableCell>
                        <TableCell>
                          <Badge variant={a.status === "present" ? "default" : "secondary"} className="text-xs">
                            {a.status || "present"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === PATROLS TAB === */}
        <TabsContent value="patrols" className="space-y-4">
          <Card className="border-border bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">All Patrols — {format(new Date(dateFilter), "dd MMM yyyy")}</CardTitle>
              <CardDescription>{patrols.length} patrols recorded</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patrol ID</TableHead>
                    <TableHead>Guard/Supervisor</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Checkpoints</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patrols.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No patrols found</TableCell></TableRow>
                  ) : patrols.map(p => {
                    const rate = p.checkpoints_total > 0 ? Math.round(((p.checkpoints_verified || 0) / p.checkpoints_total) * 100) : 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.patrol_id}</TableCell>
                        <TableCell className="font-medium">{p.staff?.full_name || "N/A"}</TableCell>
                        <TableCell>{p.start_time ? format(new Date(p.start_time), "HH:mm") : "—"}</TableCell>
                        <TableCell>{p.end_time ? format(new Date(p.end_time), "HH:mm") : "—"}</TableCell>
                        <TableCell>{p.checkpoints_verified || 0}/{p.checkpoints_total || 0}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${rate >= 90 ? "text-alert-normal" : rate >= 70 ? "text-alert-caution" : "text-destructive"}`}>
                            {p.checkpoints_total > 0 ? `${rate}%` : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === "completed" ? "default" : p.status === "active" || p.status === "in_progress" ? "outline" : "secondary"}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Checkpoint Scan Log */}
          {checkpoints.length > 0 && (
            <Card className="border-border bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />Checkpoint Scan Log
                </CardTitle>
                <CardDescription>{checkpoints.length} scans recorded</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Checkpoint</TableHead>
                      <TableHead>Scanned By</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>GPS</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkpoints.map(cp => (
                      <TableRow key={cp.id}>
                        <TableCell className="font-mono text-xs">{cp.checkpoint_id}</TableCell>
                        <TableCell>{cp.scanned_by}</TableCell>
                        <TableCell>{cp.scanned_at ? format(new Date(cp.scanned_at), "HH:mm:ss") : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{cp.gps_coordinates || "—"}</TableCell>
                        <TableCell className="text-xs">{cp.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === ALERTS TAB === */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <StatusCard icon={AlertTriangle} label="Critical Alerts" value={alerts.filter(a => a.severity === "critical").length} color="text-destructive" />
            <StatusCard icon={Bell} label="Warnings" value={alerts.filter(a => a.severity === "warning").length} color="text-alert-caution" />
            <StatusCard icon={CheckCircle2} label="Incidents Today" value={incidents.length} color="text-primary" />
          </div>

          <Card className="border-border bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Active Alerts & Exceptions</CardTitle>
              <CardDescription>Auto-generated from patrol and attendance data</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-alert-normal mx-auto mb-3" />
                  <h3 className="font-medium text-foreground">All Clear</h3>
                  <p className="text-sm text-muted-foreground mt-1">No alerts or exceptions for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, i) => (
                    <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${
                      alert.severity === "critical"
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-alert-caution/40 bg-alert-caution/5"
                    }`}>
                      <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${alert.severity === "critical" ? "text-destructive" : "text-alert-caution"}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"} className="text-[10px]">
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                        </div>
                        <p className="text-sm mt-1">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Incidents */}
          {incidents.length > 0 && (
            <Card className="border-border bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Incidents Reported Today</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map(inc => (
                      <TableRow key={inc.id}>
                        <TableCell className="font-mono text-xs">{inc.incident_number || inc.id.slice(0, 8)}</TableCell>
                        <TableCell>{inc.incident_type || "General"}</TableCell>
                        <TableCell>
                          <Badge variant={inc.priority === "critical" ? "destructive" : "secondary"}>{inc.priority || "medium"}</Badge>
                        </TableCell>
                        <TableCell><Badge variant="outline">{inc.status}</Badge></TableCell>
                        <TableCell>{inc.created_at ? format(new Date(inc.created_at), "HH:mm") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === PERFORMANCE TAB === */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <StatusCard icon={TrendingUp} label="Compliance Rate" value={`${complianceRate}%`} color={complianceRate >= 90 ? "text-alert-normal" : complianceRate >= 70 ? "text-alert-caution" : "text-destructive"} />
            <StatusCard icon={CheckCircle2} label="Patrols Completed" value={completedPatrols.length} color="text-primary" />
            <StatusCard icon={MapPin} label="Total Scans" value={checkpoints.length} color="text-alert-normal" />
            <StatusCard icon={XCircle} label="Missed Checkpoints" value={missedCheckpoints} color={missedCheckpoints > 0 ? "text-destructive" : "text-alert-normal"} />
          </div>

          {/* Per-Guard Performance Table */}
          <Card className="border-border bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Guard Performance Summary</CardTitle>
              <CardDescription>Individual guard patrol and checkpoint performance for {format(new Date(dateFilter), "dd MMM yyyy")}</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Aggregate patrol data by guard
                const guardMap = new Map<string, { name: string; patrols: number; verified: number; total: number; completed: number }>();
                patrols.forEach(p => {
                  const name = p.staff?.full_name || "Unknown";
                  const entry = guardMap.get(name) || { name, patrols: 0, verified: 0, total: 0, completed: 0 };
                  entry.patrols++;
                  entry.verified += p.checkpoints_verified || 0;
                  entry.total += p.checkpoints_total || 0;
                  if (p.status === "completed") entry.completed++;
                  guardMap.set(name, entry);
                });
                const guards = Array.from(guardMap.values()).sort((a, b) => {
                  const rateA = a.total > 0 ? a.verified / a.total : 0;
                  const rateB = b.total > 0 ? b.verified / b.total : 0;
                  return rateB - rateA;
                });

                if (guards.length === 0) {
                  return <p className="text-muted-foreground text-center py-8">No patrol data to analyze</p>;
                }

                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Guard Name</TableHead>
                        <TableHead>Patrols</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Checkpoints Hit</TableHead>
                        <TableHead>Compliance</TableHead>
                        <TableHead>Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guards.map((g, idx) => {
                        const rate = g.total > 0 ? Math.round((g.verified / g.total) * 100) : 0;
                        const rating = rate >= 95 ? "Excellent" : rate >= 85 ? "Good" : rate >= 70 ? "Fair" : "Poor";
                        const ratingColor = rate >= 95 ? "text-alert-normal" : rate >= 85 ? "text-primary" : rate >= 70 ? "text-alert-caution" : "text-destructive";
                        return (
                          <TableRow key={g.name}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium">{g.name}</TableCell>
                            <TableCell>{g.patrols}</TableCell>
                            <TableCell>{g.completed}</TableCell>
                            <TableCell>{g.verified}/{g.total}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={rate} className="h-2 w-16" />
                                <span className={`text-xs font-medium ${ratingColor}`}>{rate}%</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className={`text-xs ${ratingColor}`}>{rating}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Reusable compact status card
function StatusCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card className="border-border bg-card/80">
      <CardContent className="p-3 flex flex-col items-center justify-center text-center">
        <Icon className={`w-5 h-5 mb-1 ${color}`} />
        <div className={`text-xl font-bold ${color}`}>{value}</div>
        <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}
