import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOfficerAssignments } from "@/hooks/useOfficerAssignments";

export const ParcelDeliveryLog = () => {
  const { staffRecord, assignedSites } = useOfficerAssignments();
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ tracking_number: "", courier: "", sender: "", recipient: "", description: "" });
  const siteId = (assignedSites as any)?.[0]?.id;

  const load = async () => {
    const { data } = await (supabase as any)
      .from("parcel_logs").select("*").order("received_at", { ascending: false }).limit(30);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const receive = async () => {
    if (!form.recipient) return toast.error("Recipient required");
    const { error } = await (supabase as any).from("parcel_logs").insert({
      ...form, site_id: siteId, staff_id: staffRecord?.id,
    });
    if (error) return toast.error(error.message);
    setForm({ tracking_number: "", courier: "", sender: "", recipient: "", description: "" });
    toast.success("Parcel received"); load();
  };

  const collect = async (id: string) => {
    const by = prompt("Collected by (name + ID)?");
    if (!by) return;
    const { error } = await (supabase as any).from("parcel_logs").update({
      collected_at: new Date().toISOString(), collected_by: by,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Collection logged"); load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Package className="h-4 w-4 text-primary" /> Receive Parcel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div><Label>Tracking #</Label><Input value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} /></div>
            <div><Label>Courier</Label><Input value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value })} /></div>
            <div><Label>Sender</Label><Input value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })} /></div>
            <div><Label>Recipient *</Label><Input value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} /></div>
          </div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <Button onClick={receive} className="w-full">Receive</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Mailroom</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 && <p className="text-xs text-muted-foreground">No parcels.</p>}
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-2 rounded border border-border/40 bg-muted/30 p-2 text-xs">
              <div className="min-w-0">
                <p className="truncate font-medium">{i.recipient} ← {i.sender || i.courier || "—"}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(i.received_at).toLocaleString()}</p>
              </div>
              {i.collected_at ? <Badge variant="outline">Collected</Badge> :
                <Button size="sm" variant="outline" onClick={() => collect(i.id)} className="gap-1"><Check className="h-3 w-3" /> Collect</Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParcelDeliveryLog;
