import { Award, Lock, Globe2, Server, ShieldCheck, FileBadge } from "lucide-react";
import { ScrollReveal, StaggerGroup, StaggerItem } from "./motion";

/* ────────────────────────────────────────────────────────────────
   TrustStrip — credibility band.
   Compact, scannable proof points designed to defuse procurement
   objections before they're raised.
   ──────────────────────────────────────────────────────────────── */

const TRUST = [
  { icon: Lock,         label: "ISO 27001-aligned",       sub: "Information security controls" },
  { icon: ShieldCheck,  label: "POPIA + GDPR ready",      sub: "Data residency & consent flows" },
  { icon: FileBadge,    label: "PSIRA-friendly exports",  sub: "Regulator-ready reports" },
  { icon: Server,       label: "On-prem or cloud",        sub: "Your data, your jurisdiction" },
  { icon: Globe2,       label: "4 continents",            sub: "Africa, EU, ME, LATAM deploys" },
  { icon: Award,        label: "Operator-built",          sub: "Forged in a live control room" },
];

export const TrustStrip = () => (
  <section className="relative px-6 lg:px-10 py-16 lg:py-20 border-t border-border bg-background/40">
    <div className="max-w-[1280px] mx-auto">
      <ScrollReveal>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-foreground/60" /> Trusted by operators who can't afford to be wrong
            </div>
            <h3
              className="mt-4 font-display text-2xl md:text-3xl tracking-tight"
              style={{ fontFamily: '"Instrument Serif", serif' }}
            >
              Built for the rooms that <em className="italic text-muted-foreground">don't sleep</em>.
            </h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm sm:text-right">
            Security, compliance and deployment posture engineered for armed-response, cash-in-transit
            and high-value asset operators — from day one.
          </p>
        </div>
      </ScrollReveal>

      <StaggerGroup className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {TRUST.map((t) => {
          const I = t.icon;
          return (
            <StaggerItem key={t.label}>
              <div className="bg-background p-5 h-full">
                <I className="h-4 w-4 text-primary" />
                <div className="mt-3 text-[13px] font-medium tracking-tight leading-tight">
                  {t.label}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground leading-snug">
                  {t.sub}
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </div>
  </section>
);

export default TrustStrip;
