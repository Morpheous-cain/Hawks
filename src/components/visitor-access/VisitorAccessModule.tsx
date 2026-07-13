import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UserPlus, ShieldAlert, LogIn, LogOut, Users } from "lucide-react";

interface Pass {
  id: string;
  pass_number: string | null;
  full_name: string;
  id_number: string | null;
  phone: string | null;
  company: string | null;
  purpose: string;
  vehicle_reg: string | null;
  badge_no: string | null;
  valid_from: string;
  valid_to: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  status: string;
  watchlist_match: boolean;
  notes: string | null;
}

const statusTone: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-primary/15 text-primary border border-primary/30",
  checked_in: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  checked_out: "bg-muted text-muted-foreground",
  expired: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  revoked: "bg-destructive/15 text-destructive border border-destructive/30",
};

export const VisitorAccessModule = () => {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    id_number: "",
    phone: "",
    company: "",
    purpose: "",
    vehicle_reg: "",
    badge_no: "",
    valid_to: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visitor_passes" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setPasses((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("visitor-passes")
      .on("postgres_changes", { event: "*", schema: "public", table: "visitor_passes" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const submit = async () => {
    if (!form.full_name || !form.purpose || !form.valid_to) {
      toast.error("Full name, purpose and valid-to are required");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("visitor_passes" as any).insert({
      ...form,
      valid_from: new Date().toISOString(),
      valid_to: new Date(form.valid_to).toISOString(),
      status: "approved",
      created_by: user?.id,
    } as any);
    if (error) return toast.error(error.message);
    toast.success("Visitor pass issued");
    setOpen(false);
    setForm({ full_name: "", id_number: "", phone: "", company: "", purpose: "", vehicle_reg: "", badge_no: "", valid_to: "", notes: "" });
  };

  const setStatus = async (p: Pass, status: string, extra: Record<string, any> = {}) => {
    const { error } = await supabase.from("visitor_passes" as any).update({ status, ...extra } as any).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(`Pass ${status.replace("_", " ")}`);
  };

  const onSite = passes.filter(p => p.status === "checked_in");
  const watchlistHits = passes.filter(p => p.watchlist_match && p.status !== "revoked");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-foreground">Visitor & Access Management</h2>
          <p className="text-sm text-muted-foreground">Pre-clearance, badge issue, on-site tracking and watchlist enforcement.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="h-4 w-4" /> New Visitor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Issue Visitor Pass</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Full name *</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>ID number</Label><Input value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Company</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
              <div><Label>Vehicle reg</Label><Input value={form.vehicle_reg} onChange={e => setForm({ ...form, vehicle_reg: e.target.value })} /></div>
              <div><Label>Badge #</Label><Input value={form.badge_no} onChange={e => setForm({ ...form, badge_no: e.target.value })} /></div>
              <div><Label>Valid until *</Label><Input type="datetime-local" value={form.valid_to} onChange={e => setForm({ ...form, valid_to: e.target.value })} /></div>
              <div className="col-span-2"><Label>Purpose *</Label><Input value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></div>
              <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <Button onClick={submit} className="w-full">Issue Pass</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="hud-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">On Site</p>
          <p className="mt-1 font-mono text-3xl text-primary kpi-glow">{onSite.length}</p>
        </Card>
        <Card className="hud-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Active Today</p>
          <p className="mt-1 font-mono text-3xl">{passes.filter(p => p.status !== "expired" && p.status !== "revoked").length}</p>
        </Card>
        <Card className="hud-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Watchlist Hits</p>
          <p className="mt-1 font-mono text-3xl text-destructive">{watchlistHits.length}</p>
        </Card>
        <Card className="hud-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Issued</p>
          <p className="mt-1 font-mono text-3xl">{passes.length}</p>
        </Card>
      </div>

      {watchlistHits.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-sm font-semibold">{watchlistHits.length} watchlist match(es) require attention</span>
          </div>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="onsite">On Site ({onSite.length})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        {(["active", "onsite", "all"] as const).map(tab => {
          const list = tab === "active" ? passes.filter(p => ["approved", "checked_in", "pending"].includes(p.status))
            : tab === "onsite" ? onSite : passes;
          return (
            <TabsContent key={tab} value={tab}>
              <Card className="overflow-hidden">
                <div className="divide-y divide-border">
                  {loading ? <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
                  : list.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No passes</div>
                  : list.map(p => (
                    <div key={p.id} className="flex flex-wrap items-center gap-3 p-3 hover:bg-muted/30">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{p.full_name}</span>
                          {p.watchlist_match && <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> Watchlist</Badge>}
                          <span className={`rounded px-2 py-0.5 text-[10px] uppercase ${statusTone[p.status] || statusTone.pending}`}>{p.status.replace("_", " ")}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {p.pass_number} · {p.purpose}{p.company ? ` · ${p.company}` : ""}{p.vehicle_reg ? ` · ${p.vehicle_reg}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {p.status === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => setStatus(p, "checked_in", { checked_in_at: new Date().toISOString() })}>
                            <LogIn className="mr-1 h-3 w-3" /> Check in
                          </Button>
                        )}
                        {p.status === "checked_in" && (
                          <Button size="sm" variant="outline" onClick={() => setStatus(p, "checked_out", { checked_out_at: new Date().toISOString() })}>
                            <LogOut className="mr-1 h-3 w-3" /> Check out
                          </Button>
                        )}
                        {!["checked_out", "revoked"].includes(p.status) && (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(p, "revoked")}>Revoke</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default VisitorAccessModule;
