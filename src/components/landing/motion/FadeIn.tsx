import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { MOTION_EASE, MOTION_DURATION } from "./tokens";

type Direction = "up" | "down" | "left" | "right" | "none";

interface FadeInProps {
  children: ReactNode;
  /** Animation direction. Default "up". */
  direction?: Direction;
  /** Delay in seconds. Default 0. */
  delay?: number;
  /** Duration in seconds. Default 0.6. */
  duration?: number;
  /** Travel distance in px. Default 24. */
  distance?: number;
  className?: string;
}

const offset = (d: Direction, dist: number) => {
  switch (d) {
    case "up": return { y: dist };
    case "down": return { y: -dist };
    case "left": return { x: dist };
    case "right": return { x: -dist };
    default: return {};
  }
};

/**
 * FadeIn — entrance animation that runs once on mount.
 * Use for hero copy and above-the-fold elements that should
 * animate immediately on page load.
 */
export const FadeIn = ({
  children,
  direction = "up",
  delay = 0,
  duration = MOTION_DURATION.base,
  distance = 24,
  className,
}: FadeInProps) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset(direction, distance) }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: MOTION_EASE }}
    >
      {children}
    </motion.div>
  );
};
