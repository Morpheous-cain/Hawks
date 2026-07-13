import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOfficerAssignments } from "@/hooks/useOfficerAssignments";

export const KeyAssetCustody = () => {
  const { staffRecord, assignedSites } = useOfficerAssignments();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ asset_label: "", asset_serial: "", issued_to: "", issued_to_id: "" });
  const siteId = (assignedSites as any)?.[0]?.id;

  const load = async () => {
    const { data } = await (supabase as any)
      .from("key_custody_logs").select("*").order("issued_at", { ascending: false }).limit(30);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const issue = async () => {
    if (!form.asset_label || !form.issued_to) return toast.error("Asset and recipient required");
    const { error } = await (supabase as any).from("key_custody_logs").insert({
      ...form, site_id: siteId, staff_id: staffRecord?.id,
    });
    if (error) return toast.error(error.message);
    setForm({ asset_label: "", asset_serial: "", issued_to: "", issued_to_id: "" });
    toast.success("Issued"); load();
  };

  const ret = async (id: string) => {
    const { error } = await (supabase as any).from("key_custody_logs").update({ returned_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Returned"); load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Key className="h-4 w-4 text-primary" /> Issue Asset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div><Label>Asset</Label><Input placeholder="Master key, radio…" value={form.asset_label} onChange={(e) => setForm({ ...form, asset_label: e.target.value })} /></div>
            <div><Label>Serial</Label><Input value={form.asset_serial} onChange={(e) => setForm({ ...form, asset_serial: e.target.value })} /></div>
            <div><Label>Issued To *</Label><Input value={form.issued_to} onChange={(e) => setForm({ ...form, issued_to: e.target.value })} /></div>
            <div><Label>ID Number</Label><Input value={form.issued_to_id} onChange={(e) => setForm({ ...form, issued_to_id: e.target.value })} /></div>
          </div>
          <Button onClick={issue} className="w-full">Issue</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Custody Register</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 && <p className="text-xs text-muted-foreground">Empty.</p>}
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-2 rounded border border-border/40 bg-muted/30 p-2 text-xs">
              <div className="min-w-0">
                <p className="truncate font-medium">{i.asset_label} → {i.issued_to}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(i.issued_at).toLocaleString()}</p>
              </div>
              {i.returned_at ? <Badge variant="outline">Returned</Badge> :
                <Button size="sm" variant="outline" onClick={() => ret(i.id)} className="gap-1"><RotateCcw className="h-3 w-3" /> Return</Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default KeyAssetCustody;
