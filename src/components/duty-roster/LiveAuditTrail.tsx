import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AuditRow {
  id: string;
  action: string;
  module?: string;
  user_role?: string;
  timestamp: string;
}

const TONE: Record<string, string> = {
  panic_alert: "rose",
  roll_call_initiated: "emerald",
  deploy_unit: "blue",
  incident_escalation: "amber",
  default: "cyan",
};

const toneFor = (a: string) => TONE[a] ?? TONE.default;

export default function LiveAuditTrail() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("audit_trail")
        .select("id, action, module, user_role, timestamp")
        .order("timestamp", { ascending: false })
        .limit(40);
      if (active && data) setRows(data as AuditRow[]);
      setLoading(false);
    })();

    const ch = supabase
      .channel("duty-roster-audit")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_trail" },
        (payload) => setRows((r) => [payload.new as AuditRow, ...r].slice(0, 40)),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const fmt = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return ts;
    }
  };

  return (
    <ScrollArea className="h-64">
      <div className="space-y-1.5 pr-2">
        {loading && <div className="text-[11px] text-slate-500">Loading audit trail…</div>}
        {!loading && rows.length === 0 && (
          <div className="text-[11px] text-slate-500">No audit entries yet. Trigger an action above to begin logging.</div>
        )}
        {rows.map((r) => {
          const tone = toneFor(r.action);
          return (
            <div key={r.id} className="flex items-start gap-2 rounded border border-white/5 bg-black/30 px-2.5 py-1.5 text-[11px]">
              <span className="font-mono text-[10px] text-slate-500">{fmt(r.timestamp)}</span>
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-${tone}-400`} />
              <div className="min-w-0 flex-1">
                <div className="text-slate-200">{r.action.replace(/_/g, " ")}</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  {r.module && <span className="uppercase tracking-wider">{r.module}</span>}
                  {r.user_role && (
                    <Badge variant="outline" className="border-white/10 px-1.5 py-0 text-[9px] uppercase text-slate-400">
                      {r.user_role}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
