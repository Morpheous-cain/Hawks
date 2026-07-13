import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Download, Sun, Sunset, Moon, AlertTriangle, Bell, FileText } from "lucide-react";
import { format } from "date-fns";

const ShiftHandover = () => {
  const [shift, setShift] = useState<'morning' | 'evening' | 'night'>('morning');
  const [data, setData] = useState({
    openIncidents: 0,
    activeAlarms: 0,
    pendingDispatches: 0,
    obEntries: 0,
    incidentsList: [] as any[],
    alarmsList: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
      const [inc, alm, ob] = await Promise.all([
        supabase.from('incidents').select('id,title,severity,location,status,created_at').eq('status', 'open').limit(20),
        supabase.from('alarm_activations').select('id,alarm_number,alarm_type,location,priority,status,triggered_at').in('status', ['triggered', 'dispatched']).limit(20),
        supabase.from('dob_entries').select('id', { count: 'exact', head: true }).gte('created_at', since),
      ]);
      setData({
        openIncidents: inc.data?.length || 0,
        activeAlarms: alm.data?.length || 0,
        pendingDispatches: alm.data?.filter((a: any) => a.status === 'dispatched').length || 0,
        obEntries: ob.count || 0,
        incidentsList: inc.data || [],
        alarmsList: alm.data || [],
      });
      setLoading(false);
    };
    load();
  }, []);

  const exportPdf = () => {
    window.print();
  };

  const shifts = [
    { id: 'morning', label: 'Morning (06:00-14:00)', icon: Sun },
    { id: 'evening', label: 'Evening (14:00-22:00)', icon: Sunset },
    { id: 'night',   label: 'Night (22:00-06:00)',   icon: Moon },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shift Handover Pack"
        description="Auto-generated brief: open incidents, active alarms, pending dispatches, key activity."
        icon={ClipboardList}
      />

      <div className="flex flex-wrap items-center gap-3">
        {shifts.map(s => {
          const Icon = s.icon;
          return (
            <Button key={s.id} variant={shift === s.id ? 'default' : 'outline'} size="sm" onClick={() => setShift(s.id)}>
              <Icon className="w-4 h-4 mr-2" />{s.label}
            </Button>
          );
        })}
        <Button onClick={exportPdf} variant="outline" size="sm" className="ml-auto">
          <Download className="w-4 h-4 mr-2" />Export PDF
        </Button>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur border-primary/20">
        <div className="text-center mb-6 pb-4 border-b border-border/50">
          <h2 className="text-2xl font-bold">Black Hawk — Shift Handover Brief</h2>
          <p className="text-xs text-muted-foreground mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy · HH:mm')} · {shifts.find(s => s.id === shift)?.label}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Open Incidents', value: data.openIncidents, icon: AlertTriangle, color: 'text-alert-critical' },
            { label: 'Active Alarms',  value: data.activeAlarms,  icon: Bell,           color: 'text-alert-caution' },
            { label: 'Pending Dispatch', value: data.pendingDispatches, icon: AlertTriangle, color: 'text-primary' },
            { label: 'OB Entries (12h)', value: data.obEntries,    icon: FileText,        color: 'text-foreground' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="p-4 bg-muted/20 border-border/50">
                <Icon className={`w-5 h-5 mb-2 ${s.color}`} />
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Open Incidents — Operator Action Required</h3>
            {data.incidentsList.length === 0 ? <p className="text-xs text-muted-foreground">None.</p> : (
              <div className="space-y-1">
                {data.incidentsList.map((i: any) => (
                  <div key={i.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{i.title}</div>
                      <div className="text-xs text-muted-foreground">{i.location} · {format(new Date(i.created_at), 'HH:mm')}</div>
                    </div>
                    <Badge variant="outline" className="text-alert-critical border-alert-critical/40">{i.severity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Active Alarms</h3>
            {data.alarmsList.length === 0 ? <p className="text-xs text-muted-foreground">None.</p> : (
              <div className="space-y-1">
                {data.alarmsList.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{a.alarm_number} · {a.alarm_type}</div>
                      <div className="text-xs text-muted-foreground">{a.location} · {format(new Date(a.triggered_at), 'HH:mm')}</div>
                    </div>
                    <Badge variant="outline">{a.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Operator Notes / Outgoing Briefing</h3>
            <textarea className="w-full p-3 rounded-md bg-background border border-border/50 text-sm min-h-[120px]" placeholder="Notes for incoming shift..." />
          </section>

          <section>
            <h3 className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Sign-Off</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Outgoing Operator</div>
                <input className="w-full p-2 rounded bg-background border border-border/50" placeholder="Name & ID" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Incoming Operator</div>
                <input className="w-full p-2 rounded bg-background border border-border/50" placeholder="Name & ID" />
              </div>
            </div>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default ShiftHandover;
