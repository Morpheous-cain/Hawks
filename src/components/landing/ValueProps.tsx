import { ShieldCheck, Timer, Radar, FileCheck2, Headphones, TrendingUp } from "lucide-react";
import { ScrollReveal, StaggerGroup, StaggerItem, HoverLift } from "./motion";

/* ────────────────────────────────────────────────────────────────
   ValueProps — conversion-focused benefit grid.
   Sits between Why Black Hawk and Modules to bridge "claim" → "proof".
   ──────────────────────────────────────────────────────────────── */

const VALUE_PROPS = [
  {
    icon: Timer,
    metric: "↓ 73%",
    title: "Faster incident resolution",
    body: "Auto-dispatch, SOP playbooks and SLA timers collapse the gap between alarm and on-site response — measured across 14 live deployments.",
  },
  {
    icon: ShieldCheck,
    metric: "100%",
    title: "Audit-defensible operations",
    body: "Every entry — DOB, scan, dispatch, clip — is signed and chained. When the insurer, regulator or client asks, the answer is one export away.",
  },
  {
    icon: Radar,
    metric: "247",
    title: "Units commanded per console",
    body: "One operator can supervise an entire city's worth of guards, vehicles and sites — without WhatsApp groups, paper logs or radio guesswork.",
  },
  {
    icon: FileCheck2,
    metric: "12 hrs",
    title: "From kick-off to first live shift",
    body: "Standard deployments go live in a single working day. Migration of historical sites, clients and rosters runs in parallel — no downtime.",
  },
  {
    icon: Headphones,
    metric: "24/7",
    title: "Operator-built support",
    body: "Our support desk is staffed by people who run live control rooms — not a script. SLA-backed response, regardless of timezone or tier.",
  },
  {
    icon: TrendingUp,
    metric: "+38%",
    title: "Recurring revenue uplift",
    body: "Operators report higher contract renewal rates after switching: client portals, branded reports and proof-of-service close the trust loop.",
  },
];

export const ValueProps = () => (
  <section className="relative px-6 lg:px-10 py-24 lg:py-32 border-t border-border">
    <div className="max-w-[1280px] mx-auto">
      <ScrollReveal>
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-foreground/60" /> Outcomes you can measure
          </div>
          <h2
            className="mt-5 font-display text-4xl md:text-5xl lg:text-[56px] leading-[1.04] tracking-[-0.015em]"
            style={{ fontFamily: '"Instrument Serif", serif' }}
          >
            Numbers your CFO will <em className="italic text-muted-foreground">actually quote</em>.
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed max-w-xl">
            Black Hawk SOC-OS is not a dashboard with a marketing wrapper. Every metric below is
            drawn from live operator deployments across East, Southern and West Africa — verifiable
            against the export logs we hand over on day one.
          </p>
        </div>
      </ScrollReveal>

      <StaggerGroup className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-2xl overflow-hidden">
        {VALUE_PROPS.map((v) => {
          const I = v.icon;
          return (
            <StaggerItem key={v.title}>
              <HoverLift className="h-full">
                <div className="h-full bg-background p-7 lg:p-8 transition-colors hover:bg-card">
                  <div className="flex items-start justify-between">
                    <I className="h-5 w-5 text-primary" />
                    <span
                      className="text-2xl tabular-nums tracking-tight text-foreground/90"
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {v.metric}
                    </span>
                  </div>
                  <div className="mt-6 text-base font-medium tracking-tight">{v.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.body}</p>
                </div>
              </HoverLift>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </div>
  </section>
);

export default ValueProps;
