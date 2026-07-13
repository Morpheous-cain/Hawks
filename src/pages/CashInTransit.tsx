import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Coins, Truck, KeyRound, MapPin, Users, AlertTriangle, FileText, Plus, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

/**
 * Cash & In-Transit (CIT) Department — fully functional module.
 * Six surfaces sharing one shell: Runs, Manifests, Vault, Routes, Crews, Incidents.
 * URL paths drive the active tab so existing /cit/* routes continue to deep-link.
 */

type TabKey = "runs" | "manifests" | "vault" | "routes" | "crews" | "incidents";

const TABS: { key: TabKey; path: string; label: string; icon: any }[] = [
  { key: "runs",      path: "/cit/runs",      label: "Runs",       icon: Truck },
  { key: "manifests", path: "/cit/manifests", label: "Manifests",  icon: FileText },
  { key: "vault",     path: "/cit/vault",     label: "Vault",      icon: KeyRound },
  { key: "routes",    path: "/cit/routes",    label: "Route Risk", icon: MapPin },
  { key: "crews",     path: "/cit/crews",     label: "Crews",      icon: Users },
  { key: "incidents", path: "/cit/incidents", label: "Incidents",  icon: AlertTriangle },
];

const sb: any = supabase;

const sevColor = (s?: string) =>
  s === "critical" ? "bg-red-600 text-white"
  : s === "high"   ? "bg-orange-500 text-white"
  : s === "medium" ? "bg-amber-500 text-white"
  : "bg-muted text-foreground";

const statusColor = (s?: string) =>
  ["completed","delivered","resolved","closed","available"].includes(s ?? "")
    ? "bg-emerald-600 text-white"
  : ["in_transit","dispatched","investigating","on_run","signed"].includes(s ?? "")
    ? "bg-blue-600 text-white"
  : ["scheduled","draft","open"].includes(s ?? "")
    ? "bg-slate-500 text-white"
  : ["aborted","disputed","suspended"].includes(s ?? "")
    ? "bg-red-600 text-white"
    : "bg-muted";

const money = (n: any, ccy = "KES") =>
  `${ccy} ${Number(n ?? 0).toLocaleString()}`;

const fmt = (d?: string | null) =>
  d ? format(new Date(d), "dd MMM yyyy HH:mm") : "—";

const CashInTransit = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active: TabKey =
    (TABS.find((t) => pathname.startsWith(t.path))?.key) ??
    (pathname === "/cit" ? "runs" : "runs");

  // Data state
  const [runs, setRuns] = useState<any[]>([]);
  const [manifests, setManifests] = useState<any[]>([]);
  const [vault, setVault] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [crews, setCrews] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<TabKey | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r, m, v, rt, c, i] = await Promise.all([
        sb.from("cit_runs").select("*, cit_routes(name), cit_crews(crew_name)").order("scheduled_at", { ascending: false }).limit(200),
        sb.from("cit_manifests").select("*, cit_runs(run_number)").order("created_at", { ascending: false }).limit(200),
        sb.from("cit_vault_movements").select("*").order("occurred_at", { ascending: false }).limit(200),
        sb.from("cit_routes").select("*").order("created_at", { ascending: false }).limit(200),
        sb.from("cit_crews").select("*").order("created_at", { ascending: false }).limit(200),
        sb.from("cit_incidents").select("*, cit_runs(run_number)").order("occurred_at", { ascending: false }).limit(200),
      ]);
      setRuns(r.data ?? []);
      setManifests(m.data ?? []);
      setVault(v.data ?? []);
      setRoutes(rt.data ?? []);
      setCrews(c.data ?? []);
      setIncidents(i.data ?? []);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load CIT data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel("cit-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cit_runs" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "cit_manifests" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "cit_vault_movements" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "cit_routes" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "cit_crews" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "cit_incidents" }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => ({
    active: runs.filter((r) => ["scheduled", "dispatched", "in_transit"].includes(r.status)).length,
    cashInTransit: runs
      .filter((r) => ["dispatched","in_transit"].includes(r.status))
      .reduce((s, r) => s + Number(r.cash_amount ?? 0), 0),
    incidentsOpen: incidents.filter((i) => i.status === "open" || i.status === "investigating").length,
    crewsAvail: crews.filter((c) => c.status === "available").length,
  }), [runs, incidents, crews]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-md">
            <Coins className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Cash & In-Transit Department
            </div>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">CIT Operations</h1>
            <p className="text-sm text-muted-foreground">
              Runs, manifests, vault custody, route risk & crew command.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Badge variant="outline" className="border-yellow-500/40 text-yellow-600">CIT · Live</Badge>
        </div>
      </header>

      {/* KPI tiles */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiTile label="Active runs" value={totals.active.toString()} />
        <KpiTile label="Cash in transit" value={money(totals.cashInTransit)} />
        <KpiTile label="Open incidents" value={totals.incidentsOpen.toString()} accent={totals.incidentsOpen ? "warn" : undefined} />
        <KpiTile label="Crews available" value={totals.crewsAvail.toString()} />
      </section>

      {/* Tabs */}
      <Tabs value={active} onValueChange={(v) => navigate(TABS.find((t) => t.key === v)!.path)}>
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="gap-1.5 text-xs">
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold capitalize">{TABS.find((t) => t.key === active)?.label}</h2>
        <Button size="sm" onClick={() => setDialog(active)}>
          <Plus className="mr-1 h-4 w-4" /> New {active.replace(/s$/, "")}
        </Button>
      </div>

      {/* Lists */}
      <Card className="p-0 overflow-hidden">
        {active === "runs" && <RunsList rows={runs} />}
        {active === "manifests" && <ManifestsList rows={manifests} />}
        {active === "vault" && <VaultList rows={vault} />}
        {active === "routes" && <RoutesList rows={routes} />}
        {active === "crews" && <CrewsList rows={crews} />}
        {active === "incidents" && <IncidentsList rows={incidents} />}
      </Card>

      {/* Create dialogs */}
      <CreateRunDialog open={dialog === "runs"} onClose={() => setDialog(null)} routes={routes} crews={crews} onCreated={loadAll} />
      <CreateManifestDialog open={dialog === "manifests"} onClose={() => setDialog(null)} runs={runs} onCreated={loadAll} />
      <CreateVaultDialog open={dialog === "vault"} onClose={() => setDialog(null)} runs={runs} onCreated={loadAll} />
      <CreateRouteDialog open={dialog === "routes"} onClose={() => setDialog(null)} onCreated={loadAll} />
      <CreateCrewDialog open={dialog === "crews"} onClose={() => setDialog(null)} onCreated={loadAll} />
      <CreateIncidentDialog open={dialog === "incidents"} onClose={() => setDialog(null)} runs={runs} onCreated={loadAll} />
    </div>
  );
};

export default CashInTransit;

/* ---------------------------- Pieces ---------------------------- */

const KpiTile = ({ label, value, accent }: { label: string; value: string; accent?: "warn" }) => (
  <Card className={`p-4 ${accent === "warn" ? "border-orange-500/40" : ""}`}>
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className={`mt-1 text-xl font-semibold ${accent === "warn" ? "text-orange-500" : ""}`}>{value}</div>
  </Card>
);

const EmptyRow = ({ label }: { label: string }) => (
  <div className="px-4 py-10 text-center text-sm text-muted-foreground">No {label} yet — click “New” to add the first one.</div>
);

const RunsList = ({ rows }: { rows: any[] }) =>
  rows.length === 0 ? <EmptyRow label="runs" /> : (
    <div className="divide-y">
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-6 md:items-center">
          <div className="font-mono text-xs">{r.run_number}</div>
          <div className="text-sm">{r.client_name ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{r.cit_routes?.name ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{r.cit_crews?.crew_name ?? "—"}</div>
          <div className="text-xs">{money(r.cash_amount, r.currency)}</div>
          <div className="flex items-center justify-between gap-2">
            <Badge className={statusColor(r.status)}>{r.status}</Badge>
            <span className="text-[10px] text-muted-foreground">{fmt(r.scheduled_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );

const ManifestsList = ({ rows }: { rows: any[] }) =>
  rows.length === 0 ? <EmptyRow label="manifests" /> : (
    <div className="divide-y">
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-5 md:items-center">
          <div className="font-mono text-xs">{r.manifest_number}</div>
          <div className="text-xs text-muted-foreground">{r.cit_runs?.run_number ?? "—"}</div>
          <div className="text-sm">{money(r.declared_amount, r.currency)}</div>
          <div className="text-xs">Seals: {(r.seal_numbers ?? []).join(", ") || "—"}</div>
          <Badge className={statusColor(r.status)}>{r.status}</Badge>
        </div>
      ))}
    </div>
  );

const VaultList = ({ rows }: { rows: any[] }) =>
  rows.length === 0 ? <EmptyRow label="vault movements" /> : (
    <div className="divide-y">
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-6 md:items-center">
          <div className="font-mono text-xs">{r.movement_number}</div>
          <Badge variant="outline">{r.movement_type}</Badge>
          <div className="text-sm">{money(r.amount, r.currency)}</div>
          <div className="text-xs">{r.from_party ?? "—"} →</div>
          <div className="text-xs">{r.to_party ?? "—"}</div>
          <div className="text-[10px] text-muted-foreground">{fmt(r.occurred_at)}</div>
        </div>
      ))}
    </div>
  );

const RoutesList = ({ rows }: { rows: any[] }) =>
  rows.length === 0 ? <EmptyRow label="routes" /> : (
    <div className="divide-y">
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-5 md:items-center">
          <div className="font-mono text-xs">{r.route_code}</div>
          <div className="text-sm">{r.name}</div>
          <div className="text-xs text-muted-foreground">{r.origin ?? "—"} → {r.destination ?? "—"}</div>
          <div className="text-xs">{r.distance_km ? `${r.distance_km} km` : "—"}</div>
          <Badge className={sevColor(r.risk_grade)}>{r.risk_grade}</Badge>
        </div>
      ))}
    </div>
  );

const CrewsList = ({ rows }: { rows: any[] }) =>
  rows.length === 0 ? <EmptyRow label="crews" /> : (
    <div className="divide-y">
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-5 md:items-center">
          <div className="font-mono text-xs">{r.crew_code}</div>
          <div className="text-sm">{r.crew_name}</div>
          <div className="text-xs text-muted-foreground">Cmdr: {r.commander ?? "—"} · Drv: {r.driver ?? "—"}</div>
          <div className="text-xs">{r.vehicle_reg ?? "—"}</div>
          <Badge className={statusColor(r.status)}>{r.status}</Badge>
        </div>
      ))}
    </div>
  );

const IncidentsList = ({ rows }: { rows: any[] }) =>
  rows.length === 0 ? <EmptyRow label="incidents" /> : (
    <div className="divide-y">
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-5 md:items-center">
          <div className="font-mono text-xs">{r.incident_number}</div>
          <div className="text-sm">{r.incident_type ?? "—"}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{r.description ?? r.location ?? "—"}</div>
          <Badge className={sevColor(r.severity)}>{r.severity}</Badge>
          <div className="flex items-center justify-between gap-2">
            <Badge className={statusColor(r.status)}>{r.status}</Badge>
            <span className="text-[10px] text-muted-foreground">{fmt(r.occurred_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );

/* ---------------------------- Dialogs ---------------------------- */

const useUid = () => {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);
  return uid;
};

const Shell = ({
  open, onClose, title, description, onSubmit, busy, children,
}: any) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <div className="space-y-3 py-2">{children}</div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button onClick={onSubmit} disabled={busy}>{busy ? "Saving…" : "Create"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const CreateRunDialog = ({ open, onClose, routes, crews, onCreated }: any) => {
  const uid = useUid();
  const [form, setForm] = useState<any>({ client_name: "", route_id: "", crew_id: "", cash_amount: 0, currency: "KES", notes: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) setForm({ client_name: "", route_id: "", crew_id: "", cash_amount: 0, currency: "KES", notes: "" }); }, [open]);
  const submit = async () => {
    setBusy(true);
    const { error } = await sb.from("cit_runs").insert({
      client_name: form.client_name || null,
      route_id: form.route_id || null,
      crew_id: form.crew_id || null,
      cash_amount: Number(form.cash_amount) || 0,
      currency: form.currency,
      notes: form.notes || null,
      created_by: uid,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("CIT run created");
    onCreated(); onClose();
  };
  return (
    <Shell open={open} onClose={onClose} title="New CIT Run" onSubmit={submit} busy={busy}>
      <Field label="Client"><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="e.g. Equity Bank — Westlands branch" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Route">
          <Select value={form.route_id} onValueChange={(v) => setForm({ ...form, route_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
            <SelectContent>{routes.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Crew">
          <Select value={form.crew_id} onValueChange={(v) => setForm({ ...form, crew_id: v })}>
            <SelectTrigger><SelectValue placeholder="Select crew" /></SelectTrigger>
            <SelectContent>{crews.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.crew_name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cash amount"><Input type="number" value={form.cash_amount} onChange={(e) => setForm({ ...form, cash_amount: e.target.value })} /></Field>
        <Field label="Currency"><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></Field>
      </div>
      <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
    </Shell>
  );
};

const CreateManifestDialog = ({ open, onClose, runs, onCreated }: any) => {
  const uid = useUid();
  const [form, setForm] = useState<any>({ run_id: "", declared_amount: 0, currency: "KES", seal_numbers: "", signed_by_sender: "", notes: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) setForm({ run_id: "", declared_amount: 0, currency: "KES", seal_numbers: "", signed_by_sender: "", notes: "" }); }, [open]);
  const submit = async () => {
    setBusy(true);
    const { error } = await sb.from("cit_manifests").insert({
      run_id: form.run_id || null,
      declared_amount: Number(form.declared_amount) || 0,
      currency: form.currency,
      seal_numbers: form.seal_numbers ? form.seal_numbers.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      signed_by_sender: form.signed_by_sender || null,
      notes: form.notes || null,
      created_by: uid,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Manifest created"); onCreated(); onClose();
  };
  return (
    <Shell open={open} onClose={onClose} title="New Cash Manifest" onSubmit={submit} busy={busy}>
      <Field label="Run">
        <Select value={form.run_id} onValueChange={(v) => setForm({ ...form, run_id: v })}>
          <SelectTrigger><SelectValue placeholder="Link to run" /></SelectTrigger>
          <SelectContent>{runs.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.run_number} — {r.client_name ?? ""}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Declared amount"><Input type="number" value={form.declared_amount} onChange={(e) => setForm({ ...form, declared_amount: e.target.value })} /></Field>
        <Field label="Currency"><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></Field>
      </div>
      <Field label="Seal numbers (comma separated)"><Input value={form.seal_numbers} onChange={(e) => setForm({ ...form, seal_numbers: e.target.value })} /></Field>
      <Field label="Signed by sender"><Input value={form.signed_by_sender} onChange={(e) => setForm({ ...form, signed_by_sender: e.target.value })} /></Field>
      <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
    </Shell>
  );
};

const CreateVaultDialog = ({ open, onClose, runs, onCreated }: any) => {
  const uid = useUid();
  const [form, setForm] = useState<any>({ movement_type: "inbound", amount: 0, currency: "KES", from_party: "", to_party: "", run_id: "", notes: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) setForm({ movement_type: "inbound", amount: 0, currency: "KES", from_party: "", to_party: "", run_id: "", notes: "" }); }, [open]);
  const submit = async () => {
    setBusy(true);
    const { error } = await sb.from("cit_vault_movements").insert({
      movement_type: form.movement_type,
      amount: Number(form.amount) || 0,
      currency: form.currency,
      from_party: form.from_party || null,
      to_party: form.to_party || null,
      run_id: form.run_id || null,
      notes: form.notes || null,
      created_by: uid,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Vault movement recorded"); onCreated(); onClose();
  };
  return (
    <Shell open={open} onClose={onClose} title="New Vault Movement" onSubmit={submit} busy={busy}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Select value={form.movement_type} onValueChange={(v) => setForm({ ...form, movement_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Amount"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="From"><Input value={form.from_party} onChange={(e) => setForm({ ...form, from_party: e.target.value })} /></Field>
        <Field label="To"><Input value={form.to_party} onChange={(e) => setForm({ ...form, to_party: e.target.value })} /></Field>
      </div>
      <Field label="Related run (optional)">
        <Select value={form.run_id} onValueChange={(v) => setForm({ ...form, run_id: v })}>
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>{runs.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.run_number}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
    </Shell>
  );
};

const CreateRouteDialog = ({ open, onClose, onCreated }: any) => {
  const uid = useUid();
  const [form, setForm] = useState<any>({ name: "", origin: "", destination: "", risk_grade: "medium", distance_km: "", notes: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) setForm({ name: "", origin: "", destination: "", risk_grade: "medium", distance_km: "", notes: "" }); }, [open]);
  const submit = async () => {
    if (!form.name) return toast.error("Route name required");
    setBusy(true);
    const { error } = await sb.from("cit_routes").insert({
      name: form.name,
      origin: form.origin || null,
      destination: form.destination || null,
      risk_grade: form.risk_grade,
      distance_km: form.distance_km ? Number(form.distance_km) : null,
      notes: form.notes || null,
      created_by: uid,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Route added"); onCreated(); onClose();
  };
  return (
    <Shell open={open} onClose={onClose} title="New CIT Route" onSubmit={submit} busy={busy}>
      <Field label="Route name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Origin"><Input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} /></Field>
        <Field label="Destination"><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Risk grade">
          <Select value={form.risk_grade} onValueChange={(v) => setForm({ ...form, risk_grade: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Distance (km)"><Input type="number" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} /></Field>
      </div>
      <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
    </Shell>
  );
};

const CreateCrewDialog = ({ open, onClose, onCreated }: any) => {
  const uid = useUid();
  const [form, setForm] = useState<any>({ crew_name: "", commander: "", driver: "", guards: "", vehicle_reg: "", status: "available", notes: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) setForm({ crew_name: "", commander: "", driver: "", guards: "", vehicle_reg: "", status: "available", notes: "" }); }, [open]);
  const submit = async () => {
    if (!form.crew_name) return toast.error("Crew name required");
    setBusy(true);
    const { error } = await sb.from("cit_crews").insert({
      crew_name: form.crew_name,
      commander: form.commander || null,
      driver: form.driver || null,
      guards: form.guards ? form.guards.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      vehicle_reg: form.vehicle_reg || null,
      status: form.status,
      notes: form.notes || null,
      created_by: uid,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Crew added"); onCreated(); onClose();
  };
  return (
    <Shell open={open} onClose={onClose} title="New CIT Crew" onSubmit={submit} busy={busy}>
      <Field label="Crew name"><Input value={form.crew_name} onChange={(e) => setForm({ ...form, crew_name: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Commander"><Input value={form.commander} onChange={(e) => setForm({ ...form, commander: e.target.value })} /></Field>
        <Field label="Driver"><Input value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} /></Field>
      </div>
      <Field label="Guards (comma separated)"><Input value={form.guards} onChange={(e) => setForm({ ...form, guards: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Vehicle reg"><Input value={form.vehicle_reg} onChange={(e) => setForm({ ...form, vehicle_reg: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on_run">On run</SelectItem>
              <SelectItem value="off_duty">Off duty</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
    </Shell>
  );
};

const CreateIncidentDialog = ({ open, onClose, runs, onCreated }: any) => {
  const uid = useUid();
  const [form, setForm] = useState<any>({ run_id: "", severity: "medium", incident_type: "", location: "", description: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) setForm({ run_id: "", severity: "medium", incident_type: "", location: "", description: "" }); }, [open]);
  const submit = async () => {
    setBusy(true);
    const { error } = await sb.from("cit_incidents").insert({
      run_id: form.run_id || null,
      severity: form.severity,
      incident_type: form.incident_type || null,
      location: form.location || null,
      description: form.description || null,
      reported_by: uid,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Incident logged"); onCreated(); onClose();
  };
  return (
    <Shell open={open} onClose={onClose} title="New CIT Incident" onSubmit={submit} busy={busy}>
      <Field label="Related run (optional)">
        <Select value={form.run_id} onValueChange={(v) => setForm({ ...form, run_id: v })}>
          <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
          <SelectContent>{runs.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.run_number}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Severity">
          <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Type"><Input value={form.incident_type} onChange={(e) => setForm({ ...form, incident_type: e.target.value })} placeholder="e.g. attempted robbery" /></Field>
      </div>
      <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
      <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
    </Shell>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs">{label}</Label>
    {children}
  </div>
);
