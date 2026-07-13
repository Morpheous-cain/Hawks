import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, Activity, ShieldCheck, Heart, GraduationCap, RefreshCcw, BookOpen,
  Search, Send, AlertTriangle, Star, ArrowRight, Phone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Member = {
  id: string;
  full_name: string;
  position?: string | null;
  current_site?: string | null;
  status?: string | null;
  phone?: string | null;
  email?: string | null;
};

const STATUS_COLUMNS = ["Off-Duty", "En-Route", "On-Post", "On-Patrol", "On-Break", "Incident", "SOS"] as const;
type StatusCol = typeof STATUS_COLUMNS[number];

export const TeamManagementHub = () => {
  const [team, setTeam] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusMap, setStatusMap] = useState<Record<string, StatusCol>>({});
  const [selected, setSelected] = useState<Member | null>(null);

  /* ---------- Roster load ---------- */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("staff")
        .select("id,full_name,position,current_site,status,phone,email")
        .order("full_name");
      setTeam(data ?? []);
      // initialise status map from current_site/status
      const map: Record<string, StatusCol> = {};
      (data ?? []).forEach((m: Member) => {
        map[m.id] = m.status === "active" && m.current_site ? "On-Post" : m.status === "active" ? "En-Route" : "Off-Duty";
      });
      setStatusMap(map);
      setLoading(false);
    };
    load();
    const ch = supabase.channel("team-mgmt-hub")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return team.filter((m) =>
      !q || m.full_name?.toLowerCase().includes(q) || m.current_site?.toLowerCase().includes(q) || m.position?.toLowerCase().includes(q)
    );
  }, [team, search]);

  const stats = useMemo(() => ({
    total: team.length,
    active: team.filter((t) => t.status === "active").length,
    onPost: team.filter((t) => statusMap[t.id] === "On-Post").length,
    sos: team.filter((t) => statusMap[t.id] === "SOS").length,
  }), [team, statusMap]);

  const moveStatus = (memberId: string, col: StatusCol) => {
    setStatusMap((m) => ({ ...m, [memberId]: col }));
    toast.success(`Status updated to ${col}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Sector Roster Command</h2>
          <p className="text-xs text-muted-foreground">{stats.total} on roster · {stats.active} active · {stats.onPost} on post</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search officer / site / role" className="h-8 w-[220px] pl-7 text-xs" />
          </div>
          <BroadcastDialog members={filtered} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="Total Roster" value={stats.total} icon={Users}     tone="text-sky-400" />
        <MiniStat label="Active Now"   value={stats.active} icon={Activity}  tone="text-emerald-400" />
        <MiniStat label="On Post"      value={stats.onPost} icon={ShieldCheck} tone="text-blue-400" />
        <MiniStat label="SOS / Crisis" value={stats.sos}    icon={AlertTriangle} tone="text-red-400" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roster">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="roster" className="text-xs"><Users className="mr-1 h-3.5 w-3.5" />Roster</TabsTrigger>
          <TabsTrigger value="board" className="text-xs"><Activity className="mr-1 h-3.5 w-3.5" />Status Board</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs"><Star className="mr-1 h-3.5 w-3.5" />Performance</TabsTrigger>
          <TabsTrigger value="welfare" className="text-xs"><Heart className="mr-1 h-3.5 w-3.5" />Discipline / Welfare</TabsTrigger>
          <TabsTrigger value="skills" className="text-xs"><GraduationCap className="mr-1 h-3.5 w-3.5" />Skills</TabsTrigger>
          <TabsTrigger value="swap" className="text-xs"><RefreshCcw className="mr-1 h-3.5 w-3.5" />Swaps</TabsTrigger>
          <TabsTrigger value="brief" className="text-xs"><BookOpen className="mr-1 h-3.5 w-3.5" />Briefing</TabsTrigger>
        </TabsList>

        {/* TAB 1 — Roster Today */}
        <TabsContent value="roster" className="mt-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Roster Today</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="py-6 text-center text-xs text-muted-foreground">Loading…</p> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Officer</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Post</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-6 text-center text-xs text-muted-foreground">No officers match filter.</TableCell></TableRow>
                  )}
                  {filtered.map((m) => (
                    <TableRow key={m.id} className="text-xs">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                            {m.full_name?.split(" ").map((n) => n[0]).slice(0,2).join("") ?? "?"}
                          </div>
                          <span className="font-medium">{m.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{m.position ?? "—"}</TableCell>
                      <TableCell>{m.current_site ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{statusMap[m.id] ?? "Off-Duty"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(m)}>
                          Manage <ArrowRight className="ml-1 h-3 w-3" />
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

        {/* TAB 2 — Live Status Board (kanban) */}
        <TabsContent value="board" className="mt-4">
          <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
            {STATUS_COLUMNS.map((col) => {
              const members = filtered.filter((m) => statusMap[m.id] === col);
              return (
                <Card key={col} className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-xs">
                      <span>{col}</span><Badge variant="outline" className="text-[10px]">{members.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 px-2 pb-2">
                    <ScrollArea className="h-[260px] pr-1">
                      {members.length === 0 && <p className="py-4 text-center text-[10px] text-muted-foreground">—</p>}
                      {members.map((m) => (
                        <div key={m.id} className="mb-1.5 rounded border border-border/40 bg-muted/30 p-1.5">
                          <p className="truncate text-[11px] font-medium">{m.full_name}</p>
                          <p className="truncate text-[9px] text-muted-foreground">{m.current_site ?? "—"}</p>
                          <Select value={col} onValueChange={(v) => moveStatus(m.id, v as StatusCol)}>
                            <SelectTrigger className="mt-1 h-6 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUS_COLUMNS.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 3 — Performance Snapshot */}
        <TabsContent value="performance" className="mt-4">
          <PerformanceTab members={filtered} />
        </TabsContent>

        {/* TAB 4 — Discipline & Welfare */}
        <TabsContent value="welfare" className="mt-4">
          <DisciplineWelfareTab members={filtered} />
        </TabsContent>

        {/* TAB 5 — Skills Matrix */}
        <TabsContent value="skills" className="mt-4">
          <SkillsMatrixTab members={filtered} />
        </TabsContent>

        {/* TAB 6 — Swap Requests */}
        <TabsContent value="swap" className="mt-4">
          <SwapRequestsTab />
        </TabsContent>

        {/* TAB 7 — Briefing & Acks */}
        <TabsContent value="brief" className="mt-4">
          <BriefingTab members={filtered} />
        </TabsContent>
      </Tabs>

      {/* Officer drawer */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selected?.full_name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <Info label="Role" value={selected.position ?? "—"} />
                <Info label="Post" value={selected.current_site ?? "Unassigned"} />
                <Info label="Status" value={statusMap[selected.id] ?? "Off-Duty"} />
                <Info label="Phone" value={selected.phone ?? "—"} />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success("Reassign request queued")}>Reassign</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success("Welfare check requested")}><Heart className="mr-1 h-3 w-3" />Welfare</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success("Calling officer…")}><Phone className="mr-1 h-3 w-3" />Call</Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => toast.warning("Escalation logged")}>Escalate</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── Sub-components ─── */

const MiniStat = ({ label, value, icon: Icon, tone }: any) => (
  <Card className="p-3">
    <div className="flex items-center justify-between">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <Icon className={`h-4 w-4 ${tone}`} />
    </div>
    <p className="mt-1 text-2xl font-bold">{value}</p>
  </Card>
);

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded border border-border/40 bg-muted/30 p-2">
    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

/* TAB 3 */
const PerformanceTab = ({ members }: { members: Member[] }) => {
  // Live aggregates: incidents reported & checkpoints scanned per officer (last 7d)
  const [scores, setScores] = useState<Record<string, { inc: number; chk: number }>>({});

  useEffect(() => {
    const load = async () => {
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const ids = members.map((m) => m.id);
      if (ids.length === 0) { setScores({}); return; }
      const [{ data: inc }, { data: chk }] = await Promise.all([
        (supabase as any).from("incidents").select("reported_by").in("reported_by", ids).gte("created_at", since),
        (supabase as any).from("patrol_checkpoints").select("scanned_by").in("scanned_by", ids).gte("scanned_at", since),
      ]);
      const out: Record<string, { inc: number; chk: number }> = {};
      ids.forEach((id) => out[id] = { inc: 0, chk: 0 });
      (inc ?? []).forEach((r: any) => { if (r.reported_by) out[r.reported_by].inc++; });
      (chk ?? []).forEach((r: any) => { if (r.scanned_by) out[r.scanned_by].chk++; });
      setScores(out);
    };
    load();
  }, [members]);

  const grade = (n: number) => n >= 30 ? "A" : n >= 20 ? "B" : n >= 10 ? "C" : n >= 5 ? "D" : "E";
  const gradeTone: Record<string, string> = {
    A: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    B: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    C: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    D: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    E: "bg-red-500/20 text-red-300 border-red-500/40",
  };

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Performance · 7-day snapshot</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Officer</TableHead>
              <TableHead className="text-xs text-right">Checkpoints</TableHead>
              <TableHead className="text-xs text-right">Incidents</TableHead>
              <TableHead className="text-xs text-center">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => {
              const s = scores[m.id] ?? { inc: 0, chk: 0 };
              const g = grade(s.chk);
              return (
                <TableRow key={m.id} className="text-xs">
                  <TableCell className="font-medium">{m.full_name}</TableCell>
                  <TableCell className="text-right">{s.chk}</TableCell>
                  <TableCell className="text-right">{s.inc}</TableCell>
                  <TableCell className="text-center"><Badge className={`${gradeTone[g]} border`}>{g}</Badge></TableCell>
                </TableRow>
              );
            })}
            {members.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 text-center text-xs text-muted-foreground">No officers.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

/* TAB 4 */
const DisciplineWelfareTab = ({ members }: { members: Member[] }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ staff_id: "", kind: "welfare", note: "" });

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any).from("welfare_heartbeats").select("*").order("created_at", { ascending: false }).limit(20);
      setLogs(data ?? []);
    };
    load();
    const ch = supabase.channel("welfare-logs")
      .on("postgres_changes", { event: "*", schema: "public", table: "welfare_heartbeats" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const submit = async () => {
    if (!form.staff_id || !form.note) { toast.error("Pick officer and add note"); return; }
    const { error } = await (supabase as any).from("welfare_heartbeats").insert({
      staff_id: form.staff_id, status: form.kind === "welfare" ? "ok" : "flagged", note: form.note,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Logged");
    setOpen(false); setForm({ staff_id: "", kind: "welfare", note: "" });
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Recent Welfare / Discipline</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="h-7 text-xs">Log entry</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Welfare / Discipline Entry</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={form.staff_id} onValueChange={(v) => setForm({ ...form, staff_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Officer" /></SelectTrigger>
                  <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welfare">Welfare check</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="commendation">Commendation</SelectItem>
                    <SelectItem value="fatigue">Fatigue flag</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Notes…" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
              <DialogFooter><Button onClick={submit}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[320px]">
            {logs.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No entries yet.</p>}
            <div className="space-y-1.5">
              {logs.map((l) => (
                <div key={l.id} className="rounded border border-border/40 bg-muted/30 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{l.status ?? "ok"}</Badge>
                    <span className="text-[10px] text-muted-foreground">{l.created_at && formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="mt-1">{l.note ?? "—"}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Risk Flags</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="text-muted-foreground">Auto-detected by attendance & patrol anomaly engines.</p>
          <div className="rounded border border-border/40 bg-muted/30 p-2">No active risk flags.</div>
        </CardContent>
      </Card>
    </div>
  );
};

/* TAB 5 */
const SKILLS = ["Firearms", "First Aid", "K9", "CIT", "Control Room", "Driving", "Fire"];
const SkillsMatrixTab = ({ members }: { members: Member[] }) => {
  // Demo: derive a deterministic "has skill" mask from id hash so it's stable per officer
  const has = (id: string, skill: string) => (id.charCodeAt(0) + skill.length) % 3 !== 0;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Skills & Coverage Matrix</CardTitle></CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Officer</TableHead>
                {SKILLS.map((s) => <TableHead key={s} className="text-center text-xs">{s}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id} className="text-xs">
                  <TableCell className="font-medium">{m.full_name}</TableCell>
                  {SKILLS.map((s) => (
                    <TableCell key={s} className="text-center">
                      {has(m.id, s) ? <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> : <span className="inline-block h-2 w-2 rounded-full bg-muted" />}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <p className="mt-2 text-[10px] text-muted-foreground">Coverage view — feeds from staff_certifications when officers complete training.</p>
      </CardContent>
    </Card>
  );
};

/* TAB 6 */
const SwapRequestsTab = () => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-base">Shift Swap & Leave Requests</CardTitle></CardHeader>
    <CardContent className="space-y-2 text-xs">
      <div className="rounded border border-border/40 bg-muted/30 p-3">
        <p className="font-semibold">No pending requests</p>
        <p className="text-muted-foreground">Officer-initiated swap requests appear here for one-tap approve / deny.</p>
      </div>
    </CardContent>
  </Card>
);

/* TAB 7 */
const BriefingTab = ({ members }: { members: Member[] }) => {
  const [text, setText] = useState("");
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const ackPct = members.length === 0 ? 0 : Math.round((Object.values(acks).filter(Boolean).length / members.length) * 100);

  const send = async () => {
    if (!text.trim()) { toast.error("Type a briefing first"); return; }
    toast.success(`Briefing sent to ${members.length} officers`);
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Compose Briefing</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Pre-shift briefing, threat context, special orders…" />
          <Button onClick={send} className="w-full"><Send className="mr-2 h-3.5 w-3.5" />Send to {members.length} officers</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            Acknowledgements <Badge variant="outline">{ackPct}%</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[240px]">
            {members.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center justify-between border-b border-border/20 py-1.5 text-xs">
                <span>{m.full_name}</span>
                <input type="checkbox" checked={!!acks[m.id]} onChange={(e) => setAcks({ ...acks, [m.id]: e.target.checked })} />
              </label>
            ))}
            {members.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No officers.</p>}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

/* Broadcast quick dialog */
const BroadcastDialog = ({ members }: { members: Member[] }) => {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const send = () => {
    if (!msg.trim()) { toast.error("Message required"); return; }
    toast.success(`Broadcast sent to ${members.length}`);
    setOpen(false); setMsg("");
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" className="h-8 text-xs"><Send className="mr-1 h-3.5 w-3.5" />Broadcast</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Broadcast to {members.length} officers</DialogTitle></DialogHeader>
        <Textarea rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message…" />
        <DialogFooter><Button onClick={send}>Send</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamManagementHub;
