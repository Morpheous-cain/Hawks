import { Card } from "@/components/ui/card";
import { Cloud, Server, Radio } from "lucide-react";

const MODELS = [
  {
    icon: Cloud,
    name: "Cloud SOC",
    sub: "Multi-tenant SaaS",
    latency: "~80–120ms",
    ideal: "Mid-market & residential portfolios",
    points: ["Zero on-site infra", "Auto-scaling", "Shared 24/7 monitoring"],
  },
  {
    icon: Server,
    name: "On-Premise",
    sub: "Client-hosted",
    latency: "Sub-10ms LAN",
    ideal: "Banks, government, sensitive sites",
    points: ["Full data sovereignty", "Air-gap option", "Dedicated SOC desk"],
  },
  {
    icon: Radio,
    name: "Hybrid Edge",
    sub: "On-site + cloud HQ",
    latency: "Edge real-time, cloud sync",
    ideal: "National operators, multi-site enterprises",
    points: ["Edge survives outages", "Centralised intelligence", "Best of both worlds"],
  },
];

export const DeploymentModels = () => (
  <div className="grid md:grid-cols-3 gap-6">
    {MODELS.map(m => {
      const Icon = m.icon;
      return (
        <Card key={m.name} className="p-6 hover:border-primary/40 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">{m.name}</h3>
              <div className="text-xs text-muted-foreground">{m.sub}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs mb-4">
            <div className="rounded-md border border-border/60 p-2">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Latency</div>
              <div className="font-mono">{m.latency}</div>
            </div>
            <div className="rounded-md border border-border/60 p-2">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Ideal For</div>
              <div className="leading-tight">{m.ideal}</div>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm">
            {m.points.map(p => <li key={p} className="text-foreground/75">• {p}</li>)}
          </ul>
        </Card>
      );
    })}
  </div>
);

export default DeploymentModels;
