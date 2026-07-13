/**
 * K9DetailDrawer
 * Tabbed drill-down for a single K9 unit: overview, deployments, health,
 * training, incidents. Every tab exposes a working "log" / "complete" action.
 */
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dog, Heart, Award, AlertTriangle, MapPin, Play, Square,
  Plus, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { useK9, type K9Unit } from "@/hooks/useK9";
import K9DeployDialog from "./K9DeployDialog";
import K9RecallDialog from "./K9RecallDialog";
import K9HealthDialog from "./K9HealthDialog";
import K9TrainingDialog from "./K9TrainingDialog";
import K9IncidentDialog from "./K9IncidentDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unit: K9Unit | null;
}

const sevColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/20 text-amber-600",
  high: "bg-orange-500/20 text-orange-600",
  critical: "bg-destructive/20 text-destructive",
};

const K9DetailDrawer = ({ open, onOpenChange, unit }: Props) => {
  const { byUnit, actions } = useK9();
  const [deployOpen, setDeployOpen] = useState(false);
  const [recallOpen, setRecallOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [trainOpen, setTrainOpen] = useState(false);
  const [incOpen, setIncOpen] = useState(false);

  if (!unit) return null;
  const data = byUnit(unit.id);
  const active = data.activeDeployment;

  const setStatus = async (s: K9Unit["status"]) => {
    try { await actions.setUnitStatus(unit.id, s); toast.success(`Status: ${s}`); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const remove = async () => {
    if (!confirm(`Remove ${unit.name} (${unit.k9_id}) permanently?`)) return;
    try { await actions.deleteUnit(unit.id); toast.success("Unit removed"); onOpenChange(false); }
    catch (e: any) { toast.error(e?.message ?? "Failed (elevated role required)"); }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Dog className="w-5 h-5 text-primary" /> {unit.name}
              <Badge variant="outline" className="font-mono">{unit.k9_id}</Badge>
            </SheetTitle>
            <SheetDescription>
              {unit.breed} • {unit.specialty} • Handler: {unit.staff?.full_name ?? "Unassigned"}
            </SheetDescription>
          </SheetHeader>

          {/* Quick action bar */}
          <div className="flex flex-wrap gap-2 mt-4">
            {unit.status !== "deployed" && (
              <Button size="sm" onClick={() => setDeployOpen(true)}>
                <Play className="w-3 h-3 mr-1" /> Deploy
              </Button>
            )}
            {unit.status === "deployed" && active && (
              <Button size="sm" variant="destructive" onClick={() => setRecallOpen(true)}>
                <Square className="w-3 h-3 mr-1" /> Recall
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setStatus("rest")} disabled={unit.status === "rest"}>Rest</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("medical")} disabled={unit.status === "medical"}>Medical</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("training")} disabled={unit.status === "training"}>Training</Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("available")} disabled={unit.status === "available"}>Available</Button>
            <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={remove}>
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          </div>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="deploy">Deploy ({data.deployments.length})</TabsTrigger>
              <TabsTrigger value="health">Health ({data.health.length})</TabsTrigger>
              <TabsTrigger value="train">Train ({data.training.length})</TabsTrigger>
              <TabsTrigger value="inc">Incidents ({data.incidents.length})</TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Status" value={unit.status} />
                <Stat label="Health" value={unit.health_status} />
                <Stat label="Location" value={unit.current_location ?? "—"} />
                <Stat label="Total deployments" value={String(unit.total_deployments ?? 0)} />
                <Stat label="Last vet check" value={unit.last_vet_check ?? "—"} />
                <Stat label="Next vet check" value={unit.next_vet_check ?? "—"} />
              </div>
              {active && (
                <div className="p-3 rounded border border-primary/30 bg-primary/5 text-xs">
                  <p className="font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Currently on {active.deployment_number}
                  </p>
                  <p>{active.site_name} — {active.purpose}</p>
                  <p className="text-muted-foreground">
                    Started {formatDistanceToNow(new Date(active.started_at), { addSuffix: true })}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* DEPLOYMENTS */}
            <TabsContent value="deploy">
              <ActionRow label="Deployment history" onAdd={() => setDeployOpen(true)} addLabel="New deployment" />
              <ScrollArea className="h-[340px] pr-2">
                {!data.deployments.length && <Empty msg="No deployments yet." />}
                <div className="space-y-2">
                  {data.deployments.map((d) => (
                    <div key={d.id} className="border border-border/50 rounded p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{d.deployment_number}</span>
                        <Badge variant="outline">{d.status}</Badge>
                      </div>
                      <p className="font-medium">{d.site_name} — {d.purpose}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(d.started_at), "Pp")}
                        {d.duration_minutes ? ` • ${d.duration_minutes}m` : ""}
                        {d.finds_count ? ` • ${d.finds_count} find(s)` : ""}
                      </p>
                      {d.outcome && <p className="italic">{d.outcome}</p>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* HEALTH */}
            <TabsContent value="health">
              <ActionRow label="Health records" onAdd={() => setHealthOpen(true)} addLabel="Log record" />
              <ScrollArea className="h-[340px] pr-2">
                {!data.health.length && <Empty msg="No health records." />}
                <div className="space-y-2">
                  {data.health.map((h) => (
                    <div key={h.id} className="border border-border/50 rounded p-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <Badge variant="outline" className="capitalize">{h.record_type}</Badge>
                        <span>{format(new Date(h.performed_at), "PP")}</span>
                      </div>
                      {h.vet_name && <p>Vet: {h.vet_name}</p>}
                      {h.diagnosis && <p><span className="text-muted-foreground">Dx:</span> {h.diagnosis}</p>}
                      {h.treatment && <p><span className="text-muted-foreground">Rx:</span> {h.treatment}</p>}
                      {h.next_due_at && <p className="text-amber-600">Next due {h.next_due_at}</p>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* TRAINING */}
            <TabsContent value="train">
              <ActionRow label="Training log" onAdd={() => setTrainOpen(true)} addLabel="Log session" />
              <ScrollArea className="h-[340px] pr-2">
                {!data.training.length && <Empty msg="No training sessions." />}
                <div className="space-y-2">
                  {data.training.map((t) => (
                    <div key={t.id} className="border border-border/50 rounded p-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <Badge variant="outline" className="capitalize">{t.session_type}</Badge>
                        <Badge className={t.pass ? "bg-emerald-500/20 text-emerald-600" : "bg-destructive/20 text-destructive"}>
                          {t.pass ? "PASS" : "FAIL"}{t.score != null ? ` • ${t.score}` : ""}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {format(new Date(t.performed_at), "PP")}{t.instructor ? ` • ${t.instructor}` : ""}
                      </p>
                      {t.notes && <p className="italic">{t.notes}</p>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* INCIDENTS */}
            <TabsContent value="inc">
              <ActionRow label="Incidents" onAdd={() => setIncOpen(true)} addLabel="Log incident" />
              <ScrollArea className="h-[340px] pr-2">
                {!data.incidents.length && <Empty msg="No incidents logged." />}
                <div className="space-y-2">
                  {data.incidents.map((i) => (
                    <div key={i.id} className="border border-border/50 rounded p-2 text-xs space-y-1">
                      <div className="flex justify-between">
                        <Badge variant="outline" className="capitalize">{i.incident_type}</Badge>
                        <Badge className={sevColor[i.severity]}>{i.severity}</Badge>
                      </div>
                      <p>{i.description}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(i.occurred_at), "Pp")}{i.location ? ` • ${i.location}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <K9DeployDialog open={deployOpen} onOpenChange={setDeployOpen} unitId={unit.id} defaultHandlerId={unit.handler_id} />
      <K9RecallDialog open={recallOpen} onOpenChange={setRecallOpen} deployment={active} />
      <K9HealthDialog open={healthOpen} onOpenChange={setHealthOpen} unitId={unit.id} />
      <K9TrainingDialog open={trainOpen} onOpenChange={setTrainOpen} unitId={unit.id} />
      <K9IncidentDialog open={incOpen} onOpenChange={setIncOpen} unitId={unit.id} />
    </>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-2 rounded bg-muted/30">
    <p className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</p>
    <p className="font-medium capitalize">{value}</p>
  </div>
);

const ActionRow = ({ label, onAdd, addLabel }: { label: string; onAdd: () => void; addLabel: string }) => (
  <div className="flex items-center justify-between my-2">
    <h3 className="text-sm font-semibold">{label}</h3>
    <Button size="sm" onClick={onAdd}><Plus className="w-3 h-3 mr-1" />{addLabel}</Button>
  </div>
);

const Empty = ({ msg }: { msg: string }) => (
  <p className="text-xs text-muted-foreground text-center py-6">{msg}</p>
);

export default K9DetailDrawer;
