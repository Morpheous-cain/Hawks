import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useIncidents, INCIDENT_TRANSITIONS, type SopStep } from "@/hooks/useIncidents";
import PageHeader from "@/components/PageHeader";
import LoadingPulse from "@/components/LoadingPulse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus, AlertCircle, CheckCircle, Clock, ShieldAlert, AlertTriangle,
  ArrowUpCircle, MessageSquarePlus, Activity, Radio, Sparkles, FileDown, Paperclip, Upload, ListChecks,
} from "lucide-react";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { format } from "date-fns";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SEV_TONE: Record<string, "default"|"secondary"|"destructive"|"outline"> = {
  critical: "destructive", high: "destructive", medium: "default", low: "secondary",
};
const STATUS_TONE: Record<string, string> = {
  open: "bg-red-500/15 text-red-600",
  investigating: "bg-amber-500/15 text-amber-600",
  in_progress: "bg-amber-500/15 text-amber-600",
  resolved: "bg-emerald-500/15 text-emerald-600",
  closed: "bg-slate-500/15 text-slate-600",
};
const ESC_LEVELS = [
  { level: 1, role: "supervisor", label: "Supervisor" },
  { level: 2, role: "operations_manager", label: "Operations Manager" },
  { level: 3, role: "coo", label: "COO" },
  { level: 4, role: "ceo", label: "CEO" },
];

function SlaRing({ incident }: { incident: any }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!incident?.sla_deadline || !incident?.sla_target_minutes) return null;
  const deadline = new Date(incident.sla_deadline).getTime();
  const targetMs = incident.sla_target_minutes * 60 * 1000;
  const remaining = deadline - now;
  const pct = Math.max(0, Math.min(100, (remaining / targetMs) * 100));
  const breached = remaining <= 0 || incident.sla_breached;
  const tone = breached ? "text-destructive" : pct < 25 ? "text-destructive" : pct < 50 ? "text-amber-500" : "text-emerald-500";
  const mins = Math.floor(Math.abs(remaining) / 60000);
  const secs = Math.floor((Math.abs(remaining) % 60000) / 1000);
  const label = breached ? `+${mins}m ${secs}s OVER` : `${mins}m ${secs}s left`;
  return (
    <div className={`flex items-center gap-2 ${tone}`}>
      <div className="relative h-10 w-10">
        <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3"/>
          <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={`${(breached ? 100 : 100 - pct) * 0.94} 100`} strokeLinecap="round"/>
        </svg>
        <Clock className="absolute inset-0 m-auto h-4 w-4"/>
      </div>
      <div className="text-xs">
        <div className="font-semibold">SLA {label}</div>
        <div className="text-[10px] opacity-70">Target {incident.sla_target_minutes}m</div>
      </div>
    </div>
  );
}

export default function IncidentManagement() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Local UI-only state. All data + CRUD lives in useIncidents.
  const [active, setActive] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [escOpen, setEscOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");
  const [closeOpen, setCloseOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "", description: "", incident_type: "", severity: "medium",
    location: "", client_id: "", site_id: "", assigned_to: "",
    occurred_at: new Date().toISOString().slice(0, 16),
  });

  // Hook owns: incidents, clients, sites, staff, timeline, escalations,
  // evidence, realtime subscriptions, and every write action.
  const inc = useIncidents(active?.id ?? null);
  const {
    incidents, clients, sites, staff, timeline, escalations, evidence, loading,
    loadDetail, createIncident, updateStatus, addNote: addNoteAction,
    escalate: escalateAction, toggleSopStep, uploadEvidence, runAiSummary: runAiSummaryAction,
  } = inc;

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Reload per-incident detail when active selection changes.
  useEffect(() => { if (active?.id) loadDetail(active.id); }, [active?.id, loadDetail]);

  // Keep `active` in sync with the latest incidents list (so SOP / status
  // updates from realtime flow through into the open detail panel).
  useEffect(() => {
    if (!active) return;
    const fresh = incidents.find((i) => i.id === active.id);
    if (fresh && fresh.updated_at !== active.updated_at) setActive(fresh);
  }, [incidents, active]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await createIncident(formData, user?.id);
    if (ok) {
      setOpen(false);
      setFormData({ title:"", description:"", incident_type:"", severity:"medium", location:"", client_id:"", site_id:"", assigned_to:"", occurred_at:new Date().toISOString().slice(0,16) });
    }
  };

  const updateIncidentStatus = (id: string, status: string, currentStatus?: string) =>
    updateStatus(id, status, { userId: user?.id, currentStatus });

  const addNote = async () => {
    if (!active) return;
    const ok = await addNoteAction(active.id, noteText, user?.id);
    if (ok) { setNoteText(""); setNoteOpen(false); }
  };

  const escalate = async (level: number, role: string, reason: string) => {
    if (!active) return;
    const ok = await escalateAction(active.id, level, role, reason);
    if (ok) setEscOpen(false);
  };

  const toggleStep = async (idx: number) => {
    if (!active) return;
    const steps = await toggleSopStep(active, idx, user?.id);
    if (steps) setActive({ ...active, steps_completed: steps });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!active || !files || files.length === 0) return;
    await uploadEvidence(active.id, files, user?.id);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runAiSummary = async () => {
    if (!active) return;
    setAiBusy(true);
    const res = await runAiSummaryAction(active.id);
    if (res) setActive({ ...active, ai_summary: res.summary, ai_summary_at: res.at });
    setAiBusy(false);
  };



  // ---- PDF export ----
  const exportPdf = () => {
    if (!active) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Incident Dossier · ${active.incident_number}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`${active.title}`, 14, 26);
    doc.text(`Type: ${active.incident_type}  |  Severity: ${active.severity}  |  Status: ${active.status}`, 14, 32);
    doc.text(`Location: ${active.location}  |  Occurred: ${new Date(active.occurred_at).toLocaleString()}`, 14, 38);
    doc.text(`Client: ${active.clients?.legal_name || "N/A"}  |  Site: ${active.sites?.site_name || "N/A"}`, 14, 44);
    doc.text(`Assigned: ${active.staff?.full_name || "Unassigned"}`, 14, 50);
    if (active.sla_target_minutes) doc.text(`SLA: ${active.sla_target_minutes}m · ${active.sla_breached ? "BREACHED" : "within target"}`, 14, 56);

    let y = 64;
    if (active.ai_summary) {
      doc.setFontSize(11); doc.text("Executive Brief", 14, y); y += 5;
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(active.ai_summary, 180);
      doc.text(lines, 14, y); y += lines.length * 4 + 4;
    }

    const steps: SopStep[] = Array.isArray(active.steps_completed) ? active.steps_completed : [];
    if (steps.length) {
      autoTable(doc, { startY: y, head: [["#", "SOP Step", "Status"]], body: steps.map(s => [s.order, s.action, s.completed ? "✓ Done" : "Pending"]) });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    if (timeline.length) {
      autoTable(doc, { startY: y, head: [["When", "Event", "Note"]],
        body: [...timeline].reverse().map(t => [new Date(t.event_at).toLocaleString(), t.event_type, t.note || ""]) });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    if (escalations.length) {
      autoTable(doc, { startY: y, head: [["Level", "Role", "Ack", "Reason"]],
        body: escalations.map(e => [`L${e.level}`, e.escalated_to_role, e.acknowledged ? "✓" : "—", e.reason || ""]) });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    if (evidence.length) {
      autoTable(doc, { startY: y, head: [["Type", "Title", "Collected"]],
        body: evidence.map(e => [e.evidence_type, e.title, new Date(e.collected_at).toLocaleString()]) });
    }
    doc.save(`${active.incident_number}-dossier.pdf`);
  };

  if (loading) return <LoadingPulse />;

  const getSeverityBadge = (severity: string) => (<Badge variant={SEV_TONE[severity] || "default"}>{severity}</Badge>);
  const getStatusBadge = (status: string) => {
    const icons: any = { open: Clock, investigating: AlertCircle, in_progress: AlertCircle, resolved: CheckCircle, closed: CheckCircle };
    const Icon = icons[status] || Clock;
    return (<Badge variant="secondary"><Icon className="h-3 w-3 mr-1" />{status.replace("_"," ")}</Badge>);
  };

  const openIncidents = incidents.filter((i) => i.status === "open").length;
  const investigating = incidents.filter((i) => i.status === "investigating" || i.status === "in_progress").length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;
  const critical = incidents.filter((i) => i.severity === "critical" && !["resolved","closed"].includes(i.status)).length;
  const breached = incidents.filter((i) => i.sla_breached).length;

  const liveList = incidents.filter((i) => !["resolved", "closed"].includes(i.status));
  const sopSteps: SopStep[] = active && Array.isArray(active.steps_completed) ? active.steps_completed : [];
  const sopDone = sopSteps.filter(s => s.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <PageHeader icon={ShieldAlert} title="Incident Command Centre"
          description="Unified intake, SOP-driven response, evidence chain, AI brief and SLA tracking — single source of truth for every incident." />
        <Dialog open={open} onOpenChange={setOpen}>
          <RequirePermission module="ops.incidents" level="create">
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Report Incident</Button>
            </DialogTrigger>
          </RequirePermission>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
              <DialogDescription>SOP, SLA deadline and response checklist are auto-applied on submit.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Title *</Label><Input required value={formData.title} onChange={(e)=>setFormData({...formData,title:e.target.value})} placeholder="Brief incident title"/></div>
                <div className="space-y-2"><Label>Incident Type *</Label>
                  <Select required value={formData.incident_type} onValueChange={(v)=>setFormData({...formData,incident_type:v})}>
                    <SelectTrigger><SelectValue placeholder="Select type"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intrusion">Intrusion</SelectItem>
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="vandalism">Vandalism</SelectItem>
                      <SelectItem value="trespassing">Trespassing</SelectItem>
                      <SelectItem value="fire">Fire</SelectItem>
                      <SelectItem value="medical">Medical Emergency</SelectItem>
                      <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                      <SelectItem value="alarm">Alarm Activation</SelectItem>
                      <SelectItem value="armed_robbery">Armed Robbery</SelectItem>
                      <SelectItem value="assault">Assault</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Severity *</Label>
                  <Select value={formData.severity} onValueChange={(v)=>setFormData({...formData,severity:v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Occurred At *</Label><Input type="datetime-local" required value={formData.occurred_at} onChange={(e)=>setFormData({...formData,occurred_at:e.target.value})}/></div>
                <div className="space-y-2"><Label>Client</Label>
                  <Select value={formData.client_id} onValueChange={(v)=>setFormData({...formData,client_id:v,site_id:""})}>
                    <SelectTrigger><SelectValue placeholder="Select client"/></SelectTrigger>
                    <SelectContent>{clients.map((c)=><SelectItem key={c.id} value={c.id}>{c.legal_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Site</Label>
                  <Select value={formData.site_id} onValueChange={(v)=>setFormData({...formData,site_id:v})} disabled={!formData.client_id}>
                    <SelectTrigger><SelectValue placeholder="Select site"/></SelectTrigger>
                    <SelectContent>{sites.filter((s)=>s.client_id===formData.client_id).map((s)=><SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Location *</Label><Input required value={formData.location} onChange={(e)=>setFormData({...formData,location:e.target.value})} placeholder="Specific location"/></div>
                <div className="space-y-2"><Label>Assign To</Label>
                  <Select value={formData.assigned_to} onValueChange={(v)=>setFormData({...formData,assigned_to:v})}>
                    <SelectTrigger><SelectValue placeholder="Assign staff"/></SelectTrigger>
                    <SelectContent>{staff.map((m)=><SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Description *</Label><Textarea required value={formData.description} onChange={(e)=>setFormData({...formData,description:e.target.value})} rows={4} placeholder="Detailed description of the incident"/></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit">Submit Report</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Open</CardTitle><Clock className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{openIncidents}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">In Progress</CardTitle><Activity className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{investigating}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Critical</CardTitle><AlertTriangle className="h-4 w-4 text-destructive"/></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{critical}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">SLA Breached</CardTitle><Radio className="h-4 w-4 text-destructive"/></CardHeader><CardContent><div className="text-2xl font-bold">{breached}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Resolved</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{resolved}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="command" className="space-y-4">
        <TabsList>
          <TabsTrigger value="command"><ShieldAlert className="h-4 w-4 mr-1.5"/>Live Command</TabsTrigger>
          <TabsTrigger value="register"><AlertCircle className="h-4 w-4 mr-1.5"/>All Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="command">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="p-3 lg:col-span-2">
              <div className="text-sm font-semibold mb-2">Active Incidents</div>
              <div className="space-y-1.5 max-h-[700px] overflow-y-auto">
                {liveList.map((i) => {
                  const isActive = active?.id === i.id;
                  return (
                    <button key={i.id} onClick={()=>setActive(i)}
                      className={`w-full text-left border rounded-md px-3 py-2 text-sm ${isActive?"border-primary bg-primary/5":"hover:bg-muted"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{i.incident_number}</span>
                        <Badge variant={SEV_TONE[i.severity]}>{i.severity}</Badge>
                      </div>
                      <div className="truncate text-xs text-muted-foreground mt-0.5">{i.title}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_TONE[i.status]}`}>{i.status.replace("_"," ")}</span>
                        {i.sla_breached && <span className="text-[10px] text-destructive font-bold">SLA BREACH</span>}
                      </div>
                    </button>
                  );
                })}
                {liveList.length===0 && <div className="text-sm text-muted-foreground text-center py-8">No active incidents.</div>}
              </div>
            </Card>

            <Card className="p-4 lg:col-span-3">
              {!active ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm py-16">
                  <AlertTriangle className="h-4 w-4 mr-2"/>Select an incident to open the command view.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-xs text-muted-foreground">{active.incident_number} · {active.location}</div>
                      <div className="text-lg font-semibold">{active.title}</div>
                      <div className="text-xs text-muted-foreground">{active.incident_type} · {new Date(active.occurred_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <SlaRing incident={active}/>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={SEV_TONE[active.severity]}>{active.severity}</Badge>
                        <Badge variant="outline">{active.status}</Badge>
                        {active.sla_breached && <Badge variant="destructive">SLA BREACH</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {active.status === "open" && <Button size="sm" onClick={()=>updateIncidentStatus(active.id,"investigating",active.status)}>Start Response</Button>}
                    {(active.status==="investigating"||active.status==="in_progress") && <Button size="sm" onClick={()=>{ setResolveNotes(""); setResolveOpen(true); }}>Resolve</Button>}
                    {active.status==="resolved" && <Button size="sm" variant="secondary" onClick={()=>setCloseOpen(true)}>Close</Button>}
                    <Button size="sm" variant="outline" onClick={()=>setNoteOpen(true)}><MessageSquarePlus className="h-4 w-4 mr-1"/>Note</Button>
                    <Button size="sm" variant="outline" onClick={()=>setEscOpen(true)}><ArrowUpCircle className="h-4 w-4 mr-1"/>Escalate</Button>
                    <Button size="sm" variant="outline" onClick={()=>fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-1"/>Evidence</Button>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e)=>handleFiles(e.target.files)}/>
                    <Button size="sm" variant="outline" disabled={aiBusy} onClick={runAiSummary}><Sparkles className="h-4 w-4 mr-1"/>{aiBusy?"Briefing…":"AI Brief"}</Button>
                    <Button size="sm" variant="outline" onClick={exportPdf}><FileDown className="h-4 w-4 mr-1"/>PDF</Button>
                  </div>

                  <Tabs defaultValue="sop" className="space-y-3">
                    <TabsList className="grid grid-cols-4 w-full max-w-md">
                      <TabsTrigger value="sop"><ListChecks className="h-3.5 w-3.5 mr-1"/>SOP</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      <TabsTrigger value="evidence"><Paperclip className="h-3.5 w-3.5 mr-1"/>{evidence.length || ""}</TabsTrigger>
                      <TabsTrigger value="brief"><Sparkles className="h-3.5 w-3.5 mr-1"/>Brief</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sop" className="space-y-2">
                      {sopSteps.length === 0 ? (
                        <div className="text-xs text-muted-foreground italic">No SOP configured for this incident type.</div>
                      ) : (
                        <>
                          <div className="text-xs text-muted-foreground">SOP progress · {sopDone}/{sopSteps.length}</div>
                          <div className="space-y-1.5">
                            {sopSteps.map((s, idx) => (
                              <label key={idx} className={`flex items-start gap-2 border rounded-md p-2 text-sm cursor-pointer ${s.completed?"bg-emerald-500/5 border-emerald-500/30":"hover:bg-muted"}`}>
                                <Checkbox checked={!!s.completed} onCheckedChange={()=>toggleStep(idx)} className="mt-0.5"/>
                                <div className="flex-1">
                                  <div className={s.completed?"line-through text-muted-foreground":""}>{s.order}. {s.action}</div>
                                  {s.completed && s.completed_at && <div className="text-[10px] text-muted-foreground">Done {new Date(s.completed_at).toLocaleString()}</div>}
                                </div>
                              </label>
                            ))}
                          </div>
                        </>
                      )}

                      {escalations.length > 0 && (
                        <div className="pt-2">
                          <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Escalation Chain</div>
                          <div className="flex flex-wrap gap-1.5">
                            {escalations.map((e) => (
                              <Badge key={e.id} variant={e.acknowledged?"secondary":"destructive"}>
                                L{e.level} · {e.escalated_to_role}{e.acknowledged?" ✓":""}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="timeline">
                      <div className="space-y-1.5 max-h-96 overflow-y-auto border rounded-md p-2">
                        {timeline.map((t) => (
                          <div key={t.id} className="text-sm border-l-2 border-primary/40 pl-2">
                            <div className="text-xs text-muted-foreground">{new Date(t.event_at).toLocaleString()} · {t.event_type}</div>
                            <div>{t.note || JSON.stringify(t.payload)}</div>
                          </div>
                        ))}
                        {timeline.length===0 && <div className="text-xs text-muted-foreground italic">No timeline events.</div>}
                      </div>
                    </TabsContent>

                    <TabsContent value="evidence">
                      <div className="space-y-1.5 max-h-96 overflow-y-auto">
                        {evidence.length === 0 ? (
                          <div className="text-xs text-muted-foreground italic">No evidence attached. Use the Evidence button above to upload.</div>
                        ) : evidence.map((e) => (
                          <div key={e.id} className="border rounded-md p-2 text-sm flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-muted-foreground"/>
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{e.title}</div>
                              <div className="text-[10px] text-muted-foreground">{e.evidence_type} · {new Date(e.collected_at).toLocaleString()}</div>
                            </div>
                            {e.storage_path && (
                              <Button size="sm" variant="ghost" onClick={async ()=>{
                                const { data } = await supabase.storage.from("evidence-vault").createSignedUrl(e.storage_path!, 3600);
                                if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                              }}>Open</Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="brief">
                      {active.ai_summary ? (
                        <div className="space-y-2">
                          <div className="text-[10px] text-muted-foreground">Generated {active.ai_summary_at ? new Date(active.ai_summary_at).toLocaleString() : ""}</div>
                          <div className="border rounded-md p-3 text-sm whitespace-pre-wrap">{active.ai_summary}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">No AI brief yet. Tap "AI Brief" to generate an executive summary from the timeline.</div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="register">
          <Card>
            <CardHeader><CardTitle>All Incidents</CardTitle><CardDescription>Complete register of reported incidents.</CardDescription></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Incident #</TableHead>
                      <TableHead className="min-w-[200px]">Title</TableHead>
                      <TableHead className="min-w-[120px]">Type</TableHead>
                      <TableHead className="min-w-[100px]">Severity</TableHead>
                      <TableHead className="min-w-[150px]">Location</TableHead>
                      <TableHead className="min-w-[150px]">Assigned To</TableHead>
                      <TableHead className="min-w-[120px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No incidents reported yet</TableCell></TableRow>
                    ) : (
                      incidents.map((incident) => (
                        <TableRow key={incident.id} className="cursor-pointer" onClick={()=>setActive(incident)}>
                          <TableCell className="font-medium">{incident.incident_number}</TableCell>
                          <TableCell>{incident.title}</TableCell>
                          <TableCell><Badge variant="outline">{incident.incident_type}</Badge></TableCell>
                          <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                          <TableCell>{incident.location}</TableCell>
                          <TableCell>{incident.staff?.full_name || "Unassigned"}</TableCell>
                          <TableCell>{getStatusBadge(incident.status)}</TableCell>
                          <TableCell>{format(new Date(incident.occurred_at), "PP")}</TableCell>
                          <TableCell onClick={(e)=>e.stopPropagation()}>
                            <Select
                              value={incident.status}
                              onValueChange={(v) => {
                                if (v === "resolved") { setActive(incident); setResolveNotes(""); setResolveOpen(true); }
                                else if (v === "closed") { setActive(incident); setCloseOpen(true); }
                                else updateIncidentStatus(incident.id, v, incident.status);
                              }}
                            >
                              <SelectTrigger className="w-36"><SelectValue/></SelectTrigger>
                              <SelectContent>
                                <SelectItem value={incident.status}>{incident.status.replace("_"," ")}</SelectItem>
                                {(INCIDENT_TRANSITIONS[incident.status] ?? []).map(t => (
                                  <SelectItem key={t} value={t}>{t.replace("_"," ")}</SelectItem>
                                ))}
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
        </TabsContent>
      </Tabs>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Incident</DialogTitle>
            <DialogDescription>Enter resolution notes (minimum 10 characters) before closing this incident.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            rows={4}
            placeholder="Describe how the incident was resolved, actions taken, outcome…"
          />
          {resolveNotes.trim().length > 0 && resolveNotes.trim().length < 10 && (
            <p className="text-xs text-destructive">Notes must be at least 10 characters.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
            <Button
              disabled={resolveNotes.trim().length < 10}
              onClick={async () => {
                if (!active) return;
                await updateStatus(active.id, "resolved", { notes: resolveNotes, userId: user?.id, currentStatus: active.status });
                setResolveOpen(false);
                setResolveNotes("");
              }}
            >
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Incident</DialogTitle>
            <DialogDescription>
              Closing the incident locks the record. This action cannot be undone. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!active) return;
                await updateStatus(active.id, "closed", { userId: user?.id, currentStatus: active.status });
                setCloseOpen(false);
              }}
            >
              Close Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Timeline Note</DialogTitle></DialogHeader>
          <Textarea value={noteText} onChange={(e)=>setNoteText(e.target.value)} rows={4} placeholder="Operational update, action taken, observation…"/>
          <DialogFooter><Button onClick={addNote}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={escOpen} onOpenChange={setEscOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Escalate Incident</DialogTitle></DialogHeader>
          <form onSubmit={(e)=>{ e.preventDefault(); const f = new FormData(e.currentTarget); const lvl=Number(f.get("level")); const def=ESC_LEVELS.find(x=>x.level===lvl)!; escalate(lvl, def.role, String(f.get("reason")||"")); }} className="space-y-3">
            <div><Label>Level</Label>
              <Select name="level" defaultValue="1">
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{ESC_LEVELS.map((l)=><SelectItem key={l.level} value={String(l.level)}>L{l.level} · {l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Reason</Label><Textarea name="reason" rows={3} required/></div>
            <DialogFooter><Button type="submit">Escalate</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
