import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";

const QUOTES = [
  { q: "We replaced four disconnected tools with Black Hawk SOC-OS in eight weeks. Our control room finally operates as one unit.", a: "Operations Director", s: "National Retail Group" },
  { q: "The audit-grade DOB and evidence chain has changed how we present in incident reviews. Clients trust the record.", a: "Chief Security Officer", s: "Diplomatic Mission" },
  { q: "Response times dropped by half. The MDT and dispatch flow is the cleanest I've used in 15 years.", a: "Control Room Manager", s: "CIT Operations" },
];

export const Testimonials = () => (
  <div className="grid md:grid-cols-3 gap-6">
    {QUOTES.map(({ q, a, s }) => (
      <Card key={a + s} className="p-6 relative">
        <Quote className="h-6 w-6 text-primary/60 mb-3" />
        <p className="text-foreground/85 leading-relaxed mb-5">"{q}"</p>
        <div className="pt-4 border-t border-border/40">
          <div className="font-semibold text-sm">{a}</div>
          <div className="text-xs text-muted-foreground font-mono">{s}</div>
        </div>
      </Card>
    ))}
  </div>
);

export default Testimonials;
