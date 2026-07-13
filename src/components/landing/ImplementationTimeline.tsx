import { Card } from "@/components/ui/card";
import { ClipboardCheck, MapPin, GraduationCap, Rocket, Activity } from "lucide-react";

const STEPS = [
  { icon: ClipboardCheck, w: "Week 1", t: "Discovery", d: "Stakeholder workshops, current-state audit, module scoping." },
  { icon: MapPin, w: "Week 2", t: "Sites & Hardware", d: "QR/RFID install, body-cam provisioning, integrations mapped." },
  { icon: GraduationCap, w: "Week 3", t: "Training", d: "Operator drills, supervisor enablement, client portal walk-through." },
  { icon: Rocket, w: "Week 4", t: "Go-Live", d: "Cutover, parallel run, 24/7 white-glove support." },
  { icon: Activity, w: "Ongoing", t: "Optimisation", d: "Quarterly tuning, advisory cadence, capability roadmap." },
];

export const ImplementationTimeline = () => (
  <div className="relative">
    <div className="absolute left-0 right-0 top-12 hidden md:block h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    <div className="grid md:grid-cols-5 gap-5 relative">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        return (
          <Card key={s.t} className="p-5 text-center">
            <div className="h-12 w-12 mx-auto mb-3 rounded-full bg-background border-2 border-primary/40 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary">{s.w}</div>
            <div className="font-bold mt-1">{s.t}</div>
            <p className="text-xs text-foreground/65 mt-2 leading-relaxed">{s.d}</p>
            <div className="text-[10px] font-mono text-muted-foreground mt-3">Step {i + 1}/{STEPS.length}</div>
          </Card>
        );
      })}
    </div>
  </div>
);

export default ImplementationTimeline;
