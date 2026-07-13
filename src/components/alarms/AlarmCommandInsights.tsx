import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Timer, AlertOctagon, CheckCircle2, ShieldAlert, Wifi, WifiOff, Wrench } from "lucide-react";

export interface AlarmFilters {
  search: string;
  priority: string;
  type: string;
  status: string;
}

interface Props {
  sensors: any[];
  filters: AlarmFilters;
  onFiltersChange: (f: AlarmFilters) => void;
}

export default function AlarmCommandInsights({ sensors, filters, onFiltersChange }: Props) {
  const [kpis, setKpis] = useState({
    total24h: 0,
    avgResponseMin: 0,
    slaBreachPct: 0,
    falseAlarmPct: 0,
    mttrMin: 0,
  });

  useEffect(() => {
    const load = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("alarm_activations")
        .select("status,false_alarm,response_time_minutes,sla_deadline,triggered_at,resolved_at")
        .gte("triggered_at", since);
      if (error || !data) return;

      const total = data.length;
      const withResponse = data.filter((d: any) => d.response_time_minutes != null);
      const avg = withResponse.length
        ? withResponse.reduce((s: number, d: any) => s + Number(d.response_time_minutes), 0) / withResponse.length
        : 0;
      const breached = data.filter((d: any) => d.sla_deadline && d.resolved_at && new Date(d.resolved_at) > new Date(d.sla_deadline)).length;
      const falseAlarms = data.filter((d: any) => d.false_alarm).length;
      const resolved = data.filter((d: any) => d.resolved_at);
      const mttr = resolved.length
        ? resolved.reduce((s: number, d: any) => s + (new Date(d.resolved_at).getTime() - new Date(d.triggered_at).getTime()), 0) / resolved.length / 60000
        : 0;

      setKpis({
        total24h: total,
        avgResponseMin: Math.round(avg * 10) / 10,
        slaBreachPct: total ? Math.round((breached / total) * 1000) / 10 : 0,
        falseAlarmPct: total ? Math.round((falseAlarms / total) * 1000) / 10 : 0,
        mttrMin: Math.round(mttr * 10) / 10,
      });
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  const sensorHealth = useMemo(() => {
    const operational = sensors.filter((s) => s.status === "operational").length;
    const maintenance = sensors.filter((s) => s.status === "maintenance").length;
    const faulty = sensors.filter((s) => s.status === "faulty").length;
    const overdue = sensors.filter((s) => s.next_maintenance_date && new Date(s.next_maintenance_date) < new Date()).length;
    return { operational, maintenance, faulty, overdue, total: sensors.length };
  }, [sensors]);

  return (
    <div className="space-y-4">
      {/* KPI Strip - 24h */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={Activity} label="Alarms (24h)" value={kpis.total24h.toString()} tone="primary" />
        <Kpi icon={Timer} label="Avg Response" value={`${kpis.avgResponseMin} min`} tone="normal" />
        <Kpi icon={AlertOctagon} label="SLA Breach" value={`${kpis.slaBreachPct}%`} tone={kpis.slaBreachPct > 15 ? "critical" : kpis.slaBreachPct > 5 ? "caution" : "normal"} />
        <Kpi icon={ShieldAlert} label="False Alarm" value={`${kpis.falseAlarmPct}%`} tone={kpis.falseAlarmPct > 20 ? "caution" : "normal"} />
        <Kpi icon={CheckCircle2} label="MTTR" value={`${kpis.mttrMin} min`} tone="primary" />
      </div>

      {/* Sensor Health */}
      <Card className="p-4 border border-primary/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2 uppercase tracking-wide text-sm">
            <Wifi className="w-4 h-4 text-primary" />
            Sensor Health · {sensorHealth.total} devices
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <HealthTile icon={Wifi} label="Operational" value={sensorHealth.operational} tone="normal" />
          <HealthTile icon={Wrench} label="Maintenance" value={sensorHealth.maintenance} tone="caution" />
          <HealthTile icon={WifiOff} label="Faulty" value={sensorHealth.faulty} tone="critical" />
          <HealthTile icon={AlertOctagon} label="Overdue Service" value={sensorHealth.overdue} tone={sensorHealth.overdue > 0 ? "caution" : "normal"} />
        </div>
      </Card>

      {/* Filter Bar */}
      <Card className="p-3 border border-primary/30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="Search alarm #, site, location…"
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
          <Select value={filters.priority} onValueChange={(v) => onFiltersChange({ ...filters, priority: v })}>
            <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.type} onValueChange={(v) => onFiltersChange({ ...filters, type: v })}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="fire">Fire</SelectItem>
              <SelectItem value="panic">Panic</SelectItem>
              <SelectItem value="intrusion">Intrusion</SelectItem>
              <SelectItem value="motion">Motion</SelectItem>
              <SelectItem value="glass_break">Glass Break</SelectItem>
              <SelectItem value="door_contact">Door Contact</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => onFiltersChange({ ...filters, status: v })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All open statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="dispatched">Dispatched</SelectItem>
              <SelectItem value="arrived">Arrived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: any) {
  const toneMap: Record<string, string> = {
    primary: "border-primary/40 bg-primary/5 text-primary",
    normal: "border-alert-normal/40 bg-alert-normal/5 text-alert-normal",
    caution: "border-alert-caution/40 bg-alert-caution/10 text-alert-caution",
    critical: "border-alert-critical/40 bg-alert-critical/10 text-alert-critical",
  };
  return (
    <Card className={`p-3 border-2 ${toneMap[tone]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </Card>
  );
}

function HealthTile({ icon: Icon, label, value, tone }: any) {
  const toneMap: Record<string, string> = {
    normal: "text-alert-normal",
    caution: "text-alert-caution",
    critical: "text-alert-critical",
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
      <Icon className={`w-5 h-5 ${toneMap[tone]}`} />
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
