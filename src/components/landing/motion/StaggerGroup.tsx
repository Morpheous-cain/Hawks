import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { MOTION_EASE, MOTION_DURATION } from "./tokens";

interface StaggerGroupProps {
  children: ReactNode;
  /** Delay between each child, seconds. Default 0.08. */
  stagger?: number;
  /** Delay before the first child, seconds. Default 0. */
  delay?: number;
  /** Trigger on viewport entry instead of mount. Default true. */
  whileInView?: boolean;
  className?: string;
}

/**
 * StaggerGroup — wraps a list of <StaggerItem> children and
 * cascades their entrance in order. Pair with hero lists,
 * feature grids, or any sequence that benefits from rhythm.
 */
export const StaggerGroup = ({
  children,
  stagger = 0.08,
  delay = 0,
  whileInView = true,
  className,
}: StaggerGroupProps) => {
  const reduce = useReducedMotion();
  const variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : stagger,
        delayChildren: delay,
      },
    },
  };
  const viewportProps = whileInView
    ? { whileInView: "show" as const, viewport: { once: true, margin: "-80px" } }
    : { animate: "show" as const };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      {...viewportProps}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps {
  children: ReactNode;
  distance?: number;
  className?: string;
}

export const StaggerItem = ({ children, distance = 16, className }: StaggerItemProps) => {
  const reduce = useReducedMotion();
  const variants = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: distance },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE },
        },
      };
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
};
