import { useEffect, useState } from "react";
import { Activity, Radio, ShieldAlert, Zap } from "lucide-react";

/**
 * LivePulseGlobe — animated "live ops" section.
 *  - SVG world-arc with rotating dashed orbit + pulsing signal dots
 *  - Side panel of live counters that tick autonomously
 *  - Pure SVG/CSS, no external deps
 */

const SIGNALS = [
  { x: 28, y: 38, label: "Nairobi", tone: "rose" },
  { x: 62, y: 52, label: "Mombasa", tone: "amber" },
  { x: 45, y: 28, label: "Kisumu", tone: "emerald" },
  { x: 78, y: 40, label: "Mogadishu", tone: "rose" },
  { x: 18, y: 60, label: "Kampala", tone: "emerald" },
  { x: 70, y: 70, label: "Dar es Salaam", tone: "amber" },
];

const toneColor: Record<string, string> = {
  rose: "#fb7185",
  amber: "#fbbf24",
  emerald: "#34d399",
};

const useTicker = (start: number, step = 1, ms = 1800) => {
  const [v, setV] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setV((x) => x + Math.ceil(Math.random() * step)), ms);
    return () => clearInterval(id);
  }, [step, ms]);
  return v;
};

export const LivePulseGlobe = () => {
  const dispatches = useTicker(12480, 3, 1600);
  const patrols = useTicker(8240, 2, 2200);
  const alarms = useTicker(317, 1, 4200);

  return (
    <section className="relative border-t border-border px-6 lg:px-10 py-24 lg:py-32">
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-12 gap-12 items-center">
        {/* Copy + counters */}
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live operations pulse
          </div>
          <h2
            className="mt-5 text-4xl md:text-5xl lg:text-6xl leading-[1.04] tracking-[-0.015em]"
            style={{ fontFamily: '"Instrument Serif", serif' }}
          >
            Every signal. <em className="italic text-muted-foreground">In motion.</em>
          </h2>
          <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
            Across the region, Black Hawk SOC-OS routes thousands of patrol scans,
            dispatch decisions and alarm responses every hour — visible,
            timestamped, and auditable from one console.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
            {[
              { icon: Radio, label: "Dispatches / 24h", value: dispatches },
              { icon: Activity, label: "Patrol scans", value: patrols },
              { icon: ShieldAlert, label: "Alarms handled", value: alarms },
            ].map((t) => {
              const I = t.icon;
              return (
                <div key={t.label} className="bg-background p-5">
                  <I className="h-3.5 w-3.5 text-muted-foreground" />
                  <div
                    className="mt-3 text-2xl tabular-nums"
                    style={{ fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    {t.value.toLocaleString()}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {t.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Animated globe / radar */}
        <div className="lg:col-span-7">
          <div className="relative aspect-[4/3] rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
            {/* grid */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <svg viewBox="0 0 100 75" className="absolute inset-0 w-full h-full">
              <defs>
                <radialGradient id="bh-globe" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(56,189,248,0.15)" />
                  <stop offset="100%" stopColor="rgba(56,189,248,0)" />
                </radialGradient>
              </defs>

              {/* Concentric rings */}
              <circle cx="50" cy="38" r="30" fill="url(#bh-globe)" />
              {[10, 18, 26, 32].map((r) => (
                <circle
                  key={r}
                  cx="50"
                  cy="38"
                  r={r}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="0.2"
                />
              ))}

              {/* Rotating orbit */}
              <g style={{ transformOrigin: "50px 38px" }} className="bh-orbit">
                <ellipse
                  cx="50"
                  cy="38"
                  rx="34"
                  ry="12"
                  fill="none"
                  stroke="rgba(56,189,248,0.45)"
                  strokeWidth="0.3"
                  strokeDasharray="1.2 1.2"
                />
              </g>
              <g
                style={{ transformOrigin: "50px 38px", animationDelay: "-6s" }}
                className="bh-orbit-rev"
              >
                <ellipse
                  cx="50"
                  cy="38"
                  rx="28"
                  ry="9"
                  fill="none"
                  stroke="rgba(52,211,153,0.4)"
                  strokeWidth="0.25"
                  strokeDasharray="0.8 1.4"
                />
              </g>

              {/* Signal nodes */}
              {SIGNALS.map((s, i) => (
                <g key={s.label}>
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r="0.9"
                    fill={toneColor[s.tone]}
                  />
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r="0.9"
                    fill="none"
                    stroke={toneColor[s.tone]}
                    strokeWidth="0.3"
                    style={{ animationDelay: `${i * 0.4}s` }}
                    className="bh-ping"
                  />
                  <text
                    x={s.x + 2}
                    y={s.y + 0.6}
                    fontSize="2"
                    fill="hsl(var(--muted-foreground))"
                    style={{ fontFamily: "JetBrains Mono, monospace" }}
                  >
                    {s.label}
                  </text>
                </g>
              ))}

              {/* Connection beam */}
              <line
                x1="28"
                y1="38"
                x2="78"
                y2="40"
                stroke="rgba(56,189,248,0.5)"
                strokeWidth="0.25"
                strokeDasharray="2 2"
                className="bh-beam"
              />
            </svg>

            {/* HUD strip */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              <span className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-emerald-400" /> OP-NORM
              </span>
              <span>NBO · UTC+03</span>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              <span>LATENCY 142 ms</span>
              <span>NODES 247 / 247</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bh-orbit-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes bh-orbit-spin-rev { from { transform: rotate(0); } to { transform: rotate(-360deg); } }
        .bh-orbit { animation: bh-orbit-spin 28s linear infinite; }
        .bh-orbit-rev { animation: bh-orbit-spin-rev 38s linear infinite; }
        @keyframes bh-ping-key {
          0% { r: 0.9; opacity: 0.8; }
          100% { r: 5; opacity: 0; }
        }
        .bh-ping { animation: bh-ping-key 2.4s ease-out infinite; transform-origin: center; }
        @keyframes bh-beam-key {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.9; }
        }
        .bh-beam { animation: bh-beam-key 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .bh-orbit, .bh-orbit-rev, .bh-ping, .bh-beam { animation: none; }
        }
      `}</style>
    </section>
  );
};

export default LivePulseGlobe;
