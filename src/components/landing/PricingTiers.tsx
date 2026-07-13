import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const TIERS = [
  {
    name: "Operations",
    target: "Small fleets · ≤50 guards",
    price: "From KES 95k / mo",
    features: ["DOB + Patrols + GPS", "1 control-room seat", "Email support", "Cloud-hosted"],
    cta: "Start a Pilot",
  },
  {
    name: "Command",
    highlight: true,
    target: "Mid-market · multi-site",
    price: "From KES 320k / mo",
    features: ["All operations modules", "Up to 8 SOC seats", "Strategic Advisory", "Body-cam + CCTV", "24/7 priority support"],
    cta: "Talk to Sales",
  },
  {
    name: "Enterprise SOC",
    target: "National · multi-tenant",
    price: "Custom",
    features: ["Full module suite", "On-prem / hybrid deploy", "White-label client portal", "Dedicated success engineer", "SLA-backed uptime"],
    cta: "Request Proposal",
  },
];

export const PricingTiers = () => (
  <div className="grid md:grid-cols-3 gap-6">
    {TIERS.map(t => (
      <Card
        key={t.name}
        className={`p-7 flex flex-col relative ${
          t.highlight ? "border-primary/60 shadow-glow ring-1 ring-primary/30" : ""
        }`}
      >
        {t.highlight && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-widest bg-primary text-primary-foreground px-3 py-0.5 rounded-full">
            Most Deployed
          </span>
        )}
        <div className="mb-6">
          <h3 className="text-xl font-bold">{t.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t.target}</p>
        </div>
        <div className="text-2xl font-bold mb-6">{t.price}</div>
        <ul className="space-y-2 mb-8 flex-1">
          {t.features.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{f}
            </li>
          ))}
        </ul>
        <Button variant={t.highlight ? "default" : "outline"} className="w-full">
          {t.cta} <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </Card>
    ))}
  </div>
);

export default PricingTiers;
