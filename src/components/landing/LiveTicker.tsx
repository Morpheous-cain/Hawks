import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, MapPin, Radio, Shield, Video } from "lucide-react";

type Tick = { icon: typeof Shield; text: string; tone: "ok" | "warn" | "crit" };

const SEED: Tick[] = [
  { icon: CheckCircle2, text: "Patrol verified · Karen Estate · QR-CP-08", tone: "ok" },
  { icon: AlertTriangle, text: "Alarm cleared · Westlands HQ · MRT-07 · 04:12", tone: "warn" },
  { icon: Radio, text: "Dispatch · K9-02 → CBD · ETA 3 min", tone: "ok" },
  { icon: Video, text: "CCTV clip vaulted · CAM-04 · EVD-2025-1188", tone: "ok" },
  { icon: AlertTriangle, text: "SOS · MRT-03 · Runda Gate · Acknowledged", tone: "crit" },
  { icon: Shield, text: "DOB sealed · DOB-2025-04829 · Cpl. Otieno", tone: "ok" },
  { icon: MapPin, text: "Geofence breach · PTL-14 · auto-flagged", tone: "warn" },
  { icon: Activity, text: "Shift opened · Karen · 12 officers on duty", tone: "ok" },
  { icon: CheckCircle2, text: "Investigation INV-2025-00347 → Approved", tone: "ok" },
  { icon: Radio, text: "Mobile response · ALPHA QRF-1 · arrived 02:41", tone: "ok" },
];

const toneColor = {
  ok: "hsl(var(--alert-normal))",
  warn: "hsl(var(--alert-caution))",
  crit: "hsl(var(--alert-critical))",
} as const;

export const LiveTicker = () => {
  const [items, setItems] = useState<Tick[]>(SEED);

  // Rotate the array every 6s so the marquee feels alive even though it loops
  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) => [...prev.slice(1), prev[0]]);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  // Duplicate for seamless loop
  const stream = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden border-y border-primary/20 bg-background/60 backdrop-blur-md">
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

      <div className="flex items-center">
        <div className="flex items-center gap-2 px-4 py-2.5 border-r border-primary/30 bg-primary/10 shrink-0">
          <span className="h-2 w-2 rounded-full bg-[hsl(var(--alert-normal))] animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary">Live · Black Hawk Network</span>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex gap-10 py-2.5 animate-[marquee_60s_linear_infinite] whitespace-nowrap">
            {stream.map((t, i) => {
              const Icon = t.icon;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Icon className="h-3.5 w-3.5" style={{ color: toneColor[t.tone] }} />
                  <span className="text-foreground/80">{t.text}</span>
                  <span className="text-muted-foreground/60 font-mono">·</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
