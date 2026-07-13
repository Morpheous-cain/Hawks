import { useEffect, useRef } from "react";

/**
 * LandingMotion — fixed, full-page ambient motion graphics layer.
 *
 * Pure canvas + CSS. Respects prefers-reduced-motion. Sits behind content
 * (z-0, pointer-events-none) so it never blocks interaction. Composed of:
 *  - Drifting particle network (nodes + proximity links) → "operations mesh"
 *  - Slow radar sweep arc anchored top-right
 *  - Scanline gradient drifting top→bottom
 *  - Soft conic aurora orbs (CSS) for editorial color depth
 */
export const LandingMotion = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles — reduced count + throttled frame rate for touch/scroll perf
    const COUNT = Math.min(36, Math.floor((w * h) / 55000));
    const particles = Array.from({ length: COUNT }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.2 + 0.4,
    }));

    let raf = 0;
    let sweep = 0;
    let last = 0;
    const FRAME_MS = 1000 / 30; // cap at ~30fps

    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      if (ts - last < FRAME_MS) return;
      last = ts;

      ctx.clearRect(0, 0, w, h);

      // radar sweep (top-right anchor)
      const cx = w - 80;
      const cy = 120;
      const radius = Math.max(w, h) * 0.55;
      sweep += reduce ? 0 : 0.0035;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, "rgba(56, 189, 248, 0.06)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, sweep, sweep + Math.PI / 5);
      ctx.closePath();
      ctx.fill();

      // particles + links
      ctx.fillStyle = "rgba(148, 163, 184, 0.55)";
      for (const p of particles) {
        if (!reduce) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140) {
            const o = 1 - Math.sqrt(d2) / 140;
            ctx.strokeStyle = `rgba(148, 163, 184, ${o * 0.18})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
    };
    raf = requestAnimationFrame(tick);

    // Pause animation when tab is hidden
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >

      {/* Aurora orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl animate-bh-drift-slow" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-3xl animate-bh-drift" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[480px] w-[480px] rounded-full bg-amber-500/10 blur-3xl animate-bh-drift-slow" />

      {/* Scanline */}
      <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent animate-bh-scan" />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 opacity-[0.55]" />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,hsl(var(--background))_95%)]" />


      <style>{`
        @keyframes bh-drift {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(40px,-30px,0) scale(1.08); }
        }
        @keyframes bh-drift-slow {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(-30px,40px,0) scale(1.06); }
        }
        @keyframes bh-scan {
          0% { transform: translateY(-10vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        .animate-bh-drift { animation: bh-drift 18s ease-in-out infinite; }
        .animate-bh-drift-slow { animation: bh-drift-slow 26s ease-in-out infinite; }
        .animate-bh-scan { animation: bh-scan 9s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-bh-drift, .animate-bh-drift-slow, .animate-bh-scan { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default LandingMotion;
