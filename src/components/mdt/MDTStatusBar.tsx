import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Navigation, Truck, Coffee, PowerOff, Radio, MapPin } from "lucide-react";

interface MDTStatusBarProps {
  vehicle: any;
  onChanged?: () => void;
}

const STATUSES = [
  { key: "available", label: "Available", icon: CheckCircle2, color: "bg-emerald-600 hover:bg-emerald-700" },
  { key: "en_route", label: "En Route", icon: Navigation, color: "bg-amber-600 hover:bg-amber-700" },
  { key: "on_scene", label: "On Scene", icon: MapPin, color: "bg-orange-600 hover:bg-orange-700" },
  { key: "on_patrol", label: "On Patrol", icon: Truck, color: "bg-blue-600 hover:bg-blue-700" },
  { key: "break", label: "On Break", icon: Coffee, color: "bg-slate-600 hover:bg-slate-700" },
  { key: "off_duty", label: "Off Duty", icon: PowerOff, color: "bg-zinc-700 hover:bg-zinc-800" },
];

/**
 * One-tap status updates from the unit's MDT. Each change:
 *   1. Updates vehicles.status (real-time → control room sees it instantly)
 *   2. Sends a status message via mdt_messages so dispatcher gets a log
 *   3. Pushes latest GPS into the row for situational awareness
 */
const MDTStatusBar = ({ vehicle, onChanged }: MDTStatusBarProps) => {
  const { user } = useAuth();
  const [updating, setUpdating] = useState<string | null>(null);

  const setStatus = async (status: string) => {
    if (!vehicle?.id) {
      toast.error("Vehicle not bound to this terminal");
      return;
    }
    setUpdating(status);

    // Best-effort GPS snapshot
    const gpsPromise = new Promise<{ lat: number | null; lng: number | null }>((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { timeout: 4000, enableHighAccuracy: true }
      );
    });
    const gps = await gpsPromise;

    const vehicleUpdate: any = { status };
    if (gps.lat !== null && gps.lng !== null) {
      vehicleUpdate.last_gps_lat = gps.lat;
      vehicleUpdate.last_gps_lng = gps.lng;
      vehicleUpdate.last_gps_update = new Date().toISOString();
    }

    const { error } = await supabase.from("vehicles").update(vehicleUpdate).eq("id", vehicle.id);
    if (error) {
      toast.error("Status update failed");
      setUpdating(null);
      return;
    }

    // Log the change in the message stream so control room has audit trail
    if (user?.id) {
      await supabase.from("mdt_messages").insert({
        vehicle_id: vehicle.id,
        sent_by: user.id,
        message_type: "status",
        message: `Status changed to ${status.replace("_", " ").toUpperCase()}${gps.lat ? ` @ ${gps.lat.toFixed(5)}, ${gps.lng?.toFixed(5)}` : ""}`,
        priority: status === "on_scene" || status === "en_route" ? "high" : "normal",
        is_read: false,
      } as any);
    }

    toast.success(`Status → ${status.replace("_", " ")}`);
    setUpdating(null);
    onChanged?.();
  };

  const current = vehicle?.status || "available";

  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Officer Status</span>
        <Badge variant="outline" className="ml-auto text-xs">
          Current: {current.replace("_", " ").toUpperCase()}
        </Badge>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {STATUSES.map((s) => {
          const Icon = s.icon;
          const active = current === s.key;
          return (
            <Button
              key={s.key}
              size="sm"
              disabled={updating !== null || active}
              onClick={() => setStatus(s.key)}
              className={`gap-1 h-auto py-2 flex-col text-[10px] ${active ? s.color + " ring-2 ring-foreground/30" : ""}`}
              variant={active ? "default" : "outline"}
            >
              <Icon className="w-4 h-4" />
              {updating === s.key ? "…" : s.label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

export default MDTStatusBar;
