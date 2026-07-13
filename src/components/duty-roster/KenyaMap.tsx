import { useState } from "react";

// Stylized Kenya silhouette + positioned pins for major operational regions.
// Coordinates are normalized to the viewBox (0..400 x 0..360).
export interface KenyaPin {
  id: string;
  name: string;
  x: number;
  y: number;
  units?: number;
  level?: "low" | "medium" | "high" | "critical";
}

const KENYA_PATH =
  "M68,42 L120,30 L168,28 L210,36 L254,30 L300,40 L334,68 L344,108 L356,142 L348,176 L334,206 L312,228 L296,254 L280,278 L254,300 L222,320 L182,328 L142,326 L108,310 L84,282 L66,248 L54,210 L48,170 L52,128 L58,88 Z";

const LEVEL_COLOR: Record<NonNullable<KenyaPin["level"]>, string> = {
  low: "#34d399",
  medium: "#fbbf24",
  high: "#fb923c",
  critical: "#f43f5e",
};

interface Props {
  mode?: "deployment" | "threat";
  pins: KenyaPin[];
  onPinClick?: (pin: KenyaPin) => void;
  height?: number;
}

export default function KenyaMap({ mode = "deployment", pins, onPinClick, height = 240 }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const accent = mode === "threat" ? "#f43f5e" : "#22d3ee";

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox="0 0 400 360" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`kenya-fill-${mode}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.12" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.03" />
          </linearGradient>
          <radialGradient id={`kenya-glow-${mode}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <pattern id={`grid-${mode}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width="400" height="360" fill={`url(#grid-${mode})`} />
        <ellipse cx="200" cy="180" rx="180" ry="160" fill={`url(#kenya-glow-${mode})`} />

        {/* Country outline */}
        <path
          d={KENYA_PATH}
          fill={`url(#kenya-fill-${mode})`}
          stroke={accent}
          strokeWidth="1.2"
          strokeOpacity="0.55"
        />

        {/* Region pins */}
        {pins.map((p) => {
          const color = mode === "threat" && p.level ? LEVEL_COLOR[p.level] : accent;
          const r = 6 + Math.min(8, (p.units ?? 0) / 6);
          const isHover = hover === p.id;
          return (
            <g
              key={p.id}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onPinClick?.(p)}
              className="cursor-pointer"
            >
              {/* Pulse */}
              <circle cx={p.x} cy={p.y} r={r + 6} fill={color} opacity="0.15">
                <animate attributeName="r" values={`${r + 4};${r + 12};${r + 4}`} dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.25;0;0.25" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle cx={p.x} cy={p.y} r={r} fill={color} fillOpacity="0.85" stroke="#0B1220" strokeWidth="1.5" />
              <text
                x={p.x}
                y={p.y - r - 6}
                textAnchor="middle"
                className="pointer-events-none select-none"
                fontSize="10"
                fontWeight="600"
                fill={isHover ? "#fff" : "#e2e8f0"}
              >
                {p.name}
              </text>
              {(p.units !== undefined || p.level) && (
                <text
                  x={p.x}
                  y={p.y + r + 12}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  fontSize="9"
                  fill={color}
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                  fontWeight="700"
                >
                  {mode === "threat" ? (p.level ?? "").toUpperCase() : `${p.units} units`}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-1 right-2 flex items-center gap-2 rounded border border-white/5 bg-black/40 px-2 py-1 text-[9px] uppercase tracking-wider text-slate-400 backdrop-blur">
        {mode === "threat" ? (
          <>
            {(["low", "medium", "high", "critical"] as const).map((l) => (
              <span key={l} className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: LEVEL_COLOR[l] }} /> {l}
              </span>
            ))}
          </>
        ) : (
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} /> Active deployment
          </span>
        )}
      </div>
    </div>
  );
}
