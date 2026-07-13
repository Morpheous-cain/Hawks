import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Truck, ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOfficerAssignments } from "@/hooks/useOfficerAssignments";

const CHECKS = [
  { k: "exterior_ok", label: "Exterior" },
  { k: "interior_ok", label: "Interior" },
  { k: "tires_ok", label: "Tires" },
  { k: "lights_ok", label: "Lights" },
  { k: "brakes_ok", label: "Brakes" },
  { k: "fluids_ok", label: "Fluids" },
  { k: "safety_kit_ok", label: "Safety Kit" },
];

export const VehicleInspection = () => {
  const { staffRecord } = useOfficerAssignments();
  const [recent, setRecent] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    vehicle_plate: "", odometer: "", fuel_level: "Full", defects: "",
    exterior_ok: true, interior_ok: true, tires_ok: true, lights_ok: true,
    brakes_ok: true, fluids_ok: true, safety_kit_ok: true,
  });

  const load = async () => {
    const { data } = await (supabase as any)
      .from("vehicle_inspections").select("*").order("inspected_at", { ascending: false }).limit(10);
    setRecent(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.vehicle_plate) return toast.error("Vehicle plate required");
    const { error } = await (supabase as any).from("vehicle_inspections").insert({
      ...form, odometer: form.odometer ? Number(form.odometer) : null, staff_id: staffRecord?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Inspection logged"); load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4 text-primary" /> Vehicle Inspection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div><Label>Plate *</Label><Input value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} /></div>
            <div><Label>Odometer</Label><Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} /></div>
            <div><Label>Fuel</Label><Input value={form.fuel_level} onChange={(e) => setForm({ ...form, fuel_level: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CHECKS.map((c) => (
              <label key={c.k} className="flex items-center gap-2 rounded border border-border/40 bg-muted/30 p-2 text-xs">
                <Checkbox checked={form[c.k]} onCheckedChange={(v) => setForm({ ...form, [c.k]: !!v })} />
                {c.label}
              </label>
            ))}
          </div>
          <div><Label>Defects / Notes</Label><Textarea rows={2} value={form.defects} onChange={(e) => setForm({ ...form, defects: e.target.value })} /></div>
          <Button onClick={submit} className="w-full gap-1"><ClipboardCheck className="h-4 w-4" /> Submit Inspection</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent Inspections</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recent.length === 0 && <p className="text-xs text-muted-foreground">None yet.</p>}
          {recent.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded border border-border/40 bg-muted/30 p-2 text-xs">
              <span className="font-mono font-medium">{r.vehicle_plate}</span>
              <span className="text-muted-foreground">{new Date(r.inspected_at).toLocaleString()}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleInspection;
