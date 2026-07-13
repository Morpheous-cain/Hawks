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
import { Plus, ArrowDownToLine, ArrowUpFromLine, Wrench, AlertTriangle, Package } from "lucide-react";

interface Asset {
  id: string;
  asset_tag: string | null;
  asset_type: string;
  model: string | null;
  serial_number: string | null;
  status: string;
  condition: string;
  assigned_to: string | null;
  next_service_date: string | null;
  certification_expires_at: string | null;
}
interface Move {
  id: string;
  asset_id: string;
  action: string;
  occurred_at: string;
  notes: string | null;
  officer_id: string | null;
}

const statusTone: Record<string, string> = {
  available: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  issued: "bg-primary/15 text-primary border border-primary/30",
  maintenance: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  lost: "bg-destructive/15 text-destructive border border-destructive/30",
  damaged: "bg-destructive/15 text-destructive border border-destructive/30",
  retired: "bg-muted text-muted-foreground",
};

export const ArmouryCustodyModule = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [movements, setMovements] = useState<Move[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [moveDialog, setMoveDialog] = useState<{ asset: Asset; action: string } | null>(null);
  const [moveOfficer, setMoveOfficer] = useState<string>("");
  const [moveNotes, setMoveNotes] = useState("");
  const [form, setForm] = useState({ asset_type: "radio", model: "", serial_number: "", condition: "good", certification_expires_at: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [a, m, s] = await Promise.all([
      supabase.from("armoury_assets" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("armoury_movements" as any).select("*").order("occurred_at", { ascending: false }).limit(50),
      supabase.from("staff").select("id, full_name").limit(500),
    ]);
    setAssets((a.data as any) || []);
    setMovements((m.data as any) || []);
    setStaff(s.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("armoury")
      .on("postgres_changes", { event: "*", schema: "public", table: "armoury_assets" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "armoury_movements" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const createAsset = async () => {
    if (!form.serial_number) return toast.error("Serial number required");
    if (saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("armoury_assets" as any).insert(form as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Asset registered");
      setOpenNew(false);
    } finally { setSaving(false); }
  };

  const submitMove = async () => {
    if (!moveDialog || saving) return;
    if (["issue", "transfer"].includes(moveDialog.action) && !moveOfficer) return toast.error("Pick an officer");
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("armoury_movements" as any).insert({
        asset_id: moveDialog.asset.id,
        action: moveDialog.action,
        officer_id: moveOfficer || null,
        notes: moveNotes || null,
        created_by: user?.id,
      } as any);
      if (error) { toast.error(error.message); return; }
      toast.success(`${moveDialog.action} logged`);
      setMoveDialog(null); setMoveOfficer(""); setMoveNotes("");
    } finally { setSaving(false); }
  };

  const staffName = (id: string | null) => staff.find(s => s.id === id)?.full_name || "—";
  const expiringSoon = assets.filter(a => a.certification_expires_at && new Date(a.certification_expires_at).getTime() - Date.now() < 30 * 86400_000);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-foreground">Asset & Armoury Custody</h2>
          <p className="text-sm text-muted-foreground">Chain of custody for firearms, radios, BWC, batons & kit. Auto status updates.</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Register Asset</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Armoury Asset</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <Select value={form.asset_type} onValueChange={v => setForm({ ...form, asset_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["firearm","radio","bwc","baton","cuffs","vest","taser","kit","other"].map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Condition</Label>
                <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["new","good","fair","poor","unserviceable"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Model</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
              <div><Label>Serial *</Label><Input value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} /></div>
              <div className="col-span-2"><Label>Certification expiry</Label><Input type="date" value={form.certification_expires_at} onChange={e => setForm({ ...form, certification_expires_at: e.target.value })} /></div>
            </div>
            <Button onClick={createAsset} className="w-full" disabled={saving}>{saving ? "Registering…" : "Register"}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="hud-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Assets</p>
          <p className="mt-1 font-mono text-3xl text-primary kpi-glow">{assets.length}</p>
        </Card>
        <Card className="hud-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Issued</p>
          <p className="mt-1 font-mono text-3xl">{assets.filter(a => a.status === "issued").length}</p>
        </Card>
        <Card className="hud-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">In Maintenance</p>
          <p className="mt-1 font-mono text-3xl text-amber-400">{assets.filter(a => a.status === "maintenance").length}</p>
        </Card>
        <Card className="hud-card p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Lost / Damaged</p>
          <p className="mt-1 font-mono text-3xl text-destructive">{assets.filter(a => ["lost","damaged"].includes(a.status)).length}</p>
        </Card>
      </div>

      {expiringSoon.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">{expiringSoon.length} asset(s) certification expiring within 30 days</span>
          </div>
        </Card>
      )}

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="movements">Chain of Custody</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              {loading ? <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
              : assets.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No assets registered</div>
              : assets.map(a => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 p-3 hover:bg-muted/30">
                  <Package className="h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{a.asset_tag}</span>
                      <span className="font-medium text-foreground">{a.asset_type.toUpperCase()} · {a.model || a.serial_number}</span>
                      <span className={`rounded px-2 py-0.5 text-[10px] uppercase ${statusTone[a.status] || statusTone.available}`}>{a.status}</span>
                      <Badge variant="outline" className="text-[10px]">{a.condition}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Holder: {staffName(a.assigned_to)}
                      {a.certification_expires_at && ` · Cert: ${new Date(a.certification_expires_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {a.status === "available" && (
                      <Button size="sm" variant="outline" onClick={() => setMoveDialog({ asset: a, action: "issue" })}>
                        <ArrowUpFromLine className="mr-1 h-3 w-3" /> Issue
                      </Button>
                    )}
                    {a.status === "issued" && (
                      <Button size="sm" variant="outline" onClick={() => setMoveDialog({ asset: a, action: "return" })}>
                        <ArrowDownToLine className="mr-1 h-3 w-3" /> Return
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setMoveDialog({ asset: a, action: "service" })}>
                      <Wrench className="mr-1 h-3 w-3" /> Service
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card className="overflow-hidden">
            <div className="divide-y divide-border">
              {movements.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No movements yet</div>
              : movements.map(m => {
                const a = assets.find(x => x.id === m.asset_id);
                return (
                  <div key={m.id} className="grid grid-cols-12 gap-3 p-3 text-sm">
                    <div className="col-span-3 font-mono text-xs text-muted-foreground">{new Date(m.occurred_at).toLocaleString()}</div>
                    <div className="col-span-2"><Badge variant="outline" className="uppercase">{m.action}</Badge></div>
                    <div className="col-span-3 truncate">{a?.asset_tag || m.asset_id.slice(0, 8)}</div>
                    <div className="col-span-2 truncate">{staffName(m.officer_id)}</div>
                    <div className="col-span-2 truncate text-muted-foreground">{m.notes || "—"}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!moveDialog} onOpenChange={(o) => !o && setMoveDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="capitalize">{moveDialog?.action} Asset</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{moveDialog?.asset.asset_tag} · {moveDialog?.asset.model}</p>
            {["issue", "transfer"].includes(moveDialog?.action || "") && (
              <div>
                <Label>Officer</Label>
                <Select value={moveOfficer} onValueChange={setMoveOfficer}>
                  <SelectTrigger><SelectValue placeholder="Select officer" /></SelectTrigger>
                  <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Notes</Label><Textarea rows={2} value={moveNotes} onChange={e => setMoveNotes(e.target.value)} /></div>
            <Button onClick={submitMove} className="w-full" disabled={saving}>{saving ? "Saving…" : "Confirm"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArmouryCustodyModule;
