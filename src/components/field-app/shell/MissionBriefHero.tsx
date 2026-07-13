import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, MapPin, Users, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import LiveStatusStrip from "./LiveStatusStrip";

interface Props {
  userName: string;
  rank: string;
  siteName?: string;
  shiftWindow?: string;
  onDutyCount?: number;
  threatLevel?: "low" | "medium" | "high" | "critical";
  briefing?: string;
}

const THREAT: Record<string, { label: string; classes: string }> = {
  low:      { label: "GREEN — Normal",   classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  medium:   { label: "AMBER — Heightened", classes: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  high:     { label: "ORANGE — Elevated", classes: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  critical: { label: "RED — Critical",   classes: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export const MissionBriefHero = ({
  userName, rank, siteName, shiftWindow, onDutyCount = 0, threatLevel = "low", briefing,
}: Props) => {
  const t = THREAT[threatLevel];
  const now = new Date();

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Mission Brief</p>
              </div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                {userName}
              </h1>
              <p className="text-xs text-muted-foreground">
                {rank} · {format(now, "EEE dd MMM yyyy · HH:mm")} EAT
              </p>
            </div>
            <Badge variant="outline" className={`${t.classes} font-mono text-[10px]`}>
              <AlertTriangle className="mr-1 h-3 w-3" />
              {t.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-md border border-border/40 bg-background/40 px-3 py-2">
              <MapPin className="h-4 w-4 text-blue-400" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase text-muted-foreground">Site</p>
                <p className="truncate text-xs font-semibold">{siteName ?? "Unassigned"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/40 bg-background/40 px-3 py-2">
              <Clock className="h-4 w-4 text-emerald-400" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase text-muted-foreground">Shift</p>
                <p className="truncate text-xs font-semibold">{shiftWindow ?? "Off-roster"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/40 bg-background/40 px-3 py-2">
              <Users className="h-4 w-4 text-amber-400" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase text-muted-foreground">On Duty</p>
                <p className="text-xs font-semibold">{onDutyCount} officers</p>
              </div>
            </div>
          </div>

          {briefing && (
            <div className="rounded-md border border-border/40 bg-background/40 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Briefing: </span>{briefing}
            </div>
          )}

          <LiveStatusStrip />
        </div>
      </Card>
    </motion.div>
  );
};

export default MissionBriefHero;
