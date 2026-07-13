import { useEffect, useRef } from "react";

/**
 * DataStreamWall — cinematic falling-glyph wall reminiscent of a SOC feed.
 * Custom characters (hex IDs, callsigns, status codes) drift downward in
 * staggered columns. Pure canvas. Capped at ~30fps, pauses on tab hide.
 */
const GLYPHS = "0123456789ABCDEF·BH-INC·PATROL·QRF·OK·SLA·OPS·UNIT".split("·").join("");

export const DataStreamWall = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, cols = 0;
    let drops: number[] = [];
    const FONT = 14;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(w / FONT);
      drops = Array.from({ length: cols }, () => Math.random() * h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    ctx.font = `${FONT}px "JetBrains Mono", monospace`;

    let raf = 0;
    let last = 0;
    const FRAME_MS = 1000 / 28;

    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      if (ts - last < FRAME_MS) return;
      last = ts;

      ctx.fillStyle = "hsla(220, 30%, 6%, 0.18)";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < cols; i++) {
        const ch = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
        const x = i * FONT;
        const y = drops[i];
        // bright leading glyph
        ctx.fillStyle = "hsla(190, 95%, 70%, 0.95)";
        ctx.fillText(ch, x, y);
        // trailing
        ctx.fillStyle = "hsla(190, 85%, 55%, 0.32)";
        ctx.fillText(ch, x, y - FONT);

        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += reduce ? 0 : FONT * 0.7;
      }
    };
    raf = requestAnimationFrame(tick);
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <section className="relative border-t border-border overflow-hidden">
      <div className="relative h-[420px] md:h-[520px]">
        <canvas ref={ref} className="absolute inset-0 h-full w-full" />
        {/* gradient masks for editorial framing */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_85%)]" />

        <div className="relative z-10 h-full flex items-center justify-center px-6">
          <div className="text-center max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live signal stream · uplinked
            </div>
            <h2
              className="mt-5 text-4xl md:text-6xl leading-[1.05] tracking-[-0.015em]"
              style={{ fontFamily: '"Instrument Serif", serif' }}
            >
              The feed never <em className="italic text-muted-foreground">sleeps</em>.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Patrol scans, GPS waypoints, alarm events and dispatch tokens
              flow continuously through the Black Hawk core — every glyph
              is a real operational signal.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataStreamWall;
