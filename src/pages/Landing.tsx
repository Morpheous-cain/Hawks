import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Radio, MapPin, Camera, Video, Lock, Cpu, BookLock, ShieldAlert,
  Search, Globe2, Users, GraduationCap, Building2, BarChart3, Fingerprint,
  Truck, Crown, Dog, ArrowRight, ArrowUpRight, CheckCircle2, Command,
  Activity, Zap, Eye, Network, Gauge, Check, Minus, X, Cloud, Server,
  ClipboardCheck, Rocket, KeyRound, FileLock2, ScrollText, Database,
  Plug, Banknote, Home, Factory, AlertTriangle, ChevronDown,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import socHero from "@/assets/landing-soc-hero.jpg";
import blackHawkLogo from "@/assets/black-hawk-logo.png";
import LandingMotion from "@/components/landing/LandingMotion";
import LivePulseGlobe from "@/components/landing/LivePulseGlobe";
import Marquee from "@/components/landing/Marquee";
import ValueProps from "@/components/landing/ValueProps";
import TrustStrip from "@/components/landing/TrustStrip";
import ConversionBand from "@/components/landing/ConversionBand";
import KineticHeadline from "@/components/landing/KineticHeadline";
import OrbitConstellation from "@/components/landing/OrbitConstellation";
import DataStreamWall from "@/components/landing/DataStreamWall";
import PsiraCompliance from "@/components/landing/PsiraCompliance";

/* ────────────────────────────────────────────────────────────────────────────
   Black Hawk SOC-OS · Editorial Premium Landing
   Instrument Serif display + Instrument Sans body + JetBrains Mono data.
   Hairline borders, generous spacing, neutral surfaces, restrained accents.
   ──────────────────────────────────────────────────────────────────────── */

// ─── Nav ────────────────────────────────────────────────────────────────────
const NAV = [
  { id: "platform", label: "Platform" },
  { id: "modules", label: "Modules" },
  { id: "operations", label: "Operations" },
  { id: "outcomes", label: "Outcomes" },
  { id: "deploy", label: "Deploy" },
];

const TopBar = ({ user }: { user: any }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled
          ? "backdrop-blur-xl bg-background/80 border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1280px] mx-auto h-16 px-6 lg:px-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={blackHawkLogo}
            alt="Black Hawk SOC-OS"
            width={1024}
            height={1024}
            className="h-9 w-9 object-contain"
          />
          <div className="leading-tight">
            <div className="text-[13px] font-medium tracking-tight">Black Hawk SOC-OS</div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.18em]">
              Security Operations OS
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition">
            <Command className="h-3 w-3" />
            <span className="font-mono">⌘K</span>
          </button>
          {user ? (
            <Button asChild size="sm" variant="default">
              <Link to="/management">
                Open console <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth">
                  Request access <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

// ─── Section primitives ─────────────────────────────────────────────────────
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
    <span className="h-1 w-1 rounded-full bg-foreground/60" />
    {children}
  </div>
);

const Section = ({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section id={id} className={`relative px-6 lg:px-10 py-24 lg:py-32 ${className}`}>
    <div className="max-w-[1280px] mx-auto">{children}</div>
  </section>
);

const Display = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2
    className={`font-display text-4xl md:text-5xl lg:text-6xl leading-[1.04] tracking-[-0.015em] ${className}`}
    style={{ fontFamily: '"Instrument Serif", serif' }}
  >
    {children}
  </h2>
);

// ─── Hero ───────────────────────────────────────────────────────────────────
const Hero = ({ user }: { user: any }) => (
  <section className="relative px-6 lg:px-10 pt-20 lg:pt-28 pb-16 lg:pb-24 overflow-hidden">
    {/* subtle grid backdrop */}
    <div
      aria-hidden
      className="absolute inset-0 opacity-[0.18] pointer-events-none"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "radial-gradient(ellipse at top, black 30%, transparent 75%)",
      }}
    />
    <div className="relative max-w-[1280px] mx-auto">
      <div className="max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <img
            src={blackHawkLogo}
            alt="Black Hawk SOC-OS emblem"
            width={1024}
            height={1024}
            className="h-20 w-20 md:h-24 md:w-24 object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          />
          <div className="hidden sm:block h-12 w-px bg-border" />
          <div className="hidden sm:block">
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Black Hawk</div>
            <div className="text-sm font-medium tracking-tight">SOC · OS</div>
          </div>
        </div>
        <Eyebrow>Security Operations · v2026.1</Eyebrow>
        <h1
          className="mt-6 text-[44px] md:text-[68px] lg:text-[84px] leading-[0.98] tracking-[-0.025em]"
          style={{ fontFamily: '"Instrument Serif", serif', fontWeight: 400 }}
        >
          The operating system for{" "}
          <em className="italic text-muted-foreground">modern</em> security
          operations.
        </h1>
        <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          Black Hawk SOC-OS unifies your control room, field officers, technical security and
          client reporting into one auditable platform — built for 24/7 command,
          designed like the tools you actually want to use.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {user ? (
            <Button asChild size="xl">
              <Link to="/management">
                Open console <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="xl">
              <Link to="/auth">
                Request access <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          )}
          <Button asChild size="xl" variant="outline">
            <a href="#operations">See it in operation</a>
          </Button>
        </div>

        {/* trust line */}
        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-[12px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> 24/7 control room
          </span>
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> Field-grade offline
          </span>
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> Tamper-evident audit
          </span>
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> RBAC + RLS
          </span>
        </div>
      </div>

      {/* Hero canvas */}
      <div className="mt-16 lg:mt-20 relative">
        <HeroCanvas />
      </div>

      {/* Stat strip */}
      <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {[
          { v: "24", s: "modules", l: "Unified across one console" },
          { v: "<2s", s: "", l: "Median dispatch time" },
          { v: "99.95%", s: "", l: "Operational uptime SLA" },
          { v: "100%", s: "", l: "Audit chain coverage" },
        ].map((s, i) => (
          <div key={i} className="bg-background p-6 lg:p-8">
            <div
              className="text-3xl lg:text-4xl tracking-tight tabular-nums"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {s.v}
              {s.s && <span className="text-muted-foreground text-xl">{s.s}</span>}
            </div>
            <div className="mt-2 text-[12px] text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Hero canvas (live mock) ────────────────────────────────────────────────
const HeroCanvas = () => (
  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-border bg-card">
    <div className="absolute inset-0 opacity-[0.22]">
      <img src={socHero} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background/90" />
    </div>

    {/* top status */}
    <div className="relative flex items-center justify-between px-5 py-3 border-b border-border bg-background/70 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span
          className="text-[11px] uppercase tracking-[0.22em]"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          BLACK HAWK · CONTROL ROOM · LIVE
        </span>
      </div>
      <div
        className="hidden sm:flex items-center gap-5 text-[10px] text-muted-foreground"
        style={{ fontFamily: '"JetBrains Mono", monospace' }}
      >
        <span>NAIROBI · UTC+03</span>
        <span>OP-NORM</span>
        <span>247 UNITS</span>
      </div>
    </div>

    {/* layout */}
    <div className="relative grid grid-cols-12 gap-2 p-2 h-[calc(100%-3rem)]">
      {/* incidents */}
      <div className="col-span-12 md:col-span-3 rounded-lg bg-background/80 border border-border p-3 hidden md:block">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Incident feed
        </div>
        {[
          { c: "bg-rose-400", t: "Alarm · Westlands HQ", s: "00:42" },
          { c: "bg-amber-400", t: "Patrol late · Site 14", s: "01:18" },
          { c: "bg-emerald-400", t: "Shift open · Karen", s: "02:05" },
          { c: "bg-rose-400", t: "SOS · MRT-07", s: "03:11" },
          { c: "bg-amber-400", t: "Geofence · K9-02", s: "04:00" },
        ].map((r, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2 border-b border-border last:border-0">
            <span className={`h-1.5 w-1.5 rounded-full ${r.c}`} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] truncate">{r.t}</div>
              <div
                className="text-[9px] text-muted-foreground"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                {r.s}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* map */}
      <div className="col-span-12 md:col-span-6 rounded-lg bg-background/40 border border-border relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {[
          { x: "22%", y: "40%", c: "bg-emerald-400" },
          { x: "55%", y: "55%", c: "bg-rose-400" },
          { x: "70%", y: "30%", c: "bg-amber-400" },
          { x: "40%", y: "70%", c: "bg-emerald-400" },
          { x: "82%", y: "65%", c: "bg-rose-400" },
        ].map((m, i) => (
          <div key={i} className="absolute" style={{ left: m.x, top: m.y }}>
            <span className={`block h-2 w-2 rounded-full ${m.c}`} />
            <span className={`absolute inset-0 rounded-full ${m.c} animate-ping opacity-40`} />
          </div>
        ))}
        <div
          className="absolute bottom-3 left-3 text-[10px] text-muted-foreground"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          LIVE OPERATIONS · 247 UNITS
        </div>
      </div>

      {/* right column */}
      <div className="col-span-12 md:col-span-3 hidden md:flex flex-col gap-2">
        <div className="rounded-lg bg-background/80 border border-border p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">CCTV</div>
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-video bg-muted/40 border border-border rounded relative overflow-hidden"
              >
                <div
                  className="absolute top-1 left-1 text-[8px] text-muted-foreground"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  CAM-{i + 1}
                </div>
                <div className="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-rose-400 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-background/80 border border-border p-3 flex-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Active officers
          </div>
          {["MRT-07 · Westlands", "K9-02 · Karen", "PTL-14 · CBD", "ESC-03 · Runda"].map((o, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 text-[11px] border-b border-border last:border-0"
            >
              <span className="truncate">{o}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── Platform pillars ───────────────────────────────────────────────────────
const PILLARS = [
  {
    icon: Activity,
    title: "Run the room",
    body: "One control room canvas — incidents, alarms, dispatch, CCTV and fleet — wired with SLA timers and SOPs.",
  },
  {
    icon: Network,
    title: "Command the field",
    body: "Officers, supervisors and MRT teams execute from a role-aware mobile platform, online or offline.",
  },
  {
    icon: Eye,
    title: "Prove the work",
    body: "Tamper-evident DOB, evidence chain, geofenced patrols, and client-grade reports built on every action.",
  },
  {
    icon: Gauge,
    title: "Decide with signal",
    body: "Executive scorecards, loss-control intelligence and strategic advisory turn data into next moves.",
  },
];

const Platform = () => (
  <Section id="platform" className="border-t border-border">
    <div className="grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-5">
        <Eyebrow>The platform</Eyebrow>
        <Display className="mt-5">
          One console.<br />
          <em className="italic text-muted-foreground">Every</em> operation.
        </Display>
        <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
          Most security businesses run on a stack of disconnected tools — radios,
          spreadsheets, WhatsApp, paper OBs. Black Hawk SOC-OS replaces all of it with one
          coherent system designed by people who run a 24/7 control room.
        </p>
      </div>
      <div className="lg:col-span-7 grid sm:grid-cols-2 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {PILLARS.map((p) => (
          <div key={p.title} className="bg-background p-7 lg:p-8">
            <p.icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
            <div className="mt-5 text-lg tracking-tight">{p.title}</div>
            <div className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">{p.body}</div>
          </div>
        ))}
      </div>
    </div>
  </Section>
);

// ─── Modules grid ───────────────────────────────────────────────────────────
const MODULE_GROUPS: { group: string; items: { icon: any; name: string; line: string }[] }[] = [
  {
    group: "Control",
    items: [
      { icon: Radio, name: "Control Room Command", line: "10-desk command hub with SOP overlays" },
      { icon: ShieldAlert, name: "Alarm & Mobile Response", line: "Unified MDT + MRT dispatch engine" },
      { icon: BookLock, name: "Digital Occurrence Book", line: "Immutable, role-aware operational log" },
    ],
  },
  {
    group: "Field",
    items: [
      { icon: MapPin, name: "GPS Patrol Tracking", line: "Live geofenced positions + heatmaps" },
      { icon: Fingerprint, name: "Supervision Patrol", line: "QR / NFC / RFID verified guard tours" },
      { icon: Users, name: "Field Officers", line: "Rank-aware mobile platform, offline-first" },
    ],
  },
  {
    group: "Technical",
    items: [
      { icon: Camera, name: "CCTV & Video", line: "Multi-vendor — Dahua, Hikvision, ONVIF" },
      { icon: Video, name: "Body Cam Streaming", line: "Live stream + evidence vault" },
      { icon: Lock, name: "Access Control", line: "Grants, logs, anomaly alerts" },
      { icon: Cpu, name: "Technical Security", line: "Job cards, device health, SLAs" },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { icon: Search, name: "Investigations", line: "Case files with full evidence chain" },
      { icon: Globe2, name: "Strategic Advisory", line: "AI-scored threat & advisory feed" },
      { icon: BarChart3, name: "Analytics & Reports", line: "Trends, compliance, risk scoring" },
    ],
  },
  {
    group: "Specialised",
    items: [
      { icon: Dog, name: "K9 Unit", line: "Handler, welfare, deployment register" },
      { icon: Crown, name: "Escort & VIP", line: "Route risk + protective detail" },
      { icon: Truck, name: "Courier Operations", line: "Chain-of-custody dispatch" },
    ],
  },
  {
    group: "Management",
    items: [
      { icon: Users, name: "Staff & Payroll", line: "Roster, leave, equipment, pay" },
      { icon: GraduationCap, name: "Training", line: "Certification matrix + e-learning" },
      { icon: Building2, name: "Client Management", line: "Sites, risk tier, service contracts" },
    ],
  },
];

const Modules = () => (
  <Section id="modules" className="border-t border-border">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
      <div>
        <Eyebrow>24 modules</Eyebrow>
        <Display className="mt-5 max-w-2xl">
          Every desk in your operation,<br />
          <em className="italic text-muted-foreground">in one place</em>.
        </Display>
      </div>
      <p className="max-w-md text-muted-foreground">
        Six departments, twenty-four modules, one shared dataset. Modules aren't
        bolted on — they share state, audit trails and permissions natively.
      </p>
    </div>

    <div className="space-y-12">
      {MODULE_GROUPS.map((g) => (
        <div key={g.group}>
          <div className="flex items-baseline justify-between mb-5">
            <div
              className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {g.group}
            </div>
            <div className="h-px flex-1 bg-border ml-6" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
            {g.items.map((m) => (
              <div
                key={m.name}
                className="group bg-background p-5 hover:bg-muted/30 transition-colors cursor-default"
              >
                <div className="flex items-start justify-between">
                  <m.icon className="h-4.5 w-4.5 text-foreground" strokeWidth={1.75} />
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="mt-4 text-[14px] tracking-tight">{m.name}</div>
                <div className="mt-1 text-[12.5px] text-muted-foreground leading-snug">{m.line}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Section>
);

// ─── Operations editorial split ─────────────────────────────────────────────
const Operations = () => (
  <Section id="operations" className="border-t border-border">
    <div className="grid lg:grid-cols-12 gap-12 items-start">
      <div className="lg:col-span-5 lg:sticky lg:top-28">
        <Eyebrow>In operation</Eyebrow>
        <Display className="mt-5">
          Built around the <em className="italic text-muted-foreground">minute-by-minute</em>{" "}
          reality of running security.
        </Display>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          Every workflow in Black Hawk SOC-OS was designed alongside a live control room —
          from the way alarms are triaged, to how an MRT team confirms arrival on
          scene, to the report that lands on a client's desk the next morning.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild>
            <Link to="/management">
              Walk through it <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-3">
        {[
          {
            t: "00:00",
            title: "Alarm fires at Westlands HQ",
            body: "Panel ingests via MDT. Operator gets a colour-tagged card with site, contact tree and SOP overlay.",
          },
          {
            t: "00:18",
            title: "Auto-dispatch routes nearest MRT",
            body: "Routing engine reads live GPS, geofences and current workload. SLA timer starts.",
          },
          {
            t: "01:42",
            title: "Officer arrives, scans checkpoint",
            body: "QR scan + selfie + GPS proof writes to DOB and Live Patrol Monitor in the same second.",
          },
          {
            t: "02:30",
            title: "Body cam streams to control room",
            body: "Live verification, automatic upload to evidence vault, immutable hash.",
          },
          {
            t: "06:00",
            title: "Client report in inbox",
            body: "Auto-generated incident brief with timeline, evidence links and SLA performance.",
          },
        ].map((row) => (
          <Card key={row.title} className="p-6 hover:border-foreground/20 transition-colors">
            <div className="flex gap-6">
              <div
                className="text-muted-foreground text-sm tabular-nums shrink-0 w-14 pt-0.5"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                {row.t}
              </div>
              <div className="flex-1">
                <div className="text-[15px] tracking-tight">{row.title}</div>
                <div className="mt-1.5 text-[13.5px] text-muted-foreground leading-relaxed">
                  {row.body}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </Section>
);

// ─── Outcomes ───────────────────────────────────────────────────────────────
const Outcomes = () => (
  <Section id="outcomes" className="border-t border-border">
    <div className="max-w-3xl">
      <Eyebrow>Outcomes</Eyebrow>
      <Display className="mt-5">
        Not features. <em className="italic text-muted-foreground">Results</em>.
      </Display>
      <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
        Operators who switch to Black Hawk SOC-OS consistently report the same shifts in
        the first ninety days.
      </p>
    </div>

    <div className="mt-14 grid md:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
      {[
        {
          k: "−42%",
          h: "Median response time",
          b: "Auto-dispatch + live geofence visibility cut idle minutes between alarm and arrival.",
        },
        {
          k: "+3.1×",
          h: "Patrol compliance",
          b: "QR / RFID checkpoints with selfie + GPS proof move the score from honour-system to evidence-based.",
        },
        {
          k: "0",
          h: "Lost OB entries",
          b: "Tamper-evident DOB replaces paper. Every entry is signed, numbered, and audit-traceable.",
        },
        {
          k: "−68%",
          h: "Report turnaround",
          b: "Client incident reports auto-compose from the operational record. Hours, not days.",
        },
        {
          k: "1×",
          h: "Source of truth",
          b: "One platform replaces radios, spreadsheets, WhatsApp and paper logs. Audit anywhere.",
        },
        {
          k: "24/7",
          h: "Operational continuity",
          b: "Offline-first field app, multi-region database, role-aware access — built for never going down.",
        },
      ].map((o) => (
        <div key={o.h} className="bg-background p-7 lg:p-8">
          <div
            className="text-4xl tracking-tight tabular-nums"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            {o.k}
          </div>
          <div className="mt-4 text-[15px] tracking-tight">{o.h}</div>
          <div className="mt-2 text-[13px] text-muted-foreground leading-relaxed">{o.b}</div>
        </div>
      ))}
    </div>
  </Section>
);

// ─── Deploy / portals ───────────────────────────────────────────────────────
const PORTALS = [
  {
    icon: Command,
    eyebrow: "Management",
    title: "Console",
    body: "Executives, control room and HQ run the entire operation from one workspace.",
    cta: { label: "Open console", to: "/management" },
  },
  {
    icon: Shield,
    eyebrow: "Field",
    title: "Field Platform",
    body: "Officers and supervisors get a rank-aware mobile platform — offline-first, voice-enabled.",
    cta: { label: "Field app", to: "/field-app" },
  },
  {
    icon: Building2,
    eyebrow: "Client",
    title: "Client Portal",
    body: "Clients see their sites, incidents, reports and SLA scoreboard in a clean, branded view.",
    cta: { label: "Client portal", to: "/client-portal" },
  },
];

const Deploy = () => (
  <Section id="deploy" className="border-t border-border">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
      <div>
        <Eyebrow>Three portals · one platform</Eyebrow>
        <Display className="mt-5">
          The right view<br />
          for <em className="italic text-muted-foreground">every</em> role.
        </Display>
      </div>
      <p className="max-w-md text-muted-foreground">
        The same dataset, surfaced through three deeply tailored experiences —
        nothing irrelevant, nothing missing.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
      {PORTALS.map((p) => (
        <div key={p.title} className="bg-background p-8 flex flex-col">
          <p.icon className="h-5 w-5" strokeWidth={1.75} />
          <div
            className="mt-5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            {p.eyebrow}
          </div>
          <div
            className="mt-2 text-3xl tracking-tight"
            style={{ fontFamily: '"Instrument Serif", serif' }}
          >
            {p.title}
          </div>
          <p className="mt-3 text-[13.5px] text-muted-foreground leading-relaxed flex-1">{p.body}</p>
          <Button asChild variant="ghost" className="mt-6 self-start px-0 hover:bg-transparent">
            <Link to={p.cta.to}>
              {p.cta.label} <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  </Section>
);

// ─── Live Ticker ────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { i: CheckCircle2, t: "Patrol verified · Karen Estate · QR-CP-08", c: "text-emerald-400" },
  { i: AlertTriangle, t: "Alarm cleared · Westlands HQ · MRT-07 · 04:12", c: "text-amber-400" },
  { i: Radio, t: "Dispatch · K9-02 → CBD · ETA 3 min", c: "text-emerald-400" },
  { i: Video, t: "CCTV clip vaulted · CAM-04 · EVD-2025-1188", c: "text-emerald-400" },
  { i: AlertTriangle, t: "SOS · MRT-03 · Runda Gate · Acknowledged", c: "text-rose-400" },
  { i: Shield, t: "DOB sealed · DOB-2025-04829 · Cpl. Otieno", c: "text-emerald-400" },
  { i: MapPin, t: "Geofence breach · PTL-14 · auto-flagged", c: "text-amber-400" },
  { i: Activity, t: "Shift opened · Karen · 12 officers on duty", c: "text-emerald-400" },
  { i: CheckCircle2, t: "Investigation INV-2025-00347 → Approved", c: "text-emerald-400" },
  { i: Radio, t: "Mobile response · ALPHA QRF-1 · arrived 02:41", c: "text-emerald-400" },
];

const LiveTicker = () => {
  const stream = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="relative w-full overflow-hidden border-y border-border bg-background">
      <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      <div className="flex items-center">
        <div className="flex items-center gap-2 px-4 py-3 border-r border-border shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span
            className="text-[10px] uppercase tracking-[0.22em] text-foreground"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            Live · Black Hawk Network
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-12 py-3 animate-[bh-marquee_80s_linear_infinite] whitespace-nowrap">
            {stream.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-[12px]">
                <t.i className={`h-3.5 w-3.5 ${t.c}`} />
                <span className="text-foreground/80">{t.t}</span>
                <span className="text-muted-foreground/50">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bh-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

// ─── Capability comparison ──────────────────────────────────────────────────
type CmpCell = "yes" | "partial" | "no";
const CMP_COLS = ["Black Hawk SOC-OS", "Spreadsheets", "Generic guard app", "Foreign SaaS"] as const;
const CMP_ROWS: { cap: string; cells: CmpCell[] }[] = [
  { cap: "Audit-grade Digital Occurrence Book", cells: ["yes", "no", "partial", "yes"] },
  { cap: "Offline-capable MDT for field officers", cells: ["yes", "no", "partial", "no"] },
  { cap: "Native Dahua / Hikvision integration", cells: ["yes", "no", "no", "partial"] },
  { cap: "Tramigo GPS & INRICO radio bridge", cells: ["yes", "no", "no", "no"] },
  { cap: "K9, Escort, Courier specialised modules", cells: ["yes", "no", "no", "partial"] },
  { cap: "Strategic Advisory + AI threat analysis", cells: ["yes", "no", "no", "partial"] },
  { cap: "Real-time SOS & geofence enforcement", cells: ["yes", "no", "partial", "yes"] },
  { cap: "Body-cam streaming + evidence vault", cells: ["yes", "no", "no", "partial"] },
  { cap: "Loss Control intelligence engine", cells: ["yes", "no", "no", "no"] },
  { cap: "Kenya Data Protection Act aligned", cells: ["yes", "no", "no", "partial"] },
  { cap: "Multi-tenant client portals", cells: ["yes", "no", "no", "yes"] },
  { cap: "24/7 follow-the-sun support · 4 regions", cells: ["yes", "no", "partial", "partial"] },
  { cap: "Multi-currency billing & multi-language UI", cells: ["yes", "no", "no", "yes"] },
  { cap: "GDPR · POPIA · NDPR · DPA data residency", cells: ["yes", "no", "no", "partial"] },
];

const CmpMark = ({ v }: { v: CmpCell }) => {
  if (v === "yes")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-foreground/40 text-foreground">
        <Check className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
    );
  if (v === "partial")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
      </span>
    );
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground/40">
      <X className="h-3.5 w-3.5" />
    </span>
  );
};

const Comparison = () => (
  <Section className="border-t border-border">
    <div className="max-w-3xl mb-14">
      <Eyebrow>Capability comparison</Eyebrow>
      <Display className="mt-5">
        Why operators move <em className="italic text-muted-foreground">off the patchwork</em>.
      </Display>
      <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
        An honest read of where Black Hawk SOC-OS stands against the tools most security
        businesses piece together.
      </p>
    </div>
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border">
              <th
                className="text-left px-5 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-normal"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                Capability
              </th>
              {CMP_COLS.map((c, i) => (
                <th
                  key={c}
                  className={`px-4 py-4 text-center text-[12px] font-medium ${
                    i === 0 ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CMP_ROWS.map((r) => (
              <tr key={r.cap} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5 text-foreground/85">{r.cap}</td>
                {r.cells.map((c, i) => (
                  <td key={i} className={`px-4 py-3.5 text-center ${i === 0 ? "bg-muted/30" : ""}`}>
                    <div className="inline-flex justify-center"><CmpMark v={c} /></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="flex flex-wrap items-center gap-5 px-5 py-3 border-t border-border bg-muted/20 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
        style={{ fontFamily: '"JetBrains Mono", monospace' }}
      >
        <span className="flex items-center gap-2"><CmpMark v="yes" />Full</span>
        <span className="flex items-center gap-2"><CmpMark v="partial" />Partial</span>
        <span className="flex items-center gap-2"><CmpMark v="no" />Not supported</span>
      </div>
    </Card>
  </Section>
);

// ─── Integrations ───────────────────────────────────────────────────────────
const INTEGRATIONS: { group: string; items: { name: string; line: string }[] }[] = [
  {
    group: "Video & access",
    items: [
      { name: "Dahua", line: "ONVIF · RTSP · live + playback" },
      { name: "Hikvision", line: "ONVIF · ISAPI · event triggers" },
      { name: "ONVIF (any)", line: "Auto-discovery + profile S/T" },
      { name: "Body-cam vendors", line: "Live stream + evidence sync" },
    ],
  },
  {
    group: "Field & telemetry",
    items: [
      { name: "Tramigo GPS", line: "Vehicle telemetry + geofence" },
      { name: "INRICO PoC", line: "Push-to-talk radio bridge" },
      { name: "Motorola radios", line: "Dispatch channel integration" },
      { name: "QR / NFC / RFID", line: "Checkpoint + clock-in proof" },
    ],
  },
  {
    group: "Comms & ops",
    items: [
      { name: "SMS gateways", line: "SOS fallback + notifications" },
      { name: "WhatsApp Business", line: "Client incident updates" },
      { name: "eSIM dial pad", line: "In-console telephony" },
      { name: "Alarm panels", line: "Generic IP + serial bridge" },
    ],
  },
  {
    group: "Identity & data",
    items: [
      { name: "SSO / SAML", line: "Enterprise identity provider" },
      { name: "Biometric devices", line: "Officer auth + clock-in" },
      { name: "Webhooks API", line: "Outbound to your stack" },
      { name: "REST API", line: "Read & write across modules" },
    ],
  },
];

const Integrations = () => (
  <Section id="integrations" className="border-t border-border">
    <div className="grid lg:grid-cols-12 gap-12 mb-14">
      <div className="lg:col-span-5">
        <Eyebrow>Integrations</Eyebrow>
        <Display className="mt-5">
          Connects to the<br />
          <em className="italic text-muted-foreground">hardware you already own</em>.
        </Display>
      </div>
      <div className="lg:col-span-7">
        <p className="text-muted-foreground text-lg leading-relaxed">
          Black Hawk SOC-OS bridges the messy reality of operational hardware — mixed
          cameras, GPS units, radios and panels — into a single coherent control
          surface. No rip-and-replace.
        </p>
      </div>
    </div>

    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden">
      {INTEGRATIONS.map((g) => (
        <div key={g.group} className="bg-background p-6">
          <div className="flex items-center gap-2 mb-5">
            <Plug className="h-3.5 w-3.5 text-muted-foreground" />
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {g.group}
            </div>
          </div>
          <div className="space-y-3.5">
            {g.items.map((it) => (
              <div key={it.name}>
                <div className="text-[13.5px] tracking-tight">{it.name}</div>
                <div className="text-[12px] text-muted-foreground leading-snug mt-0.5">{it.line}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </Section>
);

// ─── Security & compliance ──────────────────────────────────────────────────
const SECURITY_ITEMS = [
  { icon: Lock, label: "AES-256 at rest" },
  { icon: KeyRound, label: "TLS 1.3 in transit" },
  { icon: Shield, label: "RBAC + Row-Level Security" },
  { icon: FileLock2, label: "SHA-256 evidence hashing" },
  { icon: ScrollText, label: "Immutable audit chain" },
  { icon: Globe2, label: "Kenya Data Protection Act aligned" },
  { icon: Fingerprint, label: "SSO + biometric ready" },
  { icon: Database, label: "Tenant-isolated data" },
];

const Security = () => (
  <Section className="border-t border-border">
    <div className="grid lg:grid-cols-12 gap-12 items-start">
      <div className="lg:col-span-5">
        <Eyebrow>Security & compliance</Eyebrow>
        <Display className="mt-5">
          Built for a room that<br />
          <em className="italic text-muted-foreground">cannot</em> leak.
        </Display>
        <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
          Encryption, role-based access and tamper-evident logs aren't add-ons —
          they sit underneath every entry, every dispatch, every report. Your
          data, your tenant, your audit trail.
        </p>
      </div>
      <div className="lg:col-span-7 grid sm:grid-cols-2 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {SECURITY_ITEMS.map((s) => (
          <div key={s.label} className="bg-background p-5 flex items-center gap-3.5">
            <s.icon className="h-4 w-4 text-foreground shrink-0" strokeWidth={1.75} />
            <span className="text-[13.5px]">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  </Section>
);

// ─── Deployment models ──────────────────────────────────────────────────────
const DEPLOY_MODELS = [
  {
    icon: Cloud,
    name: "Cloud SOC",
    sub: "Multi-tenant SaaS",
    latency: "~80–120ms",
    ideal: "Mid-market & residential portfolios",
    points: ["Zero on-site infrastructure", "Auto-scaling", "Shared 24/7 monitoring"],
  },
  {
    icon: Server,
    name: "On-premise",
    sub: "Client-hosted",
    latency: "Sub-10ms LAN",
    ideal: "Banks, government, sensitive sites",
    points: ["Full data sovereignty", "Air-gap option", "Dedicated SOC desk"],
  },
  {
    icon: Radio,
    name: "Hybrid edge",
    sub: "On-site + cloud HQ",
    latency: "Edge real-time, cloud sync",
    ideal: "National operators, multi-site enterprises",
    points: ["Edge survives outages", "Centralised intelligence", "Best of both"],
  },
];

const Deployments = () => (
  <Section className="border-t border-border">
    <div className="max-w-3xl mb-14">
      <Eyebrow>Deployment models</Eyebrow>
      <Display className="mt-5">
        Hosted by us. Hosted by you.<br />
        <em className="italic text-muted-foreground">Or both.</em>
      </Display>
    </div>
    <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
      {DEPLOY_MODELS.map((m) => (
        <div key={m.name} className="bg-background p-7 lg:p-8 flex flex-col">
          <m.icon className="h-5 w-5" strokeWidth={1.75} />
          <div className="mt-5 text-2xl tracking-tight" style={{ fontFamily: '"Instrument Serif", serif' }}>
            {m.name}
          </div>
          <div className="text-[12px] text-muted-foreground mt-1">{m.sub}</div>
          <div className="mt-6 grid grid-cols-2 gap-2.5 text-[12px]">
            <div className="rounded-md border border-border p-2.5">
              <div
                className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                Latency
              </div>
              <div className="mt-1 tabular-nums" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {m.latency}
              </div>
            </div>
            <div className="rounded-md border border-border p-2.5">
              <div
                className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                Ideal for
              </div>
              <div className="mt-1 leading-tight">{m.ideal}</div>
            </div>
          </div>
          <ul className="mt-5 space-y-1.5 text-[13px] text-foreground/80">
            {m.points.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-muted-foreground">—</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </Section>
);

// ─── Implementation timeline ────────────────────────────────────────────────
const TIMELINE = [
  { icon: ClipboardCheck, w: "Week 1", t: "Discovery", d: "Stakeholder workshops, current-state audit, module scoping." },
  { icon: MapPin, w: "Week 2", t: "Sites & hardware", d: "QR / RFID install, body-cam provisioning, integrations mapped." },
  { icon: GraduationCap, w: "Week 3", t: "Training", d: "Operator drills, supervisor enablement, client portal walk-through." },
  { icon: Rocket, w: "Week 4", t: "Go-live", d: "Cutover, parallel run, 24/7 white-glove support." },
  { icon: Activity, w: "Ongoing", t: "Optimisation", d: "Quarterly tuning, advisory cadence, capability roadmap." },
];

const Timeline = () => (
  <Section className="border-t border-border">
    <div className="max-w-3xl mb-14">
      <Eyebrow>Implementation</Eyebrow>
      <Display className="mt-5">
        Live in <em className="italic text-muted-foreground">four weeks</em>. Tuned forever.
      </Display>
      <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
        A predictable, rehearsed roll-out — from the first stakeholder workshop
        to a fully cut-over control room.
      </p>
    </div>
    <div className="grid md:grid-cols-5 gap-px bg-border border border-border rounded-xl overflow-hidden">
      {TIMELINE.map((s, i) => (
        <div key={s.t} className="bg-background p-6">
          <div className="flex items-center justify-between">
            <div className="h-9 w-9 rounded-full border border-border bg-background grid place-items-center">
              <s.icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div
              className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {String(i + 1).padStart(2, "0")} / {String(TIMELINE.length).padStart(2, "0")}
            </div>
          </div>
          <div
            className="mt-5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            {s.w}
          </div>
          <div className="mt-1 text-[15px] tracking-tight">{s.t}</div>
          <div className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed">{s.d}</div>
        </div>
      ))}
    </div>
  </Section>
);

// ─── Pricing ────────────────────────────────────────────────────────────────
type Tier = {
  code: string;
  name: string;
  target: string;
  /** Base monthly price in KES per guard. `null` = custom / enterprise. */
  monthly: number | null;
  unit: string;
  modules: string[];
  solutions: string[];
  cta: string;
  highlight?: boolean;
  badge?: string;
};

// Pricing benchmarked against TrackTik / Silvertrac ($10–25/guard ≈ KES 1,300–3,200),
// Safetrac ($8/user ≈ KES 1,050) and Sean360 (Kenya). Rates set for healthy margin
// while remaining competitive for African market operators.
// Flat per-guard guarding rate — KES 80 / guard / month across every tier.
// All tier prices and the estimator derive from this single anchor so pricing
// scales linearly from a 10-guard site to a 5,000-guard national operator.
const PER_GUARD_RATE = 50;

const TIERS: Tier[] = [
  {
    code: "T00",
    name: "Launch",
    target: "Growing Officers  up to 100 guards",
    monthly: 100 * PER_GUARD_RATE,
    unit: `/ month · KES ${PER_GUARD_RATE} per guard`,
    modules: [
      "Digital Occurrence Book",
      "Supervision Patrol (QR / RFID)",
      "Basic staff register & roster",
      "Mobile field app (offline-ready)",
    ],
    solutions: [
      "1 controller seat",
      "1 supervisor seat",
      "2 GB evidence · 14-day retention",
      "Self-serve setup · no card required",
      "14-day free trial · cancel anytime",
    ],

    cta: "Start free trial",
    badge: "Starts here",
  },
  {
    code: "T01",
    name: "Starter",
    target: "Growing operators · 100–250 guards",
    monthly: 250 * PER_GUARD_RATE,
    unit: `/ month · KES ${PER_GUARD_RATE} per guard`,
    modules: [
      "Everything in Launch",
      "Full incident reporting",
      "Staff register & shift roster",
      "Client portal (read-only)",
      "Email support · business hours",
    ],
    solutions: [
      "2 control-room seats",
      "5 GB evidence · 30-day retention",
      "Guided onboarding (remote)",
      "No setup fee · month-to-month",
    ],
    cta: "Start a pilot",
  },

  {
    code: "T02",
    name: "Operations",
    target: "Growing fleets · 250–500 guards",
    monthly: 500 * PER_GUARD_RATE,
    unit: `/ month · KES ${PER_GUARD_RATE} per guard`,

    modules: [
      "Everything in Starter",
      "GPS Patrol Tracking + geofence",
      "Alarm & Mobile Response (MDT)",
      "Full Incident Management",
      "Communications hub (SMS · WhatsApp)",
      "Payroll & attendance integration",
    ],
    solutions: [
      "3 control-room seats included",
      "50 GB evidence · 90-day retention",
      "Email + chat support",
      "Free onboarding & training (1 day)",
    ],
    cta: "Get started",
  },
  {
    code: "T03",
    name: "Command",
    target: "Mid-market · 500–1,000 guards",
    monthly: 1000 * PER_GUARD_RATE,
    unit: `/ month · KES ${PER_GUARD_RATE} per guard`,
    modules: [
      "Everything in Operations",
      "Control Room Command Centre",
      "CCTV monitoring (Dahua · Hikvision)",
      "Body-cam streaming & evidence",
      "Strategic Advisory intelligence",
      "Investigations & case management",
    ],
    solutions: [
      "8 SOC seats included",
      "500 GB evidence · 1-yr retention",
      "Auto-dispatch + SLA engine",
      "24/7 priority support",
      "Quarterly business review",
    ],
    cta: "Talk to sales",
    highlight: true,
    badge: "Most deployed",
  },
  {
    code: "T04",
    name: "Specialised",
    target: "CIT · K9 · VIP · Couriers",
    monthly: 1500 * PER_GUARD_RATE,
    unit: `/ month · KES ${PER_GUARD_RATE} per guard`,
    modules: [
      "Everything in Command",
      "K9 Unit management",
      "Escort & VIP protection",
      "Courier & cash-in-transit",
      "Loss Control intelligence",
      "Event Security planning",
    ],
    solutions: [
      "15 SOC seats included",
      "1 TB evidence · 2-yr retention",
      "Tramigo GPS / INRICO radio bridge",
      "Dedicated success engineer",
      "On-site enablement (2 days)",
    ],
    cta: "Design a plan",
  },
  {
    code: "T05",
    name: "Enterprise SOC",
    target: "National · 1,000+ guards · scales on demand",
    monthly: null,
    unit: `From KES ${PER_GUARD_RATE} / guard / mo · volume scale`,
    modules: [
      "Full module suite (all 24)",
      "Multi-tenant client portals",
      "Technical Security governance",
      "Finance suite + multi-currency",
      "Training & certification engine",
      "AI advisory + predictive analytics",
    ],
    solutions: [
      "Unlimited seats & sites",
      "On-prem · cloud · hybrid edge",
      "White-label & custom domain",
      "MSA · DPA · 99.95% uptime SLA",
      "Named CSM + dedicated infrastructure",
    ],
    cta: "Request proposal",
    badge: "Enterprise",
  },
];

type BillingCycle = "monthly" | "quarterly" | "annual";

const CYCLES: { id: BillingCycle; label: string; discount: number; suffix: string }[] = [
  { id: "monthly",   label: "Monthly",   discount: 0,    suffix: "/ month" },
  { id: "quarterly", label: "Quarterly", discount: 0.08, suffix: "/ month · billed quarterly" },
  { id: "annual",    label: "Annual",    discount: 0.15, suffix: "/ month · billed annually" },
];

// Per-guard guarding bands — flat KES 80 / guard / month across the board.
// The tier label is informational; the monthly total is always guards × 80.
const GUARD_BANDS: { upTo: number; tier: string }[] = [
  { upTo: 100,   tier: "Launch"         },
  { upTo: 250,   tier: "Starter"        },

  { upTo: 500,   tier: "Operations"     },
  { upTo: 1000,  tier: "Command"        },
  { upTo: 1500,  tier: "Specialised"    },
  { upTo: 99999, tier: "Enterprise SOC" },
];

const ENTERPRISE_PER_GUARD = PER_GUARD_RATE;

const estimateMonthly = (guards: number) => {
  const band = GUARD_BANDS.find((b) => guards <= b.upTo) ?? GUARD_BANDS[GUARD_BANDS.length - 1];
  const total = guards * PER_GUARD_RATE;
  return { total, tier: band.tier, perGuard: PER_GUARD_RATE };
};

// Indicative competitor benchmarks (per guard / month) — surface the savings story
// that's currently hidden in a code comment.
const COMPETITORS = [
  { name: "TrackTik",   perGuard: 1950, region: "North America" },
  { name: "Silvertrac", perGuard: 1650, region: "North America" },
  { name: "Safetrac",   perGuard: 1050, region: "EU" },
  { name: "Sean360",    perGuard: 950,  region: "Kenya" },
];

// ── Solutions: module bundles the operator can switch on. Each solution
//    has 3 outcome tiers (Essential / Pro / Advanced) so operators dial in
//    exactly the depth they need — and only pay for that depth.
type SolutionLevel = { id: "essential" | "pro" | "advanced"; label: string; perGuard: number; outcome: string };
type SolutionAddOn = { id: string; label: string; blurb: string; levels: SolutionLevel[] };

const lv = (essential: number, pro: number, advanced: number, outcomes: [string, string, string]): SolutionLevel[] => [
  { id: "essential", label: "Essential", perGuard: essential, outcome: outcomes[0] },
  { id: "pro",       label: "Pro",       perGuard: pro,       outcome: outcomes[1] },
  { id: "advanced",  label: "Advanced",  perGuard: advanced,  outcome: outcomes[2] },
];

const SOLUTIONS: SolutionAddOn[] = [
  { id: "patrol",   label: "Patrol & DOB Core",       blurb: "Included in every plan",
    levels: [{ id: "essential", label: "Included", perGuard: 0, outcome: "DOB + patrols + checkpoints" }] as SolutionLevel[] },
  { id: "mdt",      label: "Alarm & Mobile Response", blurb: "MDT + auto-dispatch + SLA",
    levels: lv(3, 5, 8, ["Manual dispatch", "Auto-dispatch + SLA", "Multi-QRF + heatmaps"]) },
  { id: "gps",      label: "GPS Patrol Tracking",     blurb: "Geofence + live map",
    levels: lv(2, 4, 6, ["Live map only", "Geofence + alerts", "AI route optimisation"]) },
  { id: "control",  label: "Control Room Command",    blurb: "Multi-seat SOC console",
    levels: lv(3, 5, 8, ["1 seat", "Up to 4 seats", "Unlimited + AI co-pilot"]) },
  { id: "cctv",     label: "CCTV + Body-cam",         blurb: "Dahua / Hikvision + streaming",
    levels: lv(4, 7, 11, ["Recording only", "Live + 30-day clips", "AI analytics + 90-day evidence"]) },
  { id: "advisory", label: "Strategic Advisory AI",   blurb: "Intelligence + risk forecast",
    levels: lv(2, 4, 6, ["Daily brief", "Risk forecast", "Custom intel + scenarios"]) },
  { id: "hr",       label: "HR & Workforce",          blurb: "Onboarding, leave, attendance, discipline",
    levels: lv(2, 3, 5, ["Records + leave", "Attendance + discipline", "Performance + training matrix"]) },
  { id: "finance",  label: "Finance & Payroll",       blurb: "Payroll, invoices, expenses, statutory",
    levels: lv(2, 4, 6, ["Payslips only", "Payroll + invoices", "Full ledger + statutory returns"]) },
  { id: "training", label: "Training & Certification", blurb: "Courses, exams, expiry tracking",
    levels: lv(1, 3, 5, ["Course library", "Exams + certificates", "Competency matrix + renewals"]) },
  { id: "client",   label: "Client Portal & SLA",      blurb: "Free · self-service reports + SLA dashboards",
    levels: lv(0, 2, 4, ["Free read-only portal", "Live SLA dashboards", "White-label + custom reports"]) },
  { id: "incident", label: "Incident & Investigation", blurb: "Case files, evidence chain, court packs",
    levels: lv(2, 4, 6, ["Incident log", "Case management", "Investigations + court packs"]) },
  { id: "comms",    label: "Communications Hub",       blurb: "SMS, WhatsApp, voice, eSIM dial-pad",
    levels: lv(2, 3, 5, ["SMS + WhatsApp", "Voice + recordings", "Full call-centre + eSIM"]) },
  { id: "docs",     label: "Documents & Compliance",   blurb: "PSIRA, licences, SOPs, expiry alerts",
    levels: lv(1, 2, 4, ["Repository", "Expiry alerts", "Audit-ready compliance pack"]) },
  { id: "analytics",label: "Executive Analytics",      blurb: "Scorecards, KPIs, board reports",
    levels: lv(2, 4, 7, ["Operational KPIs", "Executive scorecards", "Predictive analytics + board pack"]) },
];

// ── Special Units: deeply favourable flat fees per active unit. Designed
//    so even small firms can switch on CIT / K9 / VIP / Events without
//    blowing their monthly budget.
type SpecialUnit = { id: string; label: string; perUnit: number; unitWord: string; blurb: string };
const SPECIAL_UNITS: SpecialUnit[] = [
  { id: "cit",      label: "Cash-in-Transit crew",   perUnit: 150, unitWord: "crew",    blurb: "Route + custody + panic" },
  { id: "k9",       label: "K9 Unit",                perUnit: 100, unitWord: "unit",    blurb: "Handler + dog welfare log" },
  { id: "vip",      label: "VIP / Close Protection", perUnit: 120, unitWord: "detail",  blurb: "Escort + advance recce" },
  { id: "courier",  label: "Courier / Rider fleet",  perUnit:  80, unitWord: "fleet",   blurb: "Dispatch + live tracking" },
  { id: "events",   label: "Event Security squad",   perUnit:  60, unitWord: "event",   blurb: "Planning + shift workflow" },
  { id: "loss",     label: "Loss Control desk",      perUnit:  90, unitWord: "desk",    blurb: "Shrink + behavioural risk" },
  { id: "mrt",      label: "Mobile Response Team",   perUnit: 130, unitWord: "team",    blurb: "QRF vehicle + SLA timer" },
  { id: "armed",    label: "Armed Reaction Unit",    perUnit: 160, unitWord: "unit",    blurb: "Firearm register + custody" },
  { id: "tech",     label: "Technical Security crew",perUnit:  85, unitWord: "crew",    blurb: "Install + maintenance ops" },
  { id: "investig", label: "Investigations Desk",    perUnit: 110, unitWord: "desk",    blurb: "Case files + evidence chain" },
  { id: "marine",   label: "Marine / Port Security", perUnit: 140, unitWord: "patrol",  blurb: "Vessel + dockside ops" },
  { id: "drone",    label: "Drone / Aerial Recon",   perUnit:  95, unitWord: "drone",   blurb: "Flight log + geofence" },
  { id: "exec",     label: "Executive Protection",   perUnit: 180, unitWord: "principal", blurb: "Advance + residence + travel" },
  { id: "canine",   label: "Detection K9 (EDD/NDD)", perUnit: 130, unitWord: "team",    blurb: "Explosives / narcotics sweeps" },
];


const formatKES = (n: number) =>
  "KES " + Math.round(n).toLocaleString("en-KE");


const Pricing = () => {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [guards, setGuards] = useState<number>(150);
  const [selectedSolutions, setSelectedSolutions] = useState<string[]>(["patrol", "mdt", "gps"]);
  const [solutionLevels, setSolutionLevels] = useState<Record<string, SolutionLevel["id"]>>({
    patrol: "essential", mdt: "essential", gps: "essential", control: "essential",
    cctv: "essential", advisory: "essential", hr: "essential", finance: "essential",
    training: "essential", client: "essential", incident: "essential",
    comms: "essential", docs: "essential", analytics: "essential",
  });
  const [specialUnits, setSpecialUnits] = useState<Record<string, number>>({});
  const [solutionGuards, setSolutionGuards] = useState<Record<string, number>>({});
  const [tierOverride, setTierOverride] = useState<string | null>(null); // null = auto
  const active = CYCLES.find((c) => c.id === cycle)!;
  const autoEstimate = estimateMonthly(guards);
  const estimate = tierOverride
    ? { ...autoEstimate, tier: tierOverride }
    : autoEstimate;

  const levelRate = (s: SolutionAddOn): number => {
    const lvl = solutionLevels[s.id] ?? "essential";
    return (s.levels.find((l) => l.id === lvl) ?? s.levels[0]).perGuard;
  };

  // Coverage = how many guards this solution is rolled out to. Defaults to
  // the full fleet, capped between 1 and total guards so operators can dial
  // each solution's reach independently.
  const coverageFor = (id: string): number => {
    const v = solutionGuards[id];
    if (v === undefined) return guards;
    return Math.max(1, Math.min(guards, v));
  };
  const setCoverage = (id: string, n: number) =>
    setSolutionGuards((prev) => ({ ...prev, [id]: Math.max(1, Math.min(guards, Math.round(n) || 1)) }));

  // Solutions add-on: each solution priced on its own coverage (Patrol Core free)
  const solutionsAddOn = SOLUTIONS
    .filter((s) => selectedSolutions.includes(s.id))
    .reduce((sum, s) => sum + levelRate(s) * coverageFor(s.id), 0);

  // Special Units add-on (favourable flat per active unit)
  const specialUnitsAddOn = SPECIAL_UNITS
    .reduce((sum, u) => sum + (specialUnits[u.id] || 0) * u.perUnit, 0);

  const grossMonthly = estimate.total + solutionsAddOn + specialUnitsAddOn;
  const monthlyAfterCycle = grossMonthly * (1 - active.discount);
  const billedNow =
    active.id === "annual"    ? monthlyAfterCycle * 12 :
    active.id === "quarterly" ? monthlyAfterCycle * 3  :
    monthlyAfterCycle;

  // Use TrackTik mid-band as the "industry standard" for the savings comparison.
  const benchmark = COMPETITORS[0].perGuard * guards;
  const savingsPct = benchmark > 0
    ? Math.max(0, Math.round((1 - monthlyAfterCycle / benchmark) * 100))
    : 0;

  const toggleSolution = (id: string) =>
    setSelectedSolutions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  const setLevel = (id: string, level: SolutionLevel["id"]) =>
    setSolutionLevels((prev) => ({ ...prev, [id]: level }));
  const bumpUnit = (id: string, delta: number) =>
    setSpecialUnits((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min(20, (prev[id] || 0) + delta)),
    }));



  return (
  <Section id="pricing" className="border-t border-border overflow-hidden">
    {/* ── Pricing motion layer (decorative, non-interactive) ─────────── */}
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <div className="absolute -top-32 left-1/4 h-[460px] w-[460px] rounded-full bg-sky-500/10 blur-3xl animate-bh-price-drift" />
      <div className="absolute top-1/2 -right-32 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl animate-bh-price-drift-slow" />
      <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-amber-500/10 blur-3xl animate-bh-price-drift" />
      {/* drifting grid */}
      <div
        className="absolute inset-0 opacity-[0.08] animate-bh-price-grid"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* scanning beam */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent animate-bh-price-beam" />
      <style>{`
        @keyframes bh-price-drift { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(30px,-20px,0) scale(1.08)} }
        @keyframes bh-price-drift-slow { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(-25px,30px,0) scale(1.05)} }
        @keyframes bh-price-grid { 0%{background-position:0 0} 100%{background-position:48px 48px} }
        @keyframes bh-price-beam { 0%{transform:translateY(0);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(100%);opacity:0} }
        .animate-bh-price-drift { animation: bh-price-drift 16s ease-in-out infinite; }
        .animate-bh-price-drift-slow { animation: bh-price-drift-slow 22s ease-in-out infinite; }
        .animate-bh-price-grid { animation: bh-price-grid 24s linear infinite; }
        .animate-bh-price-beam { animation: bh-price-beam 8s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-bh-price-drift, .animate-bh-price-drift-slow, .animate-bh-price-grid, .animate-bh-price-beam { animation: none; }
        }
      `}</style>
    </div>

    <div className="relative">

    <div className="max-w-3xl mb-10">
      <Eyebrow>Pricing · KES 80 / guard / month · 6 plans</Eyebrow>
      <Display className="mt-5">
        Fair, <em className="italic text-muted-foreground">per-guard</em> pricing — billed your way.
      </Display>
      <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
        Trusted by 24/7 security operations across four countries — from
        single-site command rooms to multi-country guarding groups. You only
        pay for the guards you deploy; control-room seats, evidence storage,
        offline sync, AI insights and onboarding are bundled. Multi-currency
        billing, multi-language interface, ISO 27001-aligned audit trails and
        GDPR / Kenya DPA / POPIA / NDPR data residency options on every plan.
        Choose monthly flexibility, quarterly savings, or annual for the best
        rate.
      </p>
    </div>

    {/* Billing-cycle toggle */}
    <div className="mb-10 inline-flex items-center gap-1 rounded-full border border-border bg-background p-1">
      {CYCLES.map((c) => {
        const isActive = c.id === cycle;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => setCycle(c.id)}
            className={`relative px-4 py-1.5 text-[12px] uppercase tracking-[0.18em] rounded-full transition-colors ${
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            {c.label}
            {c.discount !== 0 && (
              <span
                className={`ml-2 text-[9px] tabular-nums ${
                  isActive ? "text-background/70" : "text-primary"
                }`}
              >
                −{Math.round(c.discount * 100)}%
              </span>
            )}
          </button>
        );
      })}
    </div>


    {/* Tier grid: 5 cards on xl, 2-3 on md/lg, 1 on mobile */}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-px bg-border border border-border rounded-xl overflow-hidden">
      {TIERS.map((t) => (
        <div
          key={t.code}
          className={`p-6 lg:p-7 flex flex-col ${
            t.highlight ? "bg-foreground text-background" : "bg-background"
          }`}
        >
          {/* header */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[10px] uppercase tracking-[0.2em] tabular-nums ${
                t.highlight ? "text-background/60" : "text-muted-foreground"
              }`}
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {t.code}
            </span>
            {t.badge && (
              <span
                className={`text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                  t.highlight
                    ? "border-background/40 text-background"
                    : "border-border text-muted-foreground"
                }`}
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                {t.badge}
              </span>
            )}
          </div>

          <div
            className="mt-4 text-[26px] leading-none tracking-tight"
            style={{ fontFamily: '"Instrument Serif", serif' }}
          >
            {t.name}
          </div>
          <div
            className={`mt-1.5 text-[12px] ${
              t.highlight ? "text-background/65" : "text-muted-foreground"
            }`}
          >
            {t.target}
          </div>

          {/* price */}
          <div className="mt-6 pb-5 border-b border-dashed border-border/70">
            {t.monthly === null ? (
              <div className="flex items-baseline gap-1.5">
                <div
                  className="text-2xl tracking-tight tabular-nums"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  Custom
                </div>
                <div
                  className={`text-[11px] ${
                    t.highlight ? "text-background/60" : "text-muted-foreground"
                  }`}
                >
                  {t.unit}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <div
                    className="text-[26px] tracking-tight tabular-nums"
                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    {formatKES(t.monthly * (1 - active.discount))}
                  </div>
                  <div
                    className={`text-[11px] ${
                      t.highlight ? "text-background/60" : "text-muted-foreground"
                    }`}
                  >
                    {active.suffix}
                  </div>
                </div>
                {active.discount !== 0 && (
                  <>
                    <div
                      className={`mt-1.5 text-[11px] tabular-nums ${
                        t.highlight ? "text-background/70" : "text-foreground/80"
                      }`}
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      {formatKES(
                        t.monthly *
                          (1 - active.discount) *
                          (active.id === "annual" ? 12 : 3)
                      )}{" "}
                      <span className={t.highlight ? "text-background/55" : "text-muted-foreground"}>
                        billed {active.id === "annual" ? "annually" : "quarterly"}
                      </span>
                    </div>
                    <div
                      className={`mt-0.5 text-[11px] tabular-nums ${
                        t.highlight ? "text-background/55" : "text-muted-foreground"
                      }`}
                      style={{ fontFamily: '"JetBrains Mono", monospace' }}
                    >
                      <span className="line-through opacity-60">
                        {formatKES(t.monthly)}
                      </span>{" "}
                      · save {Math.round(active.discount * 100)}%
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* modules */}
          <div className="mt-5">
            <div
              className={`text-[10px] uppercase tracking-[0.22em] mb-3 ${
                t.highlight ? "text-background/55" : "text-muted-foreground"
              }`}
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              Modules
            </div>
            <ul className="space-y-2 text-[12.5px]">
              {t.modules.map((m) => (
                <li key={m} className="flex items-start gap-2">
                  <Check
                    className={`h-3 w-3 mt-1 shrink-0 ${
                      t.highlight ? "text-background" : "text-foreground"
                    }`}
                    strokeWidth={2.5}
                  />
                  <span
                    className={`leading-snug ${
                      t.highlight ? "text-background/90" : "text-foreground/85"
                    }`}
                  >
                    {m}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* solutions */}
          <div className="mt-5 flex-1">
            <div
              className={`text-[10px] uppercase tracking-[0.22em] mb-3 ${
                t.highlight ? "text-background/55" : "text-muted-foreground"
              }`}
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              Solutions
            </div>
            <ul className="space-y-2 text-[12.5px]">
              {t.solutions.map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-px w-2 shrink-0 ${
                      t.highlight ? "bg-background/60" : "bg-muted-foreground/60"
                    }`}
                  />
                  <span
                    className={`leading-snug ${
                      t.highlight ? "text-background/85" : "text-muted-foreground"
                    }`}
                  >
                    {s}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            asChild
            variant={t.highlight ? "secondary" : "outline"}
            className="mt-7 w-full"
          >
            <Link to="/auth">
              {t.cta} <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      ))}
    </div>

    {/* ── Interactive estimator: guards + Solutions + Special Units ──── */}
    <div className="mt-10 grid lg:grid-cols-[1.15fr_1fr] gap-px bg-border border border-border rounded-xl overflow-hidden">
      {/* Configurator panel */}
      <div className="bg-background p-6 lg:p-8 space-y-7">
        {/* Guards */}
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            Step 1 · Guards deployed
          </div>
          <div className="mt-3 flex items-end gap-4">
            <div
              className="text-5xl tabular-nums tracking-tight"
              style={{ fontFamily: '"Instrument Serif", serif' }}
            >
              {guards.toLocaleString("en-KE")}
            </div>
            <div className="text-[12px] text-muted-foreground pb-2">guards</div>
          </div>
          <input
            type="range"
            min={10}
            max={5000}
            step={10}
            value={guards}
            onChange={(e) => setGuards(parseInt(e.target.value, 10))}
            aria-label="Number of guards"
            className="mt-4 w-full accent-foreground cursor-pointer"
          />
          <div
            className="mt-2 flex justify-between text-[10px] text-muted-foreground tabular-nums"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            <span>10</span><span>500</span><span>1,500</span><span>5,000+</span>
          </div>
          <div className="mt-4">
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              Choose your plan {tierOverride === null && <span className="normal-case tracking-normal text-foreground/60">· auto: {autoEstimate.tier}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTierOverride(null)}
                className={`px-3 py-1.5 rounded-full border text-[11px] transition-colors ${
                  tierOverride === null
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                Auto
              </button>
              {TIERS.map((t) => {
                const isActive = tierOverride === t.name;
                return (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setTierOverride(t.name)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] transition-colors ${
                      isActive
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/40"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Solutions */}
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            Step 2 · Solutions (pick outcome depth)
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {SOLUTIONS.map((s) => {
              const on = selectedSolutions.includes(s.id);
              const locked = s.id === "patrol"; // always included
              const currentLevel = solutionLevels[s.id] ?? "essential";
              const rate = levelRate(s);
              const activeLevel = s.levels.find((l) => l.id === currentLevel) ?? s.levels[0];
              const coverage = coverageFor(s.id);
              const subtotal = rate * coverage;
              return (
                <div
                  key={s.id}
                  className={`text-left p-3 rounded-md border transition-colors ${
                    on
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background hover:border-foreground/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => !locked && toggleSolution(s.id)}
                    disabled={locked}
                    className={`w-full text-left ${locked ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12.5px] font-medium leading-tight">{s.label}</div>
                      <div
                        className={`text-[10px] tabular-nums ${on ? "text-background/70" : "text-muted-foreground"}`}
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        {rate === 0 ? "Included" : `+${formatKES(rate)}/guard`}
                      </div>
                    </div>
                    <div className={`mt-1 text-[10.5px] ${on ? "text-background/65" : "text-muted-foreground"}`}>
                      {s.blurb}
                    </div>
                  </button>
                  {on && s.levels.length > 1 && (
                    <div className="mt-2">
                      <div className="inline-flex w-full rounded border border-background/25 overflow-hidden">
                        {s.levels.map((l) => {
                          const sel = l.id === currentLevel;
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setLevel(s.id, l.id); }}
                              className={`flex-1 px-2 py-1 text-[10px] tabular-nums transition-colors ${
                                sel
                                  ? "bg-background text-foreground"
                                  : "text-background/70 hover:bg-background/10"
                              }`}
                              style={{ fontFamily: '"JetBrains Mono", monospace' }}
                            >
                              {l.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className={`mt-1.5 text-[10px] ${on ? "text-background/65" : "text-muted-foreground"}`}>
                        → {activeLevel.outcome}
                      </div>
                    </div>
                  )}
                  {on && !locked && rate > 0 && (
                    <div className="mt-2 pt-2 border-t border-background/20">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className="text-[10px] uppercase tracking-[0.18em] text-background/65"
                          style={{ fontFamily: '"JetBrains Mono", monospace' }}
                        >
                          Coverage
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCoverage(s.id, coverage - 10); }}
                            className="w-6 h-6 rounded border border-background/30 text-background/80 hover:bg-background/10 text-[12px] leading-none"
                            aria-label="Decrease coverage"
                          >−</button>
                          <input
                            type="number"
                            min={1}
                            max={guards}
                            value={coverage}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setCoverage(s.id, Number(e.target.value))}
                            className="w-14 h-6 rounded border border-background/30 bg-transparent text-center text-[11px] tabular-nums text-background outline-none focus:border-background/60"
                            style={{ fontFamily: '"JetBrains Mono", monospace' }}
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCoverage(s.id, coverage + 10); }}
                            className="w-6 h-6 rounded border border-background/30 text-background/80 hover:bg-background/10 text-[12px] leading-none"
                            aria-label="Increase coverage"
                          >+</button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCoverage(s.id, guards); }}
                            className="px-1.5 h-6 rounded border border-background/30 text-background/80 hover:bg-background/10 text-[9.5px] uppercase tracking-wider"
                            style={{ fontFamily: '"JetBrains Mono", monospace' }}
                          >All</button>
                        </div>
                      </div>
                      <div
                        className="mt-1 flex items-center justify-between text-[10px] tabular-nums text-background/70"
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        <span>{coverage} of {guards} guards</span>
                        <span>= {formatKES(subtotal)}/mo</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


        {/* Special Units */}
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-2"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            Step 3 · Special Units
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] text-emerald-600 dark:text-emerald-400 normal-case tracking-normal">
              Favourable flat rate
            </span>
          </div>
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {SPECIAL_UNITS.map((u) => {
              const count = specialUnits[u.id] || 0;
              return (
                <div
                  key={u.id}
                  className={`p-3 rounded-md border ${
                    count > 0 ? "border-foreground/60 bg-foreground/[0.03]" : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[12.5px] font-medium leading-tight">{u.label}</div>
                      <div className="text-[10.5px] text-muted-foreground mt-0.5">{u.blurb}</div>
                      <div
                        className="mt-1 text-[10px] text-muted-foreground tabular-nums"
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        {formatKES(u.perUnit)} / {u.unitWord} / mo
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => bumpUnit(u.id, -1)}
                        className="h-6 w-6 rounded border border-border text-[12px] leading-none hover:bg-muted disabled:opacity-30"
                        disabled={count === 0}
                        aria-label={`Remove ${u.label}`}
                      >
                        −
                      </button>
                      <div
                        className="w-7 text-center text-[13px] tabular-nums"
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        {count}
                      </div>
                      <button
                        type="button"
                        onClick={() => bumpUnit(u.id, +1)}
                        className="h-6 w-6 rounded border border-border text-[12px] leading-none hover:bg-muted"
                        aria-label={`Add ${u.label}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live price panel */}
      <div className="bg-foreground text-background p-6 lg:p-8 flex flex-col">
        <div
          className="text-[10px] uppercase tracking-[0.22em] text-background/55"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          Your monthly · {active.label.toLowerCase()} cycle
        </div>
        <div className="mt-5 flex items-baseline gap-2">
          <div
            className="text-5xl tabular-nums tracking-tight"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            {formatKES(monthlyAfterCycle)}
          </div>
          <div className="text-[12px] text-background/65">/ month</div>
        </div>
        <div
          className="mt-1.5 text-[11px] tabular-nums text-background/65"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          ≈ {formatKES(monthlyAfterCycle / Math.max(guards, 1))} per guard / month
          {active.discount > 0 && <> · save {Math.round(active.discount * 100)}% on {active.label.toLowerCase()}</>}
        </div>

        {/* Breakdown */}
        <div className="mt-5 space-y-1.5 text-[11.5px] tabular-nums"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          <div className="flex justify-between text-background/75">
            <span>Platform · {estimate.tier}</span>
            <span>{formatKES(estimate.total)}</span>
          </div>
          <div className="flex justify-between text-background/75">
            <span>Solutions add-on</span>
            <span>{formatKES(solutionsAddOn)}</span>
          </div>
          <div className="flex justify-between text-background/75">
            <span>Special Units</span>
            <span>{formatKES(specialUnitsAddOn)}</span>
          </div>
          {active.discount > 0 && (
            <div className="flex justify-between text-emerald-300">
              <span>{active.label} cycle discount</span>
              <span>−{Math.round(active.discount * 100)}%</span>
            </div>
          )}
          <div className="flex justify-between pt-1.5 mt-1.5 border-t border-background/20 font-semibold text-background">
            <span>Billed {active.id === "monthly" ? "monthly" : active.id === "quarterly" ? "this quarter" : "this year"}</span>
            <span>{formatKES(billedNow)}</span>
          </div>
        </div>

        {savingsPct > 0 && (
          <div className="mt-5 p-3 rounded-md bg-background/10 border border-background/20">
            <div className="text-[10px] uppercase tracking-[0.2em] text-background/60"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              vs TrackTik benchmark
            </div>
            <div className="mt-1.5 text-[13px]">
              You save <span className="font-medium tabular-nums">~{savingsPct}%</span>
              {" "}— roughly{" "}
              <span className="tabular-nums">{formatKES(Math.max(0, benchmark - monthlyAfterCycle))}</span> / month.
            </div>
          </div>
        )}

        <Button asChild variant="secondary" className="mt-6 w-fit">
          <Link to="/auth">
            Lock in this rate <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>

    {/* ── Competitor savings strip ─────────────────────────────────── */}
    <div className="mt-6 p-5 rounded-xl border border-border bg-background/60">
      <div className="flex items-center justify-between mb-4">
        <div
          className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          Indicative cost per guard · monthly · industry benchmark
        </div>
        <div className="text-[10px] text-muted-foreground hidden sm:block">Lower is better</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { name: "Black Hawk SOC-OS", perGuard: estimate.perGuard, region: "Africa-built", highlight: true },
          ...COMPETITORS.map((c) => ({ ...c, highlight: false })),
        ].map((c) => {
          const max = Math.max(...COMPETITORS.map((x) => x.perGuard));
          const width = Math.min(100, Math.round((c.perGuard / max) * 100));
          return (
            <div
              key={c.name}
              className={`p-3 rounded-md border ${c.highlight ? "border-foreground bg-foreground text-background" : "border-border bg-background"}`}
            >
              <div className="text-[11px] font-medium truncate">{c.name}</div>
              <div className={`text-[10px] ${c.highlight ? "text-background/60" : "text-muted-foreground"} mb-2`}>{c.region}</div>
              <div
                className={`text-[15px] tabular-nums ${c.highlight ? "" : ""}`}
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                {formatKES(c.perGuard)}
              </div>
              <div className={`mt-2 h-1 rounded-full ${c.highlight ? "bg-background/20" : "bg-border"} overflow-hidden`}>
                <div
                  className={`h-full ${c.highlight ? "bg-background" : "bg-foreground/70"}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* footnote */}
    <div
      className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
      style={{ fontFamily: '"JetBrains Mono", monospace' }}
    >
      <span>Per-guard · KES + USD · ZAR · NGN billing · {active.label.toLowerCase()} cycle</span>
      <span>From 10 guards · 14-day free trial · MSA & DPA on every plan</span>
    </div>

    </div>
  </Section>
  );
};


// ─── Case studies ───────────────────────────────────────────────────────────
const CASES = [
  {
    icon: Banknote,
    sector: "Banking & CIT",
    title: "Cash-in-Transit operations",
    scenario:
      "Multi-route CIT operations across 3 cities requiring real-time tracking, panic response and chain-of-custody.",
    modules: ["MDT-MRT", "GPS Patrol", "DOB", "Body-cam", "Strategic Advisory"],
    outcome: "Average response time cut from 9 → 4.2 minutes; zero in-transit losses across pilot quarter.",
  },
  {
    icon: Home,
    sector: "Residential estates",
    title: "Gated community coverage",
    scenario:
      "12 estates, 240 guards, weekly false-alarm volume overwhelming the control room.",
    modules: ["Alarms", "Supervision QR/RFID", "Client Portal", "DOB"],
    outcome: "False-alarm rate down 61%; client satisfaction score +38 points.",
  },
  {
    icon: Factory,
    sector: "Industrial / warehousing",
    title: "Loss control & theft prevention",
    scenario:
      "Recurring inventory shrinkage and contractor non-compliance across 4 industrial sites.",
    modules: ["Loss Control", "Investigations", "CCTV", "Access Control"],
    outcome: "Verified theft incidents reduced 47%; investigations close-rate 3.1× faster.",
  },
];

const CaseStudies = () => (
  <Section className="border-t border-border">
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
      <div>
        <Eyebrow>Field-tested</Eyebrow>
        <Display className="mt-5 max-w-2xl">
          Run by operators,<br />
          <em className="italic text-muted-foreground">in the field, today</em>.
        </Display>
      </div>
      <p className="max-w-md text-muted-foreground">
        Three deployments showing how the platform reshapes day-to-day operations
        across very different security environments.
      </p>
    </div>
    <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
      {CASES.map((c) => (
        <div key={c.title} className="bg-background p-7 flex flex-col">
          <div className="flex items-center gap-3">
            <c.icon className="h-4 w-4" strokeWidth={1.75} />
            <span
              className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {c.sector}
            </span>
          </div>
          <div className="mt-5 text-xl tracking-tight" style={{ fontFamily: '"Instrument Serif", serif' }}>
            {c.title}
          </div>
          <p className="mt-3 text-[13.5px] text-muted-foreground leading-relaxed">{c.scenario}</p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {c.modules.map((m) => (
              <span
                key={m}
                className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              >
                {m}
              </span>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-border">
            <div
              className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              Outcome
            </div>
            <div className="text-[13.5px] text-foreground leading-relaxed">{c.outcome}</div>
          </div>
        </div>
      ))}
    </div>
  </Section>
);

// ─── FAQ ────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Where is our data stored, and who owns it?",
    a: "Data is stored in encrypted, tenant-isolated databases. The client retains full ownership; Black Hawk SOC-OS acts as data processor. On-premise and hybrid deployments are available for sovereignty-sensitive clients.",
  },
  {
    q: "What happens when a field officer goes offline?",
    a: "The MDT and Field App queue all entries — DOB, patrols, SOS, evidence — in encrypted local storage and sync the moment connectivity returns. SOS is delivered via SMS fallback when data is unavailable.",
  },
  {
    q: "Which CCTV and hardware vendors are supported?",
    a: "Native integration with Dahua and Hikvision via ONVIF / RTSP, Tramigo GPS, INRICO and Motorola radios. Any ONVIF-compliant device works out of the box. Custom integrations are available on request.",
  },
  {
    q: "How long does training take?",
    a: "Control room operators reach proficiency in 2–3 days using built-in tabletop simulations. Field officers complete the MDT certification in under 90 minutes. Supervisors receive structured 1-week onboarding.",
  },
  {
    q: "Can we migrate from spreadsheets or our existing system?",
    a: "Yes. We provide a guided migration covering staff registers, client sites, patrol routes and historical incident logs. Most migrations complete within the first deployment week.",
  },
  {
    q: "What is the SLA for critical alarms and SOS events?",
    a: "Critical alarms surface in the Control Room within 2 seconds. SOS triggers a multi-channel alert — audio, push, SMS — with built-in 30-second auto-escalation if unacknowledged.",
  },
];

const Faq = () => (
  <Section id="faq" className="border-t border-border">
    <div className="grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-5">
        <Eyebrow>Frequently asked</Eyebrow>
        <Display className="mt-5">
          The questions<br />
          <em className="italic text-muted-foreground">operators ask first</em>.
        </Display>
        <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
          If yours isn't here, talk to us — every deployment starts with a real
          conversation about how your control room actually runs today.
        </p>
      </div>
      <div className="lg:col-span-7">
        <Accordion type="single" collapsible className="border-t border-border">
          {FAQ_ITEMS.map((f, i) => (
            <AccordionItem key={i} value={`f-${i}`} className="border-b border-border">
              <AccordionTrigger className="text-left text-[15px] tracking-tight hover:no-underline py-5">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[13.5px] text-muted-foreground leading-relaxed pb-5">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </Section>
);

// ─── CTA ────────────────────────────────────────────────────────────────────
const FinalCTA = ({ user }: { user: any }) => (
  <Section className="border-t border-border">
    <div className="relative rounded-2xl border border-border bg-card p-10 lg:p-16 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
      <div className="relative max-w-3xl">
        <Eyebrow>Take command</Eyebrow>
        <Display className="mt-5">
          Command every officer.<br />
          Control every site.<br />
          <em className="italic text-muted-foreground">Own every shift.</em>
        </Display>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          Bring your operation onto Black Hawk SOC-OS. We'll guide setup, migrate your sites,
          and have your control room live within weeks — not quarters.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <Button asChild size="xl">
              <Link to="/management">
                Open console <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="xl">
              <Link to="/auth">
                Request access <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          )}
          <Button asChild size="xl" variant="outline">
            <a href="#operations">See it in operation</a>
          </Button>
        </div>
      </div>
    </div>
  </Section>
);

// ─── Footer ─────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="border-t border-border px-6 lg:px-10 py-12">
    <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded bg-foreground text-background grid place-items-center">
          <Shield className="h-3.5 w-3.5" strokeWidth={2.25} />
        </div>
        <div
          className="text-[12px] text-muted-foreground"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}
        >
          Black Hawk SOC-OS · Black Hawk SOC-OS Console · Nairobi
        </div>
      </div>
      <div className="text-[12px] text-muted-foreground">
        © {new Date().getFullYear()} Black Hawk SOC-OS. All rights reserved.
      </div>
    </div>
  </footer>
);

// ─── Page ───────────────────────────────────────────────────────────────────
// ─── Why Black Hawk (differentiators) ──────────────────────────────────────
const WHY = [
  {
    icon: Shield,
    title: "Built for 24/7 command",
    body: "Designed inside a working African control room — every screen, SOP and SLA timer is shaped by operators who run live shifts, not by a marketing team.",
  },
  {
    icon: Globe2,
    title: "Africa-first, internationally ready",
    body: "Multi-currency (KES, USD, GBP, ZAR, NGN), multi-language UI, offline-capable for low-bandwidth sites, deployable on-prem or cloud across four continents.",
  },
  {
    icon: Lock,
    title: "Tamper-evident by default",
    body: "Every OB entry, patrol scan, evidence clip and dispatch action is signed, time-stamped and chained — ready for client audits, insurers and court submission.",
  },
  {
    icon: Network,
    title: "One platform, every role",
    body: "Guards, supervisors, MRT, K9, control room, HR, finance, executives and clients — each get a role-aware workspace, not a watered-down generic dashboard.",
  },
  {
    icon: Zap,
    title: "Median dispatch under 2s",
    body: "Alarm → SOP → unit assignment in a single keystroke. Auto-dispatch rules, geofence triggers and SLA escalation built in — no spreadsheets, no WhatsApp chains.",
  },
  {
    icon: BarChart3,
    title: "Decisions, not dashboards",
    body: "Loss-control intelligence, patrol compliance grading (A–F), strategic advisory feeds and executive scorecards turn raw activity into the next move.",
  },
];

const WhyBlackHawk = () => (
  <Section className="border-t border-border">
    <div className="grid lg:grid-cols-12 gap-12">
      <div className="lg:col-span-4">
        <Eyebrow>Why Black Hawk</Eyebrow>
        <Display className="mt-5">
          Six reasons operators<br />
          <em className="italic text-muted-foreground">switch</em> and stay.
        </Display>
        <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
          We are not another guard-tour app. Black Hawk SOC-OS is the operating system that
          ties your guards, vehicles, cameras, clients and finances into a single auditable
          chain — the same platform our own control room runs on every night.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Request access <ArrowRight className="h-4 w-4 ml-1.5" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#pricing">See pricing</a>
          </Button>
        </div>
      </div>
      <div className="lg:col-span-8 grid sm:grid-cols-2 gap-px bg-border border border-border rounded-xl overflow-hidden">
        {WHY.map((w) => {
          const I = w.icon;
          return (
            <div key={w.title} className="bg-background p-6 lg:p-7">
              <I className="h-5 w-5 text-primary" />
              <div className="mt-4 text-base font-medium tracking-tight">{w.title}</div>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{w.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  </Section>
);

const Landing = () => {
  const { user } = useAuth();
  useEffect(() => {
    try {
      const sessionVersion = "bh_soc_session_v2";
      if (localStorage.getItem(sessionVersion) !== "1") {
        sessionStorage.removeItem("selected_portal");
        sessionStorage.removeItem("selected_rank");
        sessionStorage.removeItem("selected_management_role");
        sessionStorage.removeItem("explicit_auth_visit");
        localStorage.setItem(sessionVersion, "1");
      }

      sessionStorage.setItem("landing_visited", "1");
    } catch {}
  }, []);
  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased overflow-y-auto">
      <LandingMotion />
      <div className="relative z-10">
        <TopBar user={user} />
        <main>
          <Hero user={user} />
          <LiveTicker />
          <TrustStrip />
          <Platform />
          <WhyBlackHawk />
          <ValueProps />
          <KineticHeadline />
          <Marquee />
          <LivePulseGlobe />
          <OrbitConstellation />
          <Modules />
          <Integrations />
          <DataStreamWall />
          <ConversionBand user={user} />
          <Operations />
          <Outcomes />
          <Comparison />
          <Security />
          <PsiraCompliance />
          <Deployments />
          <Timeline />
          <Pricing />
          <CaseStudies />
          <Deploy />
          <Faq />
          <FinalCTA user={user} />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Landing;
