/**
 * Black Hawk SOC-OS · Landing motion primitives
 * ------------------------------------------------------------
 * Tiny, branded animation building blocks for the landing page.
 * Built on framer-motion (already in the bundle) with sensible
 * defaults that match the editorial premium aesthetic:
 *   - Easing:    [0.22, 1, 0.36, 1]  (soft "expo" out)
 *   - Duration:  0.6s  default
 *   - Stagger:   0.08s default
 *
 * All components:
 *   • respect prefers-reduced-motion
 *   • avoid layout shift (transform/opacity only)
 *   • are SSR-safe and tree-shakable
 *
 * See ./README.md for the full implementation guide.
 */
export { FadeIn } from "./FadeIn";
export { StaggerGroup, StaggerItem } from "./StaggerGroup";
export { ScrollReveal } from "./ScrollReveal";
export { HoverLift } from "./HoverLift";
export { Parallax } from "./Parallax";
export { GradientShift } from "./GradientShift";
export { MOTION_EASE, MOTION_DURATION } from "./tokens";
