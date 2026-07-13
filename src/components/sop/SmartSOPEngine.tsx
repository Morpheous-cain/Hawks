import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, ListChecks } from "lucide-react";

type Step = { id: string; label: string; required?: boolean };
type SOP = { type: string; severity: "low" | "medium" | "high" | "critical"; steps: Step[]; targetMinutes: number };

const SOP_LIBRARY: Record<string, SOP> = {
  "perimeter-breach": {
    type: "Perimeter Breach",
    severity: "high",
    targetMinutes: 8,
    steps: [
      { id: "ack", label: "Acknowledge alarm in Control Room", required: true },
      { id: "cctv", label: "Verify with CCTV (camera nearest to zone)", required: true },
      { id: "dispatch", label: "Dispatch nearest MRT unit", required: true },
      { id: "client", label: "Notify client primary contact" },
      { id: "kp", label: "Brief on-site supervisor / guard force" },
      { id: "evidence", label: "Capture body-cam clip + photos on arrival", required: true },
      { id: "dob", label: "Open DOB incident entry with timestamps", required: true },
      { id: "close", label: "Close-out: report, advisory, escalation if needed", required: true },
    ],
  },
  "panic-button": {
    type: "Panic / SOS Activation",
    severity: "critical",
    targetMinutes: 5,
    steps: [
      { id: "ack", label: "Acknowledge SOS within 30 seconds", required: true },
      { id: "voice", label: "Call originating officer / device", required: true },
      { id: "dispatch", label: "Dispatch QRF + Supervisor", required: true },
      { id: "client", label: "Alert client and security manager" },
      { id: "police", label: "Loop in Police / law-enforcement liaison if life threat" },
      { id: "evidence", label: "Record audio + body-cam from arrival", required: true },
      { id: "dob", label: "DOB incident entry with all timestamps", required: true },
    ],
  },
  "fire-alarm": {
    type: "Fire / Smoke Alarm",
    severity: "critical",
    targetMinutes: 6,
    steps: [
      { id: "ack", label: "Acknowledge alarm + identify zone", required: true },
      { id: "verify", label: "Verify with CCTV / on-site officer", required: true },
      { id: "evac", label: "Initiate evacuation procedure if confirmed", required: true },
      { id: "fire", label: "Notify Fire Brigade + client", required: true },
      { id: "mrt", label: "Dispatch MRT for crowd control & cordon" },
      { id: "dob", label: "DOB entry + post-incident report", required: true },
    ],
  },
};

export const SmartSOPEngine = ({ defaultType = "perimeter-breach" }: { defaultType?: keyof typeof SOP_LIBRARY }) => {
  const [type, setType] = useState<keyof typeof SOP_LIBRARY>(defaultType);
  const sop = SOP_LIBRARY[type];
  const [done, setDone] = useState<Set<string>>(new Set());
  const [startedAt] = useState(() => Date.now());
  const [tick, setTick] = useState(0);

  useMemo(() => {
    const i = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const elapsed = Math.floor((Date.now() - startedAt) / 1000) + tick * 0;
  const elapsedMin = elapsed / 60;
  const overSLA = elapsedMin > sop.targetMinutes;
  const requiredCount = sop.steps.filter(s => s.required).length;
  const requiredDone = sop.steps.filter(s => s.required && done.has(s.id)).length;
  const completion = Math.round((done.size / sop.steps.length) * 100);

  const toggle = (id: string) => {
    setDone(d => {
      const n = new Set(d);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Smart SOP Engine</div>
            <h3 className="font-semibold leading-tight">{sop.type}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as any); setDone(new Set()); }}
            className="text-xs px-2 py-1.5 rounded-md border border-border/60 bg-background"
          >
            {Object.entries(SOP_LIBRARY).map(([k, v]) => <option key={k} value={k}>{v.type}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-md border border-border/60 p-3">
          <div className="text-[10px] font-mono uppercase text-muted-foreground">SLA Target</div>
          <div className="text-xl font-bold mt-1">{sop.targetMinutes}m</div>
        </div>
        <div className={`rounded-md border p-3 ${overSLA ? "border-destructive/60 bg-destructive/5" : "border-border/60"}`}>
          <div className="text-[10px] font-mono uppercase text-muted-foreground flex items-center justify-center gap-1"><Clock className="h-3 w-3" /> Elapsed</div>
          <div className={`text-xl font-bold mt-1 tabular-nums ${overSLA ? "text-destructive" : ""}`}>
            {Math.floor(elapsedMin)}m {elapsed % 60}s
          </div>
        </div>
        <div className="rounded-md border border-border/60 p-3">
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Completion</div>
          <div className="text-xl font-bold mt-1">{completion}%</div>
        </div>
      </div>

      <div className="space-y-2">
        {sop.steps.map((s, i) => {
          const isDone = done.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`w-full flex items-start gap-3 text-left p-3 rounded-md border transition-all ${
                isDone ? "bg-primary/5 border-primary/40" : "bg-background/60 border-border/60 hover:border-primary/40"
              }`}
            >
              {isDone ? <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />}
              <div className="flex-1">
                <div className="text-sm font-medium">{i + 1}. {s.label}</div>
                {s.required && <div className="text-[10px] uppercase tracking-widest text-destructive/80 mt-0.5">Required</div>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="text-xs text-muted-foreground">
          {requiredDone}/{requiredCount} required steps complete
        </div>
        <Button size="sm" disabled={requiredDone < requiredCount}>
          Close Incident & Log to DOB
        </Button>
      </div>
    </Card>
  );
};

export default SmartSOPEngine;
