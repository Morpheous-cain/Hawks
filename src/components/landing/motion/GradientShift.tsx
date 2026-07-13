/**
 * GradientShift — pure-CSS animated gradient background.
 * Used as an ambient backdrop behind CTAs and hero strips.
 * No JS, no layout impact, GPU-only.
 */
import type { ReactNode } from "react";

interface GradientShiftProps {
  children?: ReactNode;
  className?: string;
  /** Cycle duration in seconds. Default 18. */
  duration?: number;
}

export const GradientShift = ({
  children,
  className = "",
  duration = 18,
}: GradientShiftProps) => (
  <div className={`relative overflow-hidden ${className}`}>
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bh-gradient-shift opacity-60"
      style={{ animationDuration: `${duration}s` }}
    />
    <div className="relative">{children}</div>
    <style>{`
      @keyframes bh-gradient-shift-key {
        0%, 100% { background-position: 0% 50%; }
        50%      { background-position: 100% 50%; }
      }
      .bh-gradient-shift {
        background: linear-gradient(
          120deg,
          hsl(190 70% 18% / 0.35) 0%,
          hsl(212 80% 18% / 0.25) 30%,
          hsl(152 50% 18% / 0.25) 60%,
          hsl(38 80% 22% / 0.30) 100%
        );
        background-size: 240% 240%;
        animation: bh-gradient-shift-key linear infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .bh-gradient-shift { animation: none; }
      }
    `}</style>
  </div>
);
