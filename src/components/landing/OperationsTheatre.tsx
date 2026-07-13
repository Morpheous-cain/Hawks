import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, MapPin, Truck, ShieldCheck, BookLock, Search, Globe2, ArrowRight, Hash, FileSignature } from "lucide-react";

type TabKey = "alarm" | "dob" | "investigation" | "advisory";
const TABS: { key: TabKey; label: string }[] = [
  { key: "alarm", label: "Alarm Dispatch" },
  { key: "dob", label: "DOB Entry" },
  { key: "investigation", label: "Investigation Flow" },
  { key: "advisory", label: "Strategic Advisory" },
];

const AlarmFlow = () => {
  const [stage, setStage] = useState(0);
  const stages = [
    { icon: Bell, label: "Alarm Triggered", t: "00:00" },
    { icon: ShieldCheck, label: "Control Room Acknowledged", t: "00:18" },
    { icon: Truck, label: "MRT Unit Dispatched", t: "00:42" },
    { icon: MapPin, label: "Unit Arrived On-Site", t: "04:36" },
    { icon: BookLock, label: "DOB Closed + Evidence Vaulted", t: "08:11" },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-2">
        {stages.map((s, i) => {
          const active = i <= stage;
          const Icon = s.icon;
          return (
            <div key={s.label} className={`text-center p-3 rounded-md border transition-all ${active ? "border-primary/60 bg-primary/5" : "border-border/40"}`}>
              <Icon className={`h-5 w-5 mx-auto mb-1 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-[10px] leading-tight">{s.label}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">{s.t}</div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between gap-3">
        <Button size="sm" variant="outline" disabled={stage === 0} onClick={() => setStage(s => Math.max(0, s - 1))}>Back</Button>
        <Button size="sm" onClick={() => setStage(s => Math.min(stages.length - 1, s + 1))}>
          Advance Stage <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

const DobFlow = () => {
  const [hashed, setHashed] = useState(false);
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border/60 p-4 bg-background/50 space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Entry No</span><span className="font-mono">DOB-2025-04830</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Officer</span><span>Cpl. M. Otieno</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Site</span><span>Westlands HQ</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-[hsl(var(--alert-caution))]">Incident</span></div>
        <div className="text-foreground/80 leading-relaxed">"Perimeter sensor triggered Zone-3 at 02:14. MRT-07 dispatched, arrived 02:18, swept area, all clear at 02:31."</div>
      </div>
      {!hashed ? (
        <Button onClick={() => setHashed(true)} size="sm" className="w-full">
          Seal & Hash Entry <Hash className="ml-1 h-3.5 w-3.5" />
        </Button>
      ) : (
        <div className="rounded-md border border-primary/40 bg-primary/5 p-3 font-mono text-xs break-all">
          <div className="text-[10px] uppercase tracking-widest text-primary mb-1">SHA-256 · Sealed</div>
          a7f3e2b1c8d94f06e5b2a1c7d8e9f6a3b2c4d5e6f7081923a4b5c6d7e8f90a1b2
        </div>
      )}
    </div>
  );
};

const InvestigationFlow = () => {
  const stages = ["Draft", "Review", "Submit", "Approve"];
  const [s, setS] = useState(0);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {stages.map((st, i) => (
          <div key={st} className="flex-1">
            <div className={`h-2 rounded-full ${i <= s ? "bg-primary" : "bg-border"}`} />
            <div className={`text-xs text-center mt-1 ${i <= s ? "text-primary" : "text-muted-foreground"}`}>{st}</div>
          </div>
        ))}
      </div>
      <Card className="p-4 text-sm">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Case CAS-2025-0091</div>
        <div className="font-semibold mb-2">Internal Theft Inquiry — Industrial Park</div>
        <p className="text-foreground/70 leading-relaxed">
          Stage <span className="text-primary font-medium">{stages[s]}</span> — investigator is {s === 0 ? "drafting findings" : s === 1 ? "internal QA review" : s === 2 ? "submitted to ops manager" : "case approved & archived"}.
        </p>
      </Card>
      <div className="flex justify-between gap-2">
        <Button size="sm" variant="outline" disabled={s === 0} onClick={() => setS(x => x - 1)}>Back</Button>
        <Button size="sm" disabled={s === 3} onClick={() => setS(x => x + 1)}>Advance Stage</Button>
      </div>
    </div>
  );
};

const AdvisoryFlow = () => (
  <div className="space-y-3">
    {[
      { area: "CBD", level: "ELEVATED", text: "Civil unrest expected near Moi Avenue 18:00–22:00." },
      { area: "Westlands", level: "LOW", text: "Routine traffic, no operational risks reported." },
      { area: "Industrial Park", level: "HIGH", text: "Repeated alarm pattern at 4 sites in last 72h — recommend reinforcement." },
    ].map(a => (
      <div key={a.area} className="flex items-start gap-3 p-3 rounded-md border border-border/60 bg-background/50">
        <Globe2 className="h-4 w-4 text-primary mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{a.area}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              a.level === "HIGH" ? "border-destructive/60 text-destructive" :
              a.level === "ELEVATED" ? "border-[hsl(var(--alert-caution))] text-[hsl(var(--alert-caution))]" :
              "border-[hsl(var(--alert-normal))] text-[hsl(var(--alert-normal))]"
            }`}>{a.level}</span>
          </div>
          <p className="text-xs text-foreground/70 mt-1">{a.text}</p>
        </div>
      </div>
    ))}
  </div>
);

export const OperationsTheatre = () => {
  const [tab, setTab] = useState<TabKey>("alarm");
  return (
    <Card className="p-6 md:p-8">
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border/60 pb-3">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs font-mono uppercase tracking-widest px-3 py-1.5 rounded-md transition-colors ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "alarm" && <AlarmFlow />}
      {tab === "dob" && <DobFlow />}
      {tab === "investigation" && <InvestigationFlow />}
      {tab === "advisory" && <AdvisoryFlow />}
    </Card>
  );
};

export default OperationsTheatre;
