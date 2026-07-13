// Simple monochrome "trusted by / integrates with" strip.
const LOGOS = ["Dahua", "Hikvision", "Tramigo", "INRICO", "Motorola", "Hytera", "Ajax", "Paxton"];

export const LogoWall = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
    {LOGOS.map(l => (
      <div
        key={l}
        className="h-14 rounded-md border border-border/50 bg-card/40 flex items-center justify-center text-foreground/40 hover:text-foreground/80 transition-colors text-sm font-mono uppercase tracking-widest"
      >
        {l}
      </div>
    ))}
  </div>
);

export default LogoWall;
