import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Timer, Play, RefreshCw, Square } from "lucide-react";
import { toast } from "sonner";

export const LoneWorkerTimer = () => {
  const [minutes, setMinutes] = useState(15);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!endsAt) return;
    if (now >= endsAt) {
      toast.error("Lone-worker timer expired — auto-escalating to HQ");
      setEndsAt(null);
    }
  }, [now, endsAt]);

  const start = () => { setEndsAt(Date.now() + minutes * 60_000); toast.success(`Timer started · ${minutes} min`); };
  const extend = () => endsAt && setEndsAt(endsAt + 5 * 60_000);
  const stop = () => { setEndsAt(null); toast.info("Timer stopped"); };

  const remaining = endsAt ? Math.max(0, endsAt - now) : 0;
  const m = Math.floor(remaining / 60_000), s = Math.floor((remaining % 60_000) / 1000);
  const danger = remaining > 0 && remaining < 60_000;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-4 w-4 text-primary" /> Lone-Worker Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border/40 bg-muted/30 p-6 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Time Remaining</p>
          <p className={`mt-1 font-mono text-5xl font-bold ${danger ? "text-red-500 animate-pulse" : "text-foreground"}`}>
            {endsAt ? `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : "—:—"}
          </p>
          {endsAt && <Badge variant="outline" className="mt-2">Active</Badge>}
        </div>

        {!endsAt ? (
          <div className="flex items-center gap-2">
            <Input type="number" value={minutes} onChange={(e) => setMinutes(Math.max(1, +e.target.value))} className="w-24" />
            <span className="text-xs text-muted-foreground">minutes</span>
            <Button className="ml-auto gap-1" onClick={start}><Play className="h-4 w-4" /> Start</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={extend} className="gap-1"><RefreshCw className="h-4 w-4" /> +5 min</Button>
            <Button variant="destructive" onClick={stop} className="gap-1"><Square className="h-4 w-4" /> Stop</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoneWorkerTimer;
