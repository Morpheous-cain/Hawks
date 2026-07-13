import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { ClipboardList, RefreshCw, CheckCircle2, XCircle, ArrowUp } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import IssueDirectiveDialog from "@/components/directives/IssueDirectiveDialog";

interface Directive {
  id: string;
  directive_number: string;
  title: string;
  description: string | null;
  directive_type: string;
  priority: string;
  status: string;
  source_module: string | null;
  issued_by: string;
  issued_at: string;
  target_user_id: string | null;
  target_role: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  completed_by: string | null;
  completed_at: string | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  metadata: Record<string, unknown>;
}

interface DirectiveEvent {
  id: string;
  directive_id: string;
  event_type: string;
  actor_id: string | null;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

const priorityColor = (p: string) => {
  switch (p) {
    case "critical": return "bg-destructive text-destructive-foreground";
    case "high": return "bg-alert-caution text-foreground";
    case "normal": return "bg-primary/20 text-primary";
    default: return "bg-muted text-muted-foreground";
  }
};

const statusColor = (s: string) => {
  switch (s) {
    case "issued": return "bg-primary/20 text-primary";
    case "acknowledged": return "bg-amber-500/20 text-amber-500";
    case "in_progress": return "bg-blue-500/20 text-blue-500";
    case "completed": return "bg-alert-normal/20 text-alert-normal";
    case "cancelled": return "bg-muted text-muted-foreground";
    case "escalated": return "bg-destructive/20 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
};

const DirectiveLog = () => {
  const { user } = useAuth();
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [events, setEvents] = useState<DirectiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Directive | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("directives" as any)
      .select("*")
      .order("issued_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setDirectives((data as unknown as Directive[]) || []);
    setLoading(false);
  };

  const loadEvents = async (directiveId: string) => {
    const { data } = await supabase
      .from("directive_events" as any)
      .select("*")
      .eq("directive_id", directiveId)
      .order("created_at", { ascending: true });
    setEvents((data as unknown as DirectiveEvent[]) || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("directives-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "directives" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "directive_events" }, () => {
        if (selected) loadEvents(selected.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const openDetail = async (d: Directive) => {
    setSelected(d);
    await loadEvents(d.id);
  };

  const update = async (id: string, patch: Partial<Directive>) => {
    const { error } = await supabase.from("directives" as any).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Directive updated");
    load();
    if (selected?.id === id) {
      const fresh = await supabase.from("directives" as any).select("*").eq("id", id).single();
      if (fresh.data) setSelected(fresh.data as unknown as Directive);
      loadEvents(id);
    }
  };

  const acknowledge = (d: Directive) =>
    update(d.id, {
      status: "acknowledged",
      acknowledged_by: user?.id ?? null,
      acknowledged_at: new Date().toISOString(),
    });

  const complete = (d: Directive) =>
    update(d.id, {
      status: "completed",
      completed_by: user?.id ?? null,
      completed_at: new Date().toISOString(),
    });

  const escalate = (d: Directive) => update(d.id, { status: "escalated", priority: "critical" });
  const cancel = (d: Directive) => update(d.id, { status: "cancelled" });

  const filtered = directives.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.directive_number.toLowerCase().includes(s) ||
      d.title.toLowerCase().includes(s) ||
      d.status.toLowerCase().includes(s) ||
      (d.source_module || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Directive & Command Log"
        description="Every command issued, acknowledged, and resolved — fully audited."
        icon={ClipboardList}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by number, title, status, source…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
        <div className="ml-auto">
          <IssueDirectiveDialog onCreated={load} />
        </div>
      </div>

      <Card>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No directives yet. Issue one to start the audit trail.</TableCell></TableRow>
              ) : filtered.map((d) => (
                <TableRow key={d.id} className="cursor-pointer" onClick={() => openDetail(d)}>
                  <TableCell className="font-mono text-xs">{d.directive_number}</TableCell>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell><Badge variant="outline">{d.directive_type}</Badge></TableCell>
                  <TableCell><Badge className={priorityColor(d.priority)}>{d.priority}</Badge></TableCell>
                  <TableCell><Badge className={statusColor(d.status)}>{d.status}</Badge></TableCell>
                  <TableCell className="text-xs">{format(new Date(d.issued_at), "yyyy-MM-dd HH:mm")}</TableCell>
                  <TableCell className="text-xs">{d.source_module || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{selected.directive_number}</span>
                  <Badge className={priorityColor(selected.priority)}>{selected.priority}</Badge>
                  <Badge className={statusColor(selected.status)}>{selected.status}</Badge>
                </SheetTitle>
                <SheetDescription className="text-base font-medium text-foreground">
                  {selected.title}
                </SheetDescription>
              </SheetHeader>

              {selected.description && (
                <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">{selected.description}</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-muted-foreground">Issued at:</span><br />{format(new Date(selected.issued_at), "yyyy-MM-dd HH:mm:ss")}</div>
                <div><span className="text-muted-foreground">Source:</span><br />{selected.source_module || "—"}</div>
                <div><span className="text-muted-foreground">Target user:</span><br /><span className="font-mono">{selected.target_user_id || "—"}</span></div>
                <div><span className="text-muted-foreground">Target role:</span><br />{selected.target_role || "—"}</div>
                <div><span className="text-muted-foreground">Acknowledged:</span><br />{selected.acknowledged_at ? format(new Date(selected.acknowledged_at), "HH:mm:ss") : "—"}</div>
                <div><span className="text-muted-foreground">Completed:</span><br />{selected.completed_at ? format(new Date(selected.completed_at), "HH:mm:ss") : "—"}</div>
                <div><span className="text-muted-foreground">SLA deadline:</span><br />{selected.sla_deadline ? format(new Date(selected.sla_deadline), "HH:mm:ss") : "—"}</div>
                <div><span className="text-muted-foreground">SLA breached:</span><br />{selected.sla_breached ? "Yes" : "No"}</div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selected.status === "issued" && (
                  <Button size="sm" onClick={() => acknowledge(selected)} className="gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Acknowledge
                  </Button>
                )}
                {selected.status !== "completed" && selected.status !== "cancelled" && (
                  <Button size="sm" variant="outline" onClick={() => complete(selected)} className="gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Mark complete
                  </Button>
                )}
                {selected.status !== "escalated" && selected.status !== "completed" && (
                  <Button size="sm" variant="outline" onClick={() => escalate(selected)} className="gap-1">
                    <ArrowUp className="w-4 h-4" /> Escalate
                  </Button>
                )}
                {selected.status !== "cancelled" && selected.status !== "completed" && (
                  <Button size="sm" variant="destructive" onClick={() => cancel(selected)} className="gap-1">
                    <XCircle className="w-4 h-4" /> Cancel
                  </Button>
                )}
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-sm mb-2">Audit timeline</h3>
                <div className="space-y-3 border-l-2 border-primary/30 pl-4">
                  {events.length === 0 && (
                    <p className="text-xs text-muted-foreground">No events recorded yet.</p>
                  )}
                  {events.map((e) => (
                    <div key={e.id} className="relative">
                      <div className="absolute -left-[1.4rem] top-1 w-3 h-3 rounded-full bg-primary" />
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="capitalize">{e.event_type.replace(/_/g, " ")}</Badge>
                        <span className="text-muted-foreground">{format(new Date(e.created_at), "yyyy-MM-dd HH:mm:ss")}</span>
                      </div>
                      {(e.from_status || e.to_status) && (
                        <p className="text-xs mt-1">
                          {e.from_status && <span>from <strong>{e.from_status}</strong> </span>}
                          {e.to_status && <span>→ <strong>{e.to_status}</strong></span>}
                        </p>
                      )}
                      {e.note && <p className="text-xs text-muted-foreground mt-1">{e.note}</p>}
                      {e.actor_id && (
                        <p className="text-[10px] font-mono text-muted-foreground mt-1">actor: {e.actor_id}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DirectiveLog;
