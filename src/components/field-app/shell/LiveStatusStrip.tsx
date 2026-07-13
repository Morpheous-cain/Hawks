import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Wifi, Camera, Radio, BatteryFull, ShieldCheck } from "lucide-react";

interface StatusDotProps {
  ok: boolean;
  label: string;
  icon: any;
}
const StatusDot = ({ ok, label, icon: Icon }: StatusDotProps) => (
  <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1">
    <Icon className={cn("h-3 w-3", ok ? "text-emerald-500" : "text-red-500")} />
    <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
  </div>
);

export const LiveStatusStrip = () => {
  const [gps, setGps] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      () => setGps(true),
      () => setGps(false),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 }
    );
    const onOn = () => setOnline(true), onOff = () => setOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => {
      navigator.geolocation.clearWatch(id);
      window.removeEventListener("online", onOn);
      window.removeEventListener("offline", onOff);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusDot ok={gps} label="GPS" icon={MapPin} />
      <StatusDot ok={online} label="Network" icon={Wifi} />
      <StatusDot ok={true} label="Comms" icon={Radio} />
      <StatusDot ok={true} label="Body Cam" icon={Camera} />
      <StatusDot ok={true} label="Geofence" icon={ShieldCheck} />
      <StatusDot ok={true} label="Power" icon={BatteryFull} />
    </div>
  );
};

export default LiveStatusStrip;
