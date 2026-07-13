import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

export interface KpiDrillDownConfig {
  key: string;
  label: string;
  value: number | string;
  tone: string;
  to: string;
  description: string;
  trend?: { value: string; direction: "up" | "down" };
  breakdown: { label: string; value: number | string; tone?: string }[];
  recentItems?: { id: string; title: string; meta?: string; tone?: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  config: KpiDrillDownConfig | null;
}

export default function KpiDrillDownDrawer({ open, onOpenChange, config }: Props) {
  if (!config) return null;
  const Trend = config.trend?.direction === "up" ? TrendingUp : TrendingDown;
  const trendTone = config.trend?.direction === "up" ? "text-rose-300" : "text-emerald-300";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md border-l border-white/10 bg-[#0B1220] p-0 text-slate-200">
        <SheetHeader className="border-b border-white/5 px-5 py-4">
          <SheetTitle className="flex items-center justify-between text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
            {config.label} · Drill-down
            <Badge className={`border border-${config.tone}-500/30 bg-${config.tone}-500/10 text-${config.tone}-300`}>
              Live
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-72px)] px-5 py-4">
          <div className="space-y-4">
            {/* Hero metric */}
            <div className="rounded-lg border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Current Value</div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className={`font-mono text-4xl font-bold text-${config.tone}-300`}>{config.value}</span>
                {config.trend && (
                  <span className={`flex items-center gap-1 text-xs font-semibold ${trendTone}`}>
                    <Trend className="h-3 w-3" /> {config.trend.value}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-400">{config.description}</p>
            </div>

            {/* Breakdown */}
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Breakdown</div>
              <div className="grid grid-cols-2 gap-2">
                {config.breakdown.map((b) => (
                  <div key={b.label} className="rounded border border-white/5 bg-black/30 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">{b.label}</div>
                    <div className={`mt-0.5 font-mono text-lg font-bold text-${b.tone ?? "slate"}-300`}>{b.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent items */}
            {config.recentItems && config.recentItems.length > 0 && (
              <>
                <Separator className="bg-white/5" />
                <div>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Latest Records</div>
                  <div className="space-y-1.5">
                    {config.recentItems.map((it) => (
                      <div
                        key={it.id}
                        className={`rounded border-l-2 border-${it.tone ?? "cyan"}-500 bg-white/[0.02] px-3 py-2`}
                      >
                        <div className="font-mono text-[11px] font-semibold text-slate-100">{it.id}</div>
                        <div className="text-[11px] text-slate-300">{it.title}</div>
                        {it.meta && <div className="text-[10px] text-slate-500">{it.meta}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator className="bg-white/5" />
            <Button asChild className="w-full bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25">
              <Link to={config.to}>
                Open full {config.label} module <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
