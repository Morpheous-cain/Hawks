import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { MOTION_EASE, MOTION_DURATION } from "./tokens";

interface ScrollRevealProps {
  children: ReactNode;
  /** Viewport offset (CSS margin) before triggering. Default "-80px". */
  rootMargin?: string;
  /** Initial vertical offset in px. Default 32. */
  distance?: number;
  /** Duration in seconds. Default 0.7. */
  duration?: number;
  /** Animate every time it scrolls in. Default false (once). */
  repeat?: boolean;
  delay?: number;
  className?: string;
}

/**
 * ScrollReveal — fires when the element enters the viewport.
 * Uses framer-motion's built-in IntersectionObserver. Only
 * transform/opacity properties are animated to avoid jank.
 */
export const ScrollReveal = ({
  children,
  rootMargin = "-80px",
  distance = 32,
  duration = 0.7,
  repeat = false,
  delay = 0,
  className,
}: ScrollRevealProps) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !repeat, margin: rootMargin }}
      transition={{ duration, delay, ease: MOTION_EASE }}
    >
      {children}
    </motion.div>
  );
};
