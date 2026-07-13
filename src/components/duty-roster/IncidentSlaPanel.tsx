import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertOctagon, Siren, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/utils/auditLog";

interface SlaIncident {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  startedAt: number; // epoch ms
  targetMinutes: number;
  assignedTo: string;
}

const SEED: SlaIncident[] = [
  { id: "BH-INC-2041", title: "Armed intrusion · Westlands Tower", severity: "critical", startedAt: Date.now() - 7 * 60_000, targetMinutes: 10, assignedTo: "ALPHA-3" },
  { id: "BH-INC-2040", title: "Perimeter breach · Karen Estate", severity: "high", startedAt: Date.now() - 14 * 60_000, targetMinutes: 20, assignedTo: "BRAVO-2" },
  { id: "BH-INC-2039", title: "Medical · Site #44", severity: "medium", startedAt: Date.now() - 32 * 60_000, targetMinutes: 45, assignedTo: "K9-2" },
];

const SEV_TONE: Record<SlaIncident["severity"], string> = {
  critical: "rose", high: "amber", medium: "blue", low: "emerald",
};

export default function IncidentSlaPanel() {
  const [now, setNow] = useState(Date.now());
  const [escalated, setEscalated] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleEscalate = async (inc: SlaIncident) => {
    setEscalated((s) => new Set(s).add(inc.id));
    await logAudit({
      module: "duty_roster",
      action: "incident_escalation",
      recordId: inc.id,
      changes: { from: "duty_officer", to: "operations_manager", reason: "SLA at risk" },
    });
    toast.warning(`Incident ${inc.id} escalated`, { description: "Operations Manager notified · CMC stood up if required." });
  };

  return (
    <div className="space-y-2">
      {SEED.map((inc) => {
        const elapsedMin = (now - inc.startedAt) / 60_000;
        const pct = Math.min(100, (elapsedMin / inc.targetMinutes) * 100);
        const remaining = inc.targetMinutes - elapsedMin;
        const breached = remaining < 0;
        const atRisk = !breached && remaining < inc.targetMinutes * 0.25;
        const tone = breached ? "rose" : atRisk ? "amber" : SEV_TONE[inc.severity];
        const mmss = (() => {
          const abs = Math.abs(remaining);
          const m = Math.floor(abs);
          const s = Math.floor((abs - m) * 60);
          return `${breached ? "+" : ""}${m}:${s.toString().padStart(2, "0")}`;
        })();
        const isEscalated = escalated.has(inc.id);

        return (
          <div
            key={inc.id}
            className={`rounded-md border border-${tone}-500/30 bg-${tone}-500/5 p-2.5`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-slate-100">{inc.id}</span>
                  <Badge className={`border border-${SEV_TONE[inc.severity]}-500/40 bg-${SEV_TONE[inc.severity]}-500/10 text-[9px] uppercase text-${SEV_TONE[inc.severity]}-300`}>
                    {inc.severity}
                  </Badge>
                  {breached && (
                    <Badge className="border border-rose-500/50 bg-rose-500/15 text-[9px] uppercase text-rose-300">
                      SLA BREACHED
                    </Badge>
                  )}
                  {atRisk && !breached && (
                    <Badge className="border border-amber-500/50 bg-amber-500/15 text-[9px] uppercase text-amber-300">
                      AT RISK
                    </Badge>
                  )}
                </div>
                <div className="truncate text-[11px] text-slate-300">{inc.title}</div>
                <div className="text-[10px] text-slate-500">
                  Assigned <span className="font-mono text-cyan-300">{inc.assignedTo}</span>
                  {" · "}Target {inc.targetMinutes}m
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono text-base font-bold tabular-nums text-${tone}-300`}>
                  {breached ? "OVER " : ""}{mmss}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-slate-500">
                  {breached ? "past deadline" : "remaining"}
                </div>
              </div>
            </div>
            <Progress value={pct} className="mt-2 h-1 bg-white/5" />
            <div className="mt-2 flex justify-end gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={isEscalated}
                onClick={() => handleEscalate(inc)}
                className={`h-6 text-[10px] ${
                  isEscalated
                    ? "border-emerald-500/30 text-emerald-300"
                    : "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                }`}
              >
                {isEscalated ? (
                  <>
                    <ArrowUpCircle className="mr-1 h-3 w-3" /> Escalated
                  </>
                ) : (
                  <>
                    <Siren className="mr-1 h-3 w-3" /> Escalate
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 border-cyan-500/30 text-[10px] text-cyan-300 hover:bg-cyan-500/10"
              >
                <AlertOctagon className="mr-1 h-3 w-3" /> View
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
