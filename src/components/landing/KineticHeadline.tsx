import { useEffect, useRef } from "react";

/**
 * KineticHeadline — massive 3D-perspective marquee strip.
 * Two contra-rotating rows of editorial type with parallax depth,
 * a sweeping spotlight, and cursor-reactive tilt. Pure CSS + a tiny
 * pointer listener. GPU-only (transforms + opacity).
 */
const WORDS_TOP = [
  "DETECT", "DISPATCH", "DEFEND", "DOCUMENT", "DETER", "DECIDE",
];
const WORDS_BOT = [
  "PATROL", "RESPOND", "ESCALATE", "AUDIT", "PROTECT", "COMMAND",
];

export const KineticHeadline = () => {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    let tx = 0, ty = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tx = x * 14;
      ty = y * 10;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--bh-tx", `${tx}deg`);
        el.style.setProperty("--bh-ty", `${-ty}deg`);
      });
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
    };
  }, []);

  const Row = ({ words, dir, delay }: { words: string[]; dir: 1 | -1; delay: number }) => (
    <div className="relative overflow-hidden py-2">
      <div
        className="flex gap-12 whitespace-nowrap will-change-transform"
        style={{
          animation: `bh-kinetic-${dir === 1 ? "l" : "r"} 38s linear infinite`,
          animationDelay: `${delay}s`,
        }}
      >
        {[...words, ...words, ...words].map((w, i) => (
          <span
            key={i}
            className="text-[14vw] md:text-[10vw] leading-[0.9] tracking-[-0.03em] text-transparent"
            style={{
              fontFamily: '"Instrument Serif", serif',
              WebkitTextStroke: "1px hsl(var(--foreground) / 0.55)",
            }}
          >
            {w}
            <em
              className="not-italic mx-6 text-foreground/90"
              style={{ WebkitTextStroke: "0" }}
            >
              ✦
            </em>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <section className="relative border-t border-border overflow-hidden">
      {/* Spotlight sweep */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bh-kinetic-spot" />
      <div
        ref={wrapRef}
        className="relative py-20 md:py-28"
        style={{
          perspective: "1400px",
          transformStyle: "preserve-3d",
        } as React.CSSProperties}
      >
        <div
          className="will-change-transform"
          style={{
            transform:
              "rotateX(var(--bh-ty,0deg)) rotateY(var(--bh-tx,0deg))",
            transition: "transform 320ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          <Row words={WORDS_TOP} dir={1} delay={0} />
          <Row words={WORDS_BOT} dir={-1} delay={-12} />
        </div>
      </div>

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />

      <style>{`
        @keyframes bh-kinetic-l {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(-33.333%,0,0); }
        }
        @keyframes bh-kinetic-r {
          from { transform: translate3d(-33.333%,0,0); }
          to   { transform: translate3d(0,0,0); }
        }
        .bh-kinetic-spot {
          background: radial-gradient(600px 240px at var(--x,50%) 50%, hsl(var(--primary) / 0.18), transparent 65%);
          animation: bh-kinetic-sweep 11s ease-in-out infinite;
        }
        @keyframes bh-kinetic-sweep {
          0%,100% { --x: 10%; opacity: .65; }
          50%     { --x: 90%; opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bh-kinetic-spot { animation: none; }
        }
      `}</style>
    </section>
  );
};

export default KineticHeadline;
