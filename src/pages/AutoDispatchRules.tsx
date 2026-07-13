import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Zap, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEMO_RULES = [
  {
    id: "demo-rule-1",
    name: "Critical parcels under 5 minutes",
    client_tier: "same_day",
    alarm_type: "unassigned_critical",
    hour_start: 6,
    hour_end: 22,
    action: "auto_assign_nearest",
    active: true,
  },
  {
    id: "demo-rule-2",
    name: "Rebalance overloaded CBD queue",
    client_tier: "express",
    alarm_type: "zone_overload",
    hour_start: 7,
    hour_end: 20,
    action: "rebalance_riders",
    active: true,
  },
  {
    id: "demo-rule-3",
    name: "High COD verification hold",
    client_tier: "cod",
    alarm_type: "cod_over_5000",
    hour_start: 8,
    hour_end: 18,
    action: "flag_cod_review",
    active: true,
  },
  {
    id: "demo-rule-4",
    name: "Stale pickup escalation",
    client_tier: "standard",
    alarm_type: "pickup_sla_breach",
    hour_start: 0,
    hour_end: 24,
    action: "notify_dispatch_lead",
    active: false,
  },
];

const AutoDispatchRules = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [name, setName] = useState("");
  const [tier, setTier] = useState("same_day");
  const [alarmType, setAlarmType] = useState("unassigned_critical");
  const [hourStart, setHourStart] = useState(0);
  const [hourEnd, setHourEnd] = useState(24);
  const [action, setAction] = useState("auto_assign_nearest");
  const { toast } = useToast();

  const load = async () => {
    try {
      const { data, error } = await supabase.from('auto_dispatch_rules' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        setRules(data);
        setDemoMode(false);
        return;
      }
      setRules(DEMO_RULES);
      setDemoMode(true);
    } catch {
      setRules(DEMO_RULES);
      setDemoMode(true);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name) return;
    if (demoMode) {
      setRules((prev) => [{
        id: `demo-${Date.now()}`,
        name,
        client_tier: tier,
        alarm_type: alarmType,
        hour_start: hourStart,
        hour_end: hourEnd,
        action,
        active: true,
      }, ...prev]);
      setName("");
      toast({ title: "Demo courier rule added" });
      return;
    }
    try {
      const { error } = await supabase.from('auto_dispatch_rules' as any).insert({
        name, client_tier: tier, alarm_type: alarmType,
        hour_start: hourStart, hour_end: hourEnd, action, active: true
      });
      if (error) throw error;
      toast({ title: "Rule created" });
      setName("");
      load();
    } catch (e: any) {
      toast({ title: "Could not create rule", description: e.message, variant: "destructive" });
    }
  };

  const toggle = async (id: string, active: boolean) => {
    if (demoMode) {
      setRules((prev) => prev.map((rule) => rule.id === id ? { ...rule, active } : rule));
      return;
    }
    try {
      await supabase.from('auto_dispatch_rules' as any).update({ active }).eq('id', id);
      load();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auto-Dispatch Rules Engine"
        description="Courier automation rules for priority assignment, zone balancing, COD controls, stale pickups and dispatch escalation."
        icon={Zap}
      />

      <Card className="p-4 bg-card/50 border-primary/20">
        <h3 className="font-semibold mb-3">New Rule</h3>
        {demoMode && (
          <p className="mb-3 text-xs text-muted-foreground">
            Showing seeded courier demo rules because no backend rules table is available yet.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input placeholder="Rule name (e.g., Critical CBD auto-assign)" value={name} onChange={e => setName(e.target.value)} />
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="same_day">Same Day</SelectItem>
              <SelectItem value="express">Express</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="cod">COD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={alarmType} onValueChange={setAlarmType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned_critical">Unassigned critical parcel</SelectItem>
              <SelectItem value="pickup_sla_breach">Pickup SLA breach</SelectItem>
              <SelectItem value="zone_overload">Zone overload</SelectItem>
              <SelectItem value="cod_over_5000">High COD parcel</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 items-center text-sm">
            <span className="text-xs text-muted-foreground">From hr</span>
            <Input type="number" min={0} max={23} value={hourStart} onChange={e => setHourStart(+e.target.value)} className="w-20" />
            <span className="text-xs text-muted-foreground">To hr</span>
            <Input type="number" min={1} max={24} value={hourEnd} onChange={e => setHourEnd(+e.target.value)} className="w-20" />
          </div>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto_assign_nearest">Auto-assign nearest rider</SelectItem>
              <SelectItem value="rebalance_riders">Rebalance rider load</SelectItem>
              <SelectItem value="notify_dispatch_lead">Notify dispatch lead</SelectItem>
              <SelectItem value="flag_cod_review">Flag COD review</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={create} disabled={!name}><Plus className="w-4 h-4 mr-2" />Create</Button>
        </div>
      </Card>

      <Card className="p-4 bg-card/50 border-primary/20">
        <h3 className="font-semibold mb-3">Active Rules</h3>
        {rules.length === 0 ? (
          <p className="text-xs text-muted-foreground">No courier rules loaded yet.</p>
        ) : (
          <div className="space-y-2">
            {rules.map(r => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded bg-muted/20 border border-border/40">
                <Switch checked={r.active} onCheckedChange={v => toggle(r.id, v)} />
                <div className="flex-1">
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    <Badge variant="outline" className="mr-1 text-[10px]">{r.client_tier}</Badge>
                    <Badge variant="outline" className="mr-1 text-[10px]">{r.alarm_type}</Badge>
                    {r.hour_start}:00 → {r.hour_end}:00 · <span className="text-primary">{r.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AutoDispatchRules;
