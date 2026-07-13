import { Card } from "@/components/ui/card";
import { Banknote, Home, Factory } from "lucide-react";

const CASES = [
  {
    icon: Banknote,
    sector: "Banking & CIT",
    title: "Cash-in-Transit Operations",
    scenario: "Multi-route CIT operations across 3 cities requiring real-time tracking, panic response, and chain-of-custody.",
    modules: ["MDT-MRT", "GPS Patrol", "DOB", "Body-Cam", "Strategic Advisory"],
    outcome: "Average response time cut from 9 → 4.2 minutes; zero in-transit losses across pilot quarter.",
  },
  {
    icon: Home,
    sector: "Residential Estates",
    title: "Gated Community Coverage",
    scenario: "12 estates, 240 guards, weekly false-alarm volume overwhelming control room.",
    modules: ["Alarms", "Supervision QR/RFID", "Client Portal", "DOB"],
    outcome: "False-alarm rate down 61%; client satisfaction score +38 points.",
  },
  {
    icon: Factory,
    sector: "Industrial / Warehousing",
    title: "Loss Control & Theft Prevention",
    scenario: "Recurring inventory shrinkage and contractor non-compliance across 4 industrial sites.",
    modules: ["Loss Control", "Investigations", "CCTV", "Access Control"],
    outcome: "Verified theft incidents reduced 47%; investigations close-rate 3.1x faster.",
  },
];

export const CaseStudies = () => (
  <div className="grid md:grid-cols-3 gap-6">
    {CASES.map(c => {
      const Icon = c.icon;
      return (
        <Card key={c.title} className="p-6 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary">{c.sector}</span>
          </div>
          <h3 className="font-bold text-lg mb-2">{c.title}</h3>
          <p className="text-sm text-foreground/70 leading-relaxed mb-4">{c.scenario}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {c.modules.map(m => (
              <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/60 text-muted-foreground">{m}</span>
            ))}
          </div>
          <div className="pt-3 border-t border-border/40 text-sm text-foreground/90 leading-snug">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">Outcome</span>
            {c.outcome}
          </div>
        </Card>
      );
    })}
  </div>
);

export default CaseStudies;
