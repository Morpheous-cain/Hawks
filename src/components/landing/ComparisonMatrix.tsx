import { Check, Minus, X } from "lucide-react";
import { Card } from "@/components/ui/card";

type Cell = "yes" | "partial" | "no";

const COLS = ["Black Hawk SOC-OS", "Spreadsheets", "Generic Guard App", "Foreign SaaS"] as const;

const ROWS: { cap: string; cells: Cell[] }[] = [
  { cap: "Audit-grade Digital Occurrence Book", cells: ["yes", "no", "partial", "yes"] },
  { cap: "Offline-capable MDT for field officers", cells: ["yes", "no", "partial", "no"] },
  { cap: "Native Dahua / Hikvision integration", cells: ["yes", "no", "no", "partial"] },
  { cap: "Tramigo GPS & INRICO radio bridge", cells: ["yes", "no", "no", "no"] },
  { cap: "K9, Escort, Courier specialised modules", cells: ["yes", "no", "no", "partial"] },
  { cap: "Strategic Advisory + AI threat analysis", cells: ["yes", "no", "no", "partial"] },
  { cap: "Real-time SOS & geofence enforcement", cells: ["yes", "no", "partial", "yes"] },
  { cap: "Body-cam streaming + evidence vault", cells: ["yes", "no", "no", "partial"] },
  { cap: "Loss Control intelligence engine", cells: ["yes", "no", "no", "no"] },
  { cap: "Kenya Data Protection Act aligned", cells: ["yes", "no", "no", "partial"] },
  { cap: "Multi-tenant client portals", cells: ["yes", "no", "no", "yes"] },
  { cap: "Local support · Africa/Nairobi timezone", cells: ["yes", "yes", "partial", "no"] },
];

const Mark = ({ v }: { v: Cell }) => {
  if (v === "yes")
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 border border-primary/40 text-primary">
        <Check className="h-4 w-4" />
      </span>
    );
  if (v === "partial")
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--alert-caution))]/15 border border-[hsl(var(--alert-caution))]/40 text-[hsl(var(--alert-caution))]">
        <Minus className="h-4 w-4" />
      </span>
    );
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 border border-destructive/30 text-destructive/80">
      <X className="h-4 w-4" />
    </span>
  );
};

export const ComparisonMatrix = () => (
  <Card className="overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/60">
            <th className="text-left px-5 py-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Capability
            </th>
            {COLS.map((c, i) => (
              <th
                key={c}
                className={`px-4 py-4 text-center text-xs font-semibold ${
                  i === 0 ? "text-primary" : "text-foreground/70"
                }`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r, ri) => (
            <tr
              key={r.cap}
              className={`border-b border-border/40 hover:bg-primary/5 transition-colors ${
                ri % 2 ? "bg-background/30" : ""
              }`}
            >
              <td className="px-5 py-3.5 text-foreground/80">{r.cap}</td>
              {r.cells.map((c, i) => (
                <td key={i} className={`px-4 py-3.5 text-center ${i === 0 ? "bg-primary/5" : ""}`}>
                  <Mark v={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="flex flex-wrap items-center gap-4 px-5 py-4 border-t border-border/60 bg-background/40 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      <span className="flex items-center gap-2"><Mark v="yes" />Full</span>
      <span className="flex items-center gap-2"><Mark v="partial" />Partial</span>
      <span className="flex items-center gap-2"><Mark v="no" />Not supported</span>
    </div>
  </Card>
);
