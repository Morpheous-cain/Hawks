import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOfficerAssignments } from "@/hooks/useOfficerAssignments";
import { format } from "date-fns";

export const MySchedule = () => {
  const { staffRecord } = useOfficerAssignments();
  const [shifts, setShifts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!staffRecord?.id) return;
      const { data } = await (supabase as any)
        .from("shift_assignments")
        .select("*")
        .eq("staff_id", staffRecord.id)
        .gte("shift_date", new Date(Date.now() - 24 * 60 * 60_000).toISOString())
        .order("shift_date", { ascending: true })
        .limit(30);
      setShifts(data ?? []);
    };
    load();
  }, [staffRecord?.id]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-primary" /> My Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {shifts.length === 0 && <p className="text-xs text-muted-foreground">No upcoming shifts assigned.</p>}
        {shifts.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 rounded border border-border/40 bg-muted/30 p-3 text-xs">
            <div>
              <p className="font-medium">{s.shift_date ? format(new Date(s.shift_date), "EEE dd MMM") : "—"}</p>
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {s.start_time ?? "06:00"} – {s.end_time ?? "18:00"}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">{s.site_name ?? s.location ?? "Site TBA"}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MySchedule;
