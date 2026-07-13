import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface HoverLiftProps {
  children: ReactNode;
  /** Translate-Y on hover, px. Default -4. */
  lift?: number;
  /** Scale on hover. Default 1.015. */
  scale?: number;
  /** Tap scale (for tactile feedback). Default 0.985. */
  tap?: number;
  className?: string;
}

/**
 * HoverLift — drop-in interactive container for CTAs, cards
 * and links. Uses transform only (no box-shadow animation)
 * so it stays GPU-cheap on lower-end devices.
 */
export const HoverLift = ({
  children,
  lift = -4,
  scale = 1.015,
  tap = 0.985,
  className,
}: HoverLiftProps) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      whileHover={{ y: lift, scale }}
      whileTap={{ scale: tap }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      {children}
    </motion.div>
  );
};
