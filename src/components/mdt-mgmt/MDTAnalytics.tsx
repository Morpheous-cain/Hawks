import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, Clock, Truck, AlertTriangle, Activity } from "lucide-react";
import { formatDistanceStrict, subDays, format } from "date-fns";
import { toast } from "sonner";

const MDTAnalytics = () => {
  const [sos, setSos] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    const since = subDays(new Date(), 7).toISOString();
    Promise.all([
      supabase
        .from("sos_alerts")
        .select("*, vehicles(vehicle_id), profiles(full_name)")
        .gte("triggered_at", since),
      supabase.from("mdt_messages").select("*").gte("created_at", since),
      supabase.from("vehicles").select("*").eq("is_active", true),
    ]).then(([s, m, v]) => {
      setSos(s.data || []);
      setMessages(m.data || []);
      setVehicles(v.data || []);
    });
  }, []);

  const stats = useMemo(() => {
    const resolvedSos = sos.filter((s) => s.resolution_time && s.responded_by);
    const avgResp =
      resolvedSos.length === 0
        ? 0
        : resolvedSos.reduce((acc, s) => {
            const r = new Date(s.response_time).getTime() - new Date(s.triggered_at).getTime();
            return acc + r / 60000;
          }, 0) / resolvedSos.length;
    const avgResolve =
      resolvedSos.length === 0
        ? 0
        : resolvedSos.reduce((acc, s) => {
            const r = new Date(s.resolution_time).getTime() - new Date(s.triggered_at).getTime();
            return acc + r / 60000;
          }, 0) / resolvedSos.length;

    // Volume by hour
    const byHour: number[] = Array(24).fill(0);
    messages.forEach((m) => {
      byHour[new Date(m.created_at).getHours()]++;
    });

    // Top responders
    const responderMap = new Map<string, { name: string; count: number }>();
    sos.forEach((s) => {
      if (!s.responded_by) return;
      const name = s.profiles?.full_name || "Unknown";
      const cur = responderMap.get(s.responded_by) || { name, count: 0 };
      cur.count++;
      responderMap.set(s.responded_by, cur);
    });
    const topResponders = [...responderMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);

    // Utilization
    const engaged = vehicles.filter((v) =>
      ["on_patrol", "en_route", "on_scene"].includes(v.status)
    ).length;
    const utilization = vehicles.length === 0 ? 0 : Math.round((engaged / vehicles.length) * 100);

    return {
      avgResp,
      avgResolve,
      totalSos: sos.length,
      totalDispatches: messages.filter((m) => m.message_type === "dispatch").length,
      byHour,
      topResponders,
      utilization,
    };
  }, [sos, messages, vehicles]);

  const exportPdf = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("MDT Management — Weekly Report", 20, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), "PPpp")}`, 20, 28);

      doc.setFontSize(12);
      doc.text("Key Metrics", 20, 42);
      doc.setFontSize(10);
      const lines = [
        `Total SOS alerts (7d): ${stats.totalSos}`,
        `Total dispatches (7d): ${stats.totalDispatches}`,
        `Avg response time: ${stats.avgResp.toFixed(1)} min`,
        `Avg resolution time: ${stats.avgResolve.toFixed(1)} min`,
        `Fleet utilization: ${stats.utilization}%`,
        `Active fleet: ${vehicles.length} units`,
      ];
      lines.forEach((l, i) => doc.text(l, 20, 52 + i * 7));

      doc.text("Top Responders", 20, 100);
      stats.topResponders.forEach((r, i) =>
        doc.text(`${i + 1}. ${r.name} — ${r.count} responses`, 20, 110 + i * 7)
      );

      doc.text("Dispatch Volume by Hour", 20, 160);
      // simple bar chart
      const max = Math.max(...stats.byHour, 1);
      stats.byHour.forEach((v, h) => {
        const x = 20 + h * 7;
        const barH = (v / max) * 40;
        doc.rect(x, 200 - barH, 5, barH, "F");
        if (h % 4 === 0) doc.text(String(h), x, 210);
      });

      doc.save(`mdt-weekly-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Report downloaded");
    } catch (e: any) {
      toast.error("PDF export failed: " + e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Rolling 7-day window</p>
        <Button onClick={exportPdf} size="sm" className="gap-2">
          <Download className="w-4 h-4" /> Export PDF (COO Weekly)
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Avg Response" value={`${stats.avgResp.toFixed(1)} min`} icon={Clock} />
        <KpiCard label="Avg Resolution" value={`${stats.avgResolve.toFixed(1)} min`} icon={TrendingUp} />
        <KpiCard label="Total SOS" value={String(stats.totalSos)} icon={AlertTriangle} />
        <KpiCard label="Total Dispatches" value={String(stats.totalDispatches)} icon={Truck} />
        <KpiCard label="Fleet Utilization" value={`${stats.utilization}%`} icon={Activity} />
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Dispatch Volume by Hour</h3>
        <div className="flex items-end gap-1 h-32">
          {stats.byHour.map((v, h) => {
            const max = Math.max(...stats.byHour, 1);
            return (
              <div key={h} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary rounded-t"
                  style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }}
                  title={`${h}:00 — ${v}`}
                />
                <span className="text-[9px] text-muted-foreground">{h}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Top Responders</h3>
        {stats.topResponders.length === 0 ? (
          <p className="text-xs text-muted-foreground">No SOS responses in window</p>
        ) : (
          <div className="space-y-2">
            {stats.topResponders.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>
                  {i + 1}. {r.name}
                </span>
                <Badge>{r.count} responses</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const KpiCard = ({ label, value, icon: Icon }: any) => (
  <Card className="p-3">
    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
      <Icon className="w-3 h-3" /> {label}
    </div>
    <p className="text-xl font-bold">{value}</p>
  </Card>
);

export default MDTAnalytics;
