import { Shield, Radio, Camera, Truck, Crown, Dog, Cpu, Eye, Activity, MapPin } from "lucide-react";

/**
 * OrbitConstellation — animated solar-system of SOC-OS modules
 * orbiting the Black Hawk core. Pure SVG + CSS keyframes.
 * Three concentric counter-rotating rings, glowing core, signal pings.
 */

type Node = { icon: any; label: string };

const RING_1: Node[] = [
  { icon: Radio,   label: "Dispatch" },
  { icon: Shield,  label: "Patrol" },
  { icon: Camera,  label: "CCTV" },
  { icon: MapPin,  label: "Geofence" },
];
const RING_2: Node[] = [
  { icon: Truck,   label: "Courier" },
  { icon: Dog,     label: "K9" },
  { icon: Crown,   label: "Executive" },
  { icon: Eye,     label: "Body-Cam" },
  { icon: Activity,label: "Comms" },
];
const RING_3: Node[] = [
  { icon: Cpu,     label: "AI Engine" },
  { icon: Shield,  label: "Compliance" },
  { icon: Radio,   label: "MDT" },
  { icon: Eye,     label: "Intelligence" },
  { icon: MapPin,  label: "GPS Track" },
  { icon: Activity,label: "SLA" },
];

const Ring = ({
  nodes, radius, duration, reverse = false,
}: { nodes: Node[]; radius: number; duration: number; reverse?: boolean }) => (
  <div
    className="absolute inset-0 flex items-center justify-center"
    style={{
      animation: `bh-orbit-${reverse ? "rev" : "fwd"} ${duration}s linear infinite`,
    }}
  >
    <div className="relative" style={{ width: 0, height: 0 }}>
      {nodes.map((n, i) => {
        const a = (i / nodes.length) * Math.PI * 2;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        const I = n.icon;
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: x, top: y,
              animation: `bh-orbit-${reverse ? "fwd" : "rev"} ${duration}s linear infinite`,
            }}
          >
            <div className="group flex flex-col items-center gap-1.5">
              <div className="relative h-11 w-11 rounded-full border border-border bg-background/80 backdrop-blur flex items-center justify-center shadow-[0_0_30px_-10px_hsl(var(--primary)/.6)] transition hover:scale-110 hover:border-primary">
                <I className="h-4 w-4 text-foreground/85 group-hover:text-primary transition" />
                <span className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
                {n.label}
              </span>
            </div>
          </div>
        );
      })}
      {/* ring path */}
      <svg
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: 0, top: 0, width: radius * 2, height: radius * 2, marginLeft: -radius, marginTop: -radius }}
        viewBox={`-${radius} -${radius} ${radius * 2} ${radius * 2}`}
      >
        <circle
          cx="0" cy="0" r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="0.6"
          strokeDasharray="2 6"
        />
      </svg>
    </div>
  </div>
);

export const OrbitConstellation = () => (
  <section className="relative border-t border-border px-6 lg:px-10 py-24 lg:py-32 overflow-hidden">
    <div className="max-w-[1280px] mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          One core. Every module. One signal.
        </div>
        <h2
          className="mt-5 text-4xl md:text-5xl lg:text-6xl leading-[1.04] tracking-[-0.015em]"
          style={{ fontFamily: '"Instrument Serif", serif' }}
        >
          The operating system that <em className="italic text-muted-foreground">orbits</em> your operation.
        </h2>
        <p className="mt-5 text-muted-foreground leading-relaxed">
          Every Black Hawk module reports to a single command core — sharing
          identity, location, evidence and audit trail in real time.
        </p>
      </div>

      <div className="relative mx-auto mt-14 h-[560px] md:h-[640px] w-full max-w-[640px]">
        {/* Glow backdrop */}
        <div aria-hidden className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.18),transparent_60%)] blur-2xl animate-bh-pulse-slow" />

        {/* Rings */}
        <Ring nodes={RING_3} radius={270} duration={70} />
        <Ring nodes={RING_2} radius={190} duration={48} reverse />
        <Ring nodes={RING_1} radius={120} duration={32} />

        {/* Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-bh-core-pulse" />
            <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full border border-primary/60 bg-background flex items-center justify-center shadow-[0_0_80px_-10px_hsl(var(--primary)/.7)]">
              <Shield className="h-9 w-9 text-primary" />
              <div className="absolute inset-0 rounded-full border border-primary/40 animate-bh-ring-ping" />
              <div className="absolute inset-0 rounded-full border border-primary/30 animate-bh-ring-ping" style={{ animationDelay: "1.2s" }} />
            </div>
            <div className="mt-3 text-center text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              SOC-OS · Core
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>{`
      @keyframes bh-orbit-fwd { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
      @keyframes bh-orbit-rev { from { transform: rotate(0deg);} to { transform: rotate(-360deg);} }
      @keyframes bh-core-pulse {
        0%,100% { transform: scale(1); opacity: .85; }
        50%     { transform: scale(1.15); opacity: 1; }
      }
      .animate-bh-core-pulse { animation: bh-core-pulse 3.4s ease-in-out infinite; }
      @keyframes bh-ring-ping {
        0%   { transform: scale(1); opacity: .8; }
        100% { transform: scale(2.2); opacity: 0; }
      }
      .animate-bh-ring-ping { animation: bh-ring-ping 2.6s ease-out infinite; }
      @keyframes bh-pulse-slow {
        0%,100% { opacity: .6; transform: scale(1); }
        50%     { opacity: 1;  transform: scale(1.08); }
      }
      .animate-bh-pulse-slow { animation: bh-pulse-slow 6s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .animate-bh-core-pulse, .animate-bh-ring-ping, .animate-bh-pulse-slow { animation: none; }
      }
    `}</style>
  </section>
);

export default OrbitConstellation;
