import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Sun, Moon, BellRing, ClipboardCheck, Megaphone, ChevronDown, ChevronUp } from "lucide-react";
import type { RosterRow } from "./FullRosterDialog";
import { formatCountdown, type ShiftInfo } from "./shiftClock";

interface Props {
  shift: ShiftInfo;
  roster: RosterRow[];
  onStartHandover?: () => void;
  onBroadcastShift?: () => void;
  onForceRotate?: () => void;
}

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(-2).join("").toUpperCase();

export default function ShiftRotationPanel({ shift, roster, onStartHandover, onBroadcastShift, onForceRotate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isDay = shift.current === "DAY";
  const CurrentIcon = isDay ? Sun : Moon;
  const NextIcon = shift.nextShift === "DAY" ? Sun : Moon;

  const oncoming = useMemo(() => {
    const nextWin = shift.nextWindow.replace(/\s/g, "");
    return roster.filter((r) => (r.shift || "").replace(/\s/g, "").includes(nextWin));
  }, [roster, shift.nextWindow]);

  const accentBorder = isDay ? "border-amber-400/20" : "border-indigo-400/20";
  const accentText = isDay ? "text-amber-300" : "text-indigo-300";
  const accentBg = isDay ? "bg-amber-500/5" : "bg-indigo-500/10";

  return (
    <Card className={`relative overflow-hidden border ${accentBorder} ${accentBg} p-2 backdrop-blur-xl`}>
      {/* Top row: compact single line */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {/* Shift icon + label */}
        <div className="flex items-center gap-1.5">
          <CurrentIcon className={`h-3.5 w-3.5 ${accentText}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">Shift Transition</span>
          {shift.preShiftActive && (
            <Badge className="animate-pulse border border-rose-500/40 bg-rose-500/15 text-[8px] text-rose-300">
              <BellRing className="mr-1 h-2 w-2" /> HANDOVER
            </Badge>
          )}
        </div>

        {/* Current shift + progress bar inline */}
        <div className="flex flex-1 items-center gap-2 min-w-[180px]">
          <span className={`text-[10px] font-semibold ${accentText}`}>{shift.currentLabel}</span>
          <span className="font-mono text-[9px] text-slate-500">{shift.currentWindow}</span>
          <div className="flex-1 max-w-[120px]">
            <Progress value={shift.shiftProgressPct} className="h-1 bg-white/5" />
          </div>
          <span className="font-mono text-[9px] text-slate-500">{shift.shiftProgressPct.toFixed(0)}%</span>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5 text-slate-500" />
          <span className="text-[9px] text-slate-400">Next:</span>
          <span className={`font-mono text-xs font-bold tabular-nums ${shift.preShiftActive ? "text-rose-300 animate-pulse" : "text-cyan-300"}`}>
            {formatCountdown(shift.preShiftRemainingSec)}
          </span>
        </div>

        {/* Next shift label */}
        <div className="flex items-center gap-1">
          <NextIcon className={`h-3 w-3 ${shift.nextShift === "DAY" ? "text-amber-300" : "text-indigo-300"}`} />
          <span className="text-[9px] text-slate-400">{shift.nextLabel}</span>
          <span className="text-[9px] text-slate-500">({oncoming.length})</span>
        </div>

        {/* Action buttons */}
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onBroadcastShift} className="h-6 px-2 text-[9px] text-cyan-300 hover:bg-cyan-500/10">
            <Megaphone className="mr-1 h-3 w-3" /> Notify
          </Button>
          <Button size="sm" variant="ghost" onClick={onStartHandover} className="h-6 px-2 text-[9px] text-emerald-300 hover:bg-emerald-500/10">
            <ClipboardCheck className="mr-1 h-3 w-3" /> Handover
          </Button>
          <Button size="sm" variant="ghost" onClick={onForceRotate} className="h-6 px-2 text-[9px] text-violet-300 hover:bg-violet-500/10">
            Rotate
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setExpanded((p) => !p)} className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Expanded oncoming roster */}
      {expanded && (
        <div className="mt-1.5 rounded border border-white/5 bg-black/30 p-1.5">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Oncoming Roster · {shift.nextLabel}</span>
            {shift.preShiftActive && (
              <span className="text-[9px] font-semibold text-rose-300">Pre-shift brief in progress</span>
            )}
          </div>
          <ScrollArea className="max-h-[100px]">
            {oncoming.length === 0 ? (
              <div className="px-1 py-2 text-center text-[10px] text-slate-500">
                No personnel currently tagged for the {shift.nextLabel.toLowerCase()} window.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {oncoming.map((o) => (
                  <div key={o.call} className="flex items-center gap-1.5 rounded border border-white/5 bg-black/30 px-1.5 py-1">
                    <Avatar className="h-5 w-5 ring-1 ring-cyan-400/30">
                      <AvatarFallback className="bg-slate-800 text-[8px] text-slate-200">{initials(o.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-semibold text-slate-200">{o.name}</div>
                      <div className="truncate text-[9px] text-slate-500">{o.call} · {o.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </Card>
  );
}

export { getShiftInfo } from "./shiftClock";
