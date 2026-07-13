import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, FileBadge, BookLock, Scale, BadgeCheck, FileSignature, Stamp, Eye } from "lucide-react";
import { ScrollReveal, StaggerGroup, StaggerItem, GradientShift } from "./motion";
import { MOTION_EASE } from "./motion/tokens";
import psraLogo from "@/assets/psra-logo.jpg";

/* ────────────────────────────────────────────────────────────────
   PsraCompliance — Kenya Private Security Regulatory Authority
   (PSRA, Ministry of Interior & National Administration)
   compliance band for the landing page. Animated regulator
   stamp wraps the official PSRA crest with a Harambee-tone halo.
   ──────────────────────────────────────────────────────────────── */

const PILLARS = [
  { icon: BadgeCheck,    code: "PSRA Reg. 15",  title: "Guard registration & vetting",   body: "Live PSRA ID, vetting status & certificate expiry per officer — flagged the moment a registration lapses." },
  { icon: FileBadge,     code: "PSRA Reg. 11",  title: "Company licence register",       body: "Site-by-site employer licences, contract numbers and assignment proof, audit-ready for inspectors." },
  { icon: BookLock,      code: "PSRA Sec. 38",  title: "Occurrence Book integrity",      body: "Immutable DOB entries with SHA-256 hashing, signed timeline and tamper-proof chain of custody." },
  { icon: Scale,         code: "PSRA Code §4",  title: "Code of Conduct enforcement",    body: "Disciplinary register, complaint workflows and sanctions tied directly to officer files." },
  { icon: FileSignature, code: "PSRA Sec. 32",  title: "Annual returns & levies",        body: "Auto-generated returns, levy schedules and submission-ready PDF exports for the Authority." },
  { icon: Stamp,         code: "PSRA Insp.",    title: "Inspection-ready evidence",      body: "One-click bundles: roster, training, equipment issue, incident logs, body-cam clips — minutes, not weeks." },
];

/* Animated regulator stamp wrapping the official PSRA crest. */
const RegulatorStamp = () => {
  const reduce = useReducedMotion();
  return (
    <div className="relative w-[260px] h-[260px] mx-auto">
      {/* Outer rotating ring with PSRA text */}
      <motion.svg
        viewBox="0 0 260 260"
        className="absolute inset-0"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 32, ease: "linear", repeat: Infinity }}
      >
        <defs>
          <path id="psra-ring" d="M 130,130 m -108,0 a 108,108 0 1,1 216,0 a 108,108 0 1,1 -216,0" />
        </defs>
        <circle cx="130" cy="130" r="112" fill="none" stroke="hsl(var(--primary) / 0.4)" strokeWidth="1" strokeDasharray="2 4" />
        <text fill="hsl(var(--primary))" className="font-mono" fontSize="9" letterSpacing="4">
          <textPath href="#psra-ring" startOffset="0">
            · PRIVATE SECURITY REGULATORY AUTHORITY · MINISTRY OF INTERIOR · REPUBLIC OF KENYA ·
          </textPath>
        </text>
      </motion.svg>

      {/* Kenya flag-tone counter-rotating ring (black / red / green) */}
      <motion.svg
        viewBox="0 0 260 260"
        className="absolute inset-0"
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 44, ease: "linear", repeat: Infinity }}
      >
        <circle cx="130" cy="130" r="94" fill="none" stroke="#000000" strokeWidth="1.5" strokeDasharray="8 6" opacity="0.6" />
        <circle cx="130" cy="130" r="90" fill="none" stroke="#BB0000" strokeWidth="1" strokeDasharray="4 6" opacity="0.7" />
        <circle cx="130" cy="130" r="86" fill="none" stroke="#006600" strokeWidth="1" strokeDasharray="2 6" opacity="0.7" />
      </motion.svg>

      {/* Pulsing crest core */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={reduce ? undefined : { scale: [1, 1.03, 1] }}
        transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity }}
      >
        <div className="relative flex items-center justify-center w-[160px] h-[160px] rounded-full bg-white shadow-[0_0_70px_-10px_hsl(var(--primary)/0.6)] border border-primary/30 overflow-hidden">
          <img
            src={psraLogo}
            alt="Private Security Regulatory Authority – Ministry of Interior and National Administration"
            className="w-[130px] h-[130px] object-contain"
            loading="lazy"
          />
        </div>
      </motion.div>

      {/* Compliance pulse */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full border border-primary/40"
          animate={{ scale: [1, 1.15, 1.25], opacity: [0.5, 0.15, 0] }}
          transition={{ duration: 3, ease: "easeOut", repeat: Infinity }}
        />
      )}

      {/* Orbiting accent dots */}
      {!reduce && [0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -ml-[3px] -mt-[3px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 9 + i * 2, ease: "linear", repeat: Infinity, delay: i * 0.5 }}
        >
          <div
            style={{ transform: `translateX(112px)`, boxShadow: "0 0 10px hsl(var(--primary))" }}
            className="h-1.5 w-1.5 rounded-full bg-primary"
          />
        </motion.div>
      ))}
    </div>
  );
};

export const PsiraCompliance = () => {
  const reduce = useReducedMotion();
  return (
    <section id="psra" className="relative border-t border-border">
      <GradientShift className="px-6 lg:px-10 py-20 lg:py-28" duration={22}>
        <div className="max-w-[1280px] mx-auto">
          {/* Header */}
          <ScrollReveal>
            <div className="flex flex-col items-center text-center mb-14">
              <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                PSRA · Private Security Regulatory Authority · Republic of Kenya
              </div>
              <h2
                className="mt-5 font-display text-3xl md:text-5xl tracking-tight max-w-3xl"
                style={{ fontFamily: '"Instrument Serif", serif' }}
              >
                Aligned with the <em className="italic text-primary">Private Security Regulation Act, 2016</em> — from day one.
              </h2>
              <p className="mt-5 text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
                Every officer record, occurrence entry, training certificate and incident response is captured,
                hashed and indexed against the PSRA Code of Conduct and the Ministry of Interior & National
                Administration's compliance framework — so a snap inspection takes minutes, not weeks.
              </p>
            </div>
          </ScrollReveal>

          {/* Stamp + headline metrics */}
          <div className="grid lg:grid-cols-[320px_1fr] gap-12 lg:gap-16 items-center mb-16">
            <ScrollReveal>
              <RegulatorStamp />
            </ScrollReveal>

            <StaggerGroup className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
              {[
                { k: "100%", v: "Officer registry traceability" },
                { k: "< 5 min", v: "Inspection bundle export" },
                { k: "SHA-256", v: "DOB entry hashing" },
                { k: "Auto", v: "Annual return generation" },
              ].map((m) => (
                <StaggerItem key={m.v}>
                  <div className="bg-background/80 backdrop-blur-sm p-6 h-full">
                    <div
                      className="font-display text-2xl md:text-3xl tracking-tight text-primary"
                      style={{ fontFamily: '"Instrument Serif", serif' }}
                    >
                      {m.k}
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground leading-snug uppercase tracking-wider">
                      {m.v}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>

          {/* Pillars grid */}
          <StaggerGroup className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
            {PILLARS.map((p) => {
              const I = p.icon;
              return (
                <StaggerItem key={p.code}>
                  <motion.div
                    className="group relative bg-background/80 backdrop-blur-sm p-6 h-full overflow-hidden"
                    whileHover={reduce ? undefined : { y: -2 }}
                    transition={{ duration: 0.3, ease: MOTION_EASE }}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between">
                      <I className="h-5 w-5 text-primary" />
                      <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
                        {p.code}
                      </span>
                    </div>
                    <div className="mt-4 text-[14px] font-medium tracking-tight">
                      {p.title}
                    </div>
                    <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">
                      {p.body}
                    </p>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>

          {/* Footnote band */}
          <ScrollReveal>
            <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-6 py-5 rounded-xl border border-border bg-background/60 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-primary" />
                <div className="text-[12px] text-muted-foreground">
                  Inspector view available on request — read-only audit account with full PSRA evidence trail.
                </div>
              </div>
              <a
                href="#deploy"
                className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary hover:text-primary/80 transition-colors"
              >
                Request inspector access →
              </a>
            </div>
          </ScrollReveal>
        </div>
      </GradientShift>
    </section>
  );
};

export default PsiraCompliance;
