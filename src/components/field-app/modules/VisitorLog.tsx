import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserPlus, LogOut, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOfficerAssignments } from "@/hooks/useOfficerAssignments";

export const VisitorLog = () => {
  const { staffRecord, assignedSites } = useOfficerAssignments();
  const [logs, setLogs] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ visitor_name: "", visitor_phone: "", host_name: "", purpose: "", vehicle_plate: "" });
  const siteId = (assignedSites as any)?.[0]?.id;

  const load = async () => {
    const { data } = await (supabase as any)
      .from("visitor_logs").select("*").order("check_in_at", { ascending: false }).limit(20);
    setLogs(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const checkIn = async () => {
    if (!form.visitor_name) return toast.error("Visitor name required");
    const { error } = await (supabase as any).from("visitor_logs").insert({
      ...form, site_id: siteId, staff_id: staffRecord?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Visitor checked in");
    setForm({ visitor_name: "", visitor_phone: "", host_name: "", purpose: "", vehicle_plate: "" });
    load();
  };

  const checkOut = async (id: string) => {
    const { error } = await (supabase as any).from("visitor_logs").update({ check_out_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Checked out"); load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4 text-primary" /> Check In Visitor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><Label>Visitor Name *</Label><Input value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.visitor_phone} onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })} /></div>
            <div><Label>Host</Label><Input value={form.host_name} onChange={(e) => setForm({ ...form, host_name: e.target.value })} /></div>
            <div><Label>Vehicle Plate</Label><Input value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} /></div>
          </div>
          <div><Label>Purpose</Label><Textarea rows={2} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
          <Button onClick={checkIn} className="w-full">Check In</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-emerald-500" /> Active Visitors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs.length === 0 && <p className="text-xs text-muted-foreground">No visitors logged.</p>}
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-2 rounded border border-border/40 bg-muted/30 p-3 text-xs">
              <div className="min-w-0">
                <p className="truncate font-medium">{l.visitor_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  In {new Date(l.check_in_at).toLocaleTimeString()} · Host {l.host_name ?? "—"}
                </p>
              </div>
              {l.check_out_at ? (
                <Badge variant="outline" className="text-[10px]">Out {new Date(l.check_out_at).toLocaleTimeString()}</Badge>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => checkOut(l.id)}><LogOut className="h-3 w-3" /></Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorLog;
