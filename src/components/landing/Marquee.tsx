/**
 * Marquee — infinite horizontal scroller used as a visual rhythm break
 * between sections. Pure CSS, GPU-friendly, respects reduced motion.
 */
const ITEMS = [
  "24/7 CONTROL ROOM",
  "FIELD-GRADE OFFLINE",
  "TAMPER-EVIDENT AUDIT",
  "RBAC + RLS",
  "MULTI-TENANT",
  "REAL-TIME DISPATCH",
  "BODY-CAM EVIDENCE",
  "K9 OPERATIONS",
  "CASH-IN-TRANSIT",
  "AI THREAT FORECAST",
  "STRATEGIC ADVISORY",
  "GEOFENCED PATROLS",
];

export const Marquee = () => (
  <div className="relative border-y border-border bg-background/40 overflow-hidden">
    <div className="flex gap-12 py-4 whitespace-nowrap bh-marquee">
      {[...ITEMS, ...ITEMS].map((t, i) => (
        <span
          key={i}
          className="text-[11px] font-mono uppercase tracking-[0.28em] text-muted-foreground flex items-center gap-12"
        >
          {t}
          <span className="h-1 w-1 rounded-full bg-foreground/30" />
        </span>
      ))}
    </div>
    <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
    <style>{`
      @keyframes bh-marquee-key { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      .bh-marquee { animation: bh-marquee-key 40s linear infinite; width: max-content; }
      @media (prefers-reduced-motion: reduce) { .bh-marquee { animation: none; } }
    `}</style>
  </div>
);

export default Marquee;
