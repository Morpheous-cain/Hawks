import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Alert {
  id: string;
  title: string;
  body: string;
  severity: "low" | "medium" | "high" | "critical";
  source: string;
}

const SEVERITY_CLASS: Record<string, string> = {
  low: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  high: "border-orange-500/40 bg-orange-500/10 text-orange-100",
  critical: "border-red-500/60 bg-red-500/15 text-red-100",
};

export const TacticalAlertBanner = ({ staffId }: { staffId?: string }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const load = async () => {
      const out: Alert[] = [];
      const { data: bcasts } = await (supabase as any)
        .from("hq_broadcasts")
        .select("id,title,body,severity,created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      bcasts?.forEach((b: any) => out.push({
        id: `bc-${b.id}`, title: b.title ?? "HQ Broadcast", body: b.body ?? "",
        severity: (b.severity ?? "medium") as Alert["severity"], source: "HQ",
      }));
      setAlerts(out);
    };
    load();
    const ch = supabase
      .channel("tactical-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hq_broadcasts" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [staffId]);

  const dismiss = (id: string) => setAlerts((s) => s.filter((a) => a.id !== id));

  return (
    <AnimatePresence>
      {alerts.map((a) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${SEVERITY_CLASS[a.severity] ?? SEVERITY_CLASS.medium}`}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider">{a.source} · {a.title}</p>
            <p className="text-xs opacity-90 line-clamp-2">{a.body}</p>
          </div>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => dismiss(a.id)}>
            <X className="h-3 w-3" />
          </Button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default TacticalAlertBanner;
