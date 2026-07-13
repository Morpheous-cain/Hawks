import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal, HoverLift, GradientShift } from "./motion";

/* ────────────────────────────────────────────────────────────────
   ConversionBand — mid-page CTA that captures intent before
   visitors reach the final CTA. Three soft asks (demo, call,
   request access) reduce drop-off vs a single hard ask.
   ──────────────────────────────────────────────────────────────── */

export const ConversionBand = ({ user }: { user: any }) => (
  <section className="relative px-6 lg:px-10 py-20 border-t border-border">
    <div className="max-w-[1280px] mx-auto">
      <ScrollReveal>
        <GradientShift className="rounded-2xl border border-border">
          <div className="relative grid lg:grid-cols-12 gap-10 p-10 lg:p-14">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-primary" /> Two ways to see it in operation
              </div>
              <h3
                className="mt-5 font-display text-3xl md:text-4xl lg:text-[44px] leading-[1.05] tracking-tight"
                style={{ fontFamily: '"Instrument Serif", serif' }}
              >
                Stop describing your control room.<br />
                <em className="italic text-muted-foreground">Show it running.</em>
              </h3>
              <p className="mt-5 text-muted-foreground leading-relaxed max-w-xl">
                Book a 30-minute live walk-through with an operator who runs Black Hawk SOC-OS
                every night — or jump straight in with a sandbox tied to your sites and rosters.
                No slide decks. No sales theatre.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-3 lg:items-end lg:justify-center">
              <HoverLift>
                <Button asChild size="xl" className="w-full lg:w-auto">
                  <Link to={user ? "/management" : "/auth"}>
                    {user ? "Open console" : "Request access"}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Link>
                </Button>
              </HoverLift>
              <HoverLift>
                <Button asChild size="xl" variant="outline" className="w-full lg:w-auto">
                  <a href="#operations">
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Book a live walk-through
                  </a>
                </Button>
              </HoverLift>
              <a
                href="tel:+254000000000"
                className="inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                Or speak to an operator now
              </a>
            </div>
          </div>
        </GradientShift>
      </ScrollReveal>
    </div>
  </section>
);

export default ConversionBand;
