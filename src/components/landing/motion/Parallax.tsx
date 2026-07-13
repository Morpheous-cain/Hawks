import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

interface ParallaxProps {
  children: ReactNode;
  /** Pixels of vertical drift over the element's scroll range. Default 60. */
  offset?: number;
  className?: string;
}

/**
 * Parallax — subtle vertical drift relative to scroll progress.
 * Use for hero art, ambient layers, decorative orbs. Skip for
 * anything containing text the user must read.
 */
export const Parallax = ({ children, offset = 60, className }: ParallaxProps) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);
  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};
