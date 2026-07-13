/**
 * K9 Management System
 *
 * Composes:
 *   - useK9()                → fetch + realtime + actions (single source of truth)
 *   - K9CreateDialog         → register new unit
 *   - K9DetailDrawer         → drill-down with 5 tabs and all per-unit actions
 *   - K9DeployDialog / K9RecallDialog / K9HealthDialog / K9TrainingDialog / K9IncidentDialog
 *
 * Replication pattern (works for any operational module):
 *   1) Migration with module tables + RLS + realtime.
 *   2) `useXyz` hook owning data + actions.
 *   3) `XyzCreateDialog` for create.
 *   4) `XyzDetailDrawer` with tabs + action buttons calling hook actions.
 *   5) Page wires layout, search, filters, KPIs and dialog state.
 */
import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dog, Heart, MapPin, Calendar, Download, Search,
  AlertTriangle, Award, Activity, Play, Square,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useK9, type K9Unit } from "@/hooks/useK9";
import { K9CreateDialog } from "@/components/k9/K9CreateDialog";
import K9DetailDrawer from "@/components/k9/K9DetailDrawer";
import K9DeployDialog from "@/components/k9/K9DeployDialog";
import K9RecallDialog from "@/components/k9/K9RecallDialog";
import { exportToCSV } from "@/utils/exportData";

const statusColor: Record<string, string> = {
  deployed: "bg-primary text-primary-foreground",
  available: "bg-emerald-600 text-primary-foreground",
  rest: "bg-amber-500 text-primary-foreground",
  medical: "bg-destructive text-primary-foreground",
  training: "bg-accent text-accent-foreground",
};
const healthColor: Record<string, string> = {
  excellent: "text-emerald-500",
  good: "text-primary",
  fair: "text-amber-500",
  poor: "text-destructive",
};

const K9 = () => {
  const { units, deployments, health, training, incidents, loading, actions } = useK9();

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [selected, setSelected] = useState<K9Unit | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deployUnitId, setDeployUnitId] = useState<string | null>(null);
  const [recallDeployId, setRecallDeployId] = useState<string | null>(null);

  // Derived KPIs from real data
  const kpis = useMemo(() => {
    const deployed = units.filter((u) => u.status === "deployed").length;
    const healthy = units.filter((u) => u.health_status === "excellent" || u.health_status === "good").length;
    const activeDep = deployments.filter((d) => d.status === "active").length;
    const dueVet = units.filter((u) => u.next_vet_check && new Date(u.next_vet_check) <= new Date()).length;
    return {
      total: units.length,
      deployed,
      activeDep,
      healthPct: units.length ? Math.round((healthy / units.length) * 100) : 0,
      dueVet,
      totalDeployments: units.reduce((s, u) => s + (u.total_deployments ?? 0), 0),
    };
  }, [units, deployments]);

  // Filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return units.filter((u) => {
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (specialtyFilter !== "all" && u.specialty !== specialtyFilter) return false;
      if (q && ![u.name, u.k9_id, u.breed, u.specialty, u.current_location, u.staff?.full_name]
        .filter(Boolean).join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [units, search, statusFilter, specialtyFilter]);

  const openDetail = (u: K9Unit) => { setSelected(u); setDrawerOpen(true); };

  const quickDeploy = (e: React.MouseEvent, u: K9Unit) => {
    e.stopPropagation();
    setDeployUnitId(u.id);
  };

  const quickRecall = async (e: React.MouseEvent, u: K9Unit) => {
    e.stopPropagation();
    const active = deployments.find((d) => d.k9_unit_id === u.id && d.status === "active");
    if (!active) { toast.error("No active deployment to recall"); return; }
    setRecallDeployId(active.id);
  };

  const specialties = Array.from(new Set(units.map((u) => u.specialty).filter(Boolean))) as string[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="K9 Management System"
        description="Handlers, canine health, training, deployments and incidents — fully realtime."
        icon={Dog}
      />

      <Tabs defaultValue="units" className="space-y-4">
        <TabsList>
          <TabsTrigger value="units"><Dog className="w-4 h-4 mr-1" />Units ({units.length})</TabsTrigger>
          <TabsTrigger value="deployments"><MapPin className="w-4 h-4 mr-1" />Deployments ({deployments.length})</TabsTrigger>
          <TabsTrigger value="health"><Heart className="w-4 h-4 mr-1" />Health ({health.length})</TabsTrigger>
          <TabsTrigger value="training"><Award className="w-4 h-4 mr-1" />Training ({training.length})</TabsTrigger>
          <TabsTrigger value="incidents"><AlertTriangle className="w-4 h-4 mr-1" />Incidents ({incidents.length})</TabsTrigger>
        </TabsList>

        {/* ==================== UNITS ==================== */}
        <TabsContent value="units" className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <div className="relative mr-auto">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8 w-64" placeholder="Search name, ID, handler…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="deployed">Deployed</SelectItem>
                <SelectItem value="rest">Rest</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All specialties</SelectItem>
                {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered, "k9-units")}>
              <Download className="w-4 h-4 mr-1" />Export
            </Button>
            <K9CreateDialog onSuccess={actions.refresh} />
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Kpi icon={Dog} label="Total" value={kpis.total} tone="text-primary" />
            <Kpi icon={MapPin} label="Deployed" value={kpis.deployed} tone="text-emerald-500" />
            <Kpi icon={Activity} label="Active ops" value={kpis.activeDep} tone="text-primary" />
            <Kpi icon={Heart} label="Healthy %" value={`${kpis.healthPct}%`} tone="text-destructive" />
            <Kpi icon={Calendar} label="Vet due" value={kpis.dueVet} tone="text-amber-500" />
            <Kpi icon={Award} label="Total deploys" value={kpis.totalDeployments} tone="text-accent" />
          </div>

          {/* Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No K9 units match your filters. Use “Add K9 Unit” to register a new canine.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((unit) => (
                <Card key={unit.id} role="button" onClick={() => openDetail(unit)}
                  className="p-5 border-border hover:border-primary/40 hover:shadow-elevated cursor-pointer transition-all">
                  <div className="flex items-start gap-4 mb-3">
                    <Avatar className="w-14 h-14 bg-gradient-command">
                      <AvatarFallback className="text-xl font-bold text-primary-foreground">
                        {unit.name?.charAt(0) ?? "K"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold truncate">{unit.name}</h3>
                          <p className="text-xs font-mono text-muted-foreground">{unit.k9_id}</p>
                        </div>
                        <Badge className={statusColor[unit.status] ?? statusColor.available}>
                          {unit.status?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm mt-1">
                        <Heart className={`w-4 h-4 ${healthColor[unit.health_status] ?? healthColor.good}`} />
                        <span className={`capitalize ${healthColor[unit.health_status] ?? healthColor.good}`}>
                          {unit.health_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Mini label="Breed" value={unit.breed ?? "—"} />
                    <Mini label="Specialty" value={unit.specialty ?? "—"} />
                    <Mini label="Handler" value={unit.staff?.full_name ?? "Unassigned"} />
                    <Mini label="Location" value={unit.current_location ?? "HQ"} />
                    <Mini label="Last vet" value={unit.last_vet_check ?? "—"} />
                    <Mini label="Deploys" value={String(unit.total_deployments ?? 0)} />
                  </div>

                  {/* Working quick actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    {unit.status !== "deployed" ? (
                      <Button size="sm" className="flex-1" onClick={(e) => quickDeploy(e, unit)}>
                        <Play className="w-3 h-3 mr-1" />Deploy
                      </Button>
                    ) : (
                      <Button size="sm" variant="destructive" className="flex-1" onClick={(e) => quickRecall(e, unit)}>
                        <Square className="w-3 h-3 mr-1" />Recall
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDetail(unit); }}>
                      Manage
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ==================== DEPLOYMENTS ==================== */}
        <TabsContent value="deployments">
          <ListTable
            empty="No deployments recorded."
            rows={deployments.map((d) => {
              const u = units.find((x) => x.id === d.k9_unit_id);
              return {
                key: d.id,
                primary: `${d.deployment_number} — ${u?.name ?? "Unknown"}`,
                secondary: `${d.site_name} • ${d.purpose}`,
                meta: format(new Date(d.started_at), "Pp"),
                badge: { text: d.status, color: d.status === "active" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground" },
              };
            })}
          />
        </TabsContent>

        {/* ==================== HEALTH ==================== */}
        <TabsContent value="health">
          <ListTable
            empty="No health records."
            rows={health.map((h) => {
              const u = units.find((x) => x.id === h.k9_unit_id);
              return {
                key: h.id,
                primary: `${u?.name ?? "Unknown"} — ${h.record_type}`,
                secondary: [h.vet_name, h.diagnosis].filter(Boolean).join(" • ") || "—",
                meta: format(new Date(h.performed_at), "PP"),
                badge: h.next_due_at ? { text: `Next: ${h.next_due_at}`, color: "bg-amber-500/20 text-amber-600" } : undefined,
              };
            })}
          />
        </TabsContent>

        {/* ==================== TRAINING ==================== */}
        <TabsContent value="training">
          <ListTable
            empty="No training sessions."
            rows={training.map((t) => {
              const u = units.find((x) => x.id === t.k9_unit_id);
              return {
                key: t.id,
                primary: `${u?.name ?? "Unknown"} — ${t.session_type}`,
                secondary: [t.instructor, t.duration_minutes ? `${t.duration_minutes}m` : null].filter(Boolean).join(" • ") || "—",
                meta: format(new Date(t.performed_at), "PP"),
                badge: { text: t.pass ? `PASS${t.score != null ? ` ${t.score}` : ""}` : "FAIL",
                  color: t.pass ? "bg-emerald-500/20 text-emerald-600" : "bg-destructive/20 text-destructive" },
              };
            })}
          />
        </TabsContent>

        {/* ==================== INCIDENTS ==================== */}
        <TabsContent value="incidents">
          <ListTable
            empty="No incidents logged."
            rows={incidents.map((i) => {
              const u = units.find((x) => x.id === i.k9_unit_id);
              return {
                key: i.id,
                primary: `${u?.name ?? "Unknown"} — ${i.incident_type}`,
                secondary: i.description,
                meta: format(new Date(i.occurred_at), "Pp"),
                badge: { text: i.severity, color:
                  i.severity === "critical" ? "bg-destructive/20 text-destructive" :
                  i.severity === "high" ? "bg-orange-500/20 text-orange-600" :
                  i.severity === "medium" ? "bg-amber-500/20 text-amber-600" :
                  "bg-muted text-muted-foreground" },
              };
            })}
          />
        </TabsContent>
      </Tabs>

      <K9DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} unit={selected} />
      {deployUnitId && (
        <K9DeployDialog open={!!deployUnitId} onOpenChange={(v) => !v && setDeployUnitId(null)}
          unitId={deployUnitId} defaultHandlerId={units.find((u) => u.id === deployUnitId)?.handler_id ?? null} />
      )}
      <K9RecallDialog
        open={!!recallDeployId}
        onOpenChange={(v) => !v && setRecallDeployId(null)}
        deployment={deployments.find((d) => d.id === recallDeployId) ?? null}
      />
    </div>
  );
};

// ---------- small render helpers (kept local to avoid extra files) ----------
const Kpi = ({ icon: Icon, label, value, tone }: any) => (
  <Card className="p-3">
    <div className="flex items-center gap-2">
      <Icon className={`w-6 h-6 ${tone}`} />
      <div>
        <p className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  </Card>
);

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</p>
    <p className="font-medium truncate">{value}</p>
  </div>
);

const ListTable = ({ rows, empty }: {
  empty: string;
  rows: Array<{ key: string; primary: string; secondary: string; meta: string; badge?: { text: string; color: string } }>;
}) => {
  if (!rows.length) return <Card className="p-8 text-center text-muted-foreground">{empty}</Card>;
  return (
    <Card className="divide-y divide-border">
      {rows.map((r) => (
        <div key={r.key} className="p-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{r.primary}</p>
            <p className="text-xs text-muted-foreground truncate">{r.secondary}</p>
          </div>
          <p className="text-xs text-muted-foreground whitespace-nowrap">{r.meta}</p>
          {r.badge && <Badge className={r.badge.color}>{r.badge.text}</Badge>}
        </div>
      ))}
    </Card>
  );
};

export default K9;
