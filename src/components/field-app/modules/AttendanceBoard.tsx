import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const AttendanceBoard = () => {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data } = await (supabase as any)
        .from("attendance_records")
        .select("*,staff:staff_id(full_name,position,current_site)")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });
      setRecords(data ?? []);
    };
    load();
    const ch = supabase.channel("attendance-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const onShift = records.filter((r) => !r.check_out).length;
  const offShift = records.filter((r) => r.check_out).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total Today" value={records.length} icon={Users} tone="text-blue-500" />
        <Stat label="On Shift" value={onShift} icon={CheckCircle2} tone="text-emerald-500" />
        <Stat label="Clocked Out" value={offShift} icon={AlertCircle} tone="text-amber-500" />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Today's Roster</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {records.length === 0 && <p className="text-xs text-muted-foreground">No clock-ins yet.</p>}
          {records.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded border border-border/40 bg-muted/30 p-2 text-xs">
              <div>
                <p className="font-medium">{r.staff?.full_name ?? "Officer"}</p>
                <p className="text-[10px] text-muted-foreground">In {new Date(r.check_in).toLocaleTimeString()}</p>
              </div>
              <Badge variant={r.check_out ? "outline" : "default"} className="text-[10px]">
                {r.check_out ? "Off" : "On Shift"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const Stat = ({ label, value, icon: Icon, tone }: any) => (
  <Card className="p-3">
    <Icon className={`h-4 w-4 ${tone}`} />
    <p className="mt-1 text-2xl font-bold">{value}</p>
    <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
  </Card>
);

export default AttendanceBoard;
