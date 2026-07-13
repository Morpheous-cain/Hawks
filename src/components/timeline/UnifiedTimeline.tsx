import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, BookOpen, Bell, MapPin, Camera, Phone, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type TimelineEvent = {
  id: string;
  source: 'incident' | 'alarm' | 'ob' | 'bodycam' | 'comms';
  title: string;
  subtitle?: string;
  ts: Date;
  severity?: string;
  site?: string;
  actor?: string;
};

const sourceMeta: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  incident: { icon: AlertTriangle, color: "text-alert-critical", bg: "bg-alert-critical/10", label: "INCIDENT" },
  alarm:    { icon: Bell,          color: "text-alert-caution",  bg: "bg-alert-caution/10",  label: "ALARM" },
  ob:       { icon: BookOpen,      color: "text-primary",        bg: "bg-primary/10",        label: "OB" },
  bodycam:  { icon: Camera,        color: "text-purple-400",     bg: "bg-purple-500/10",     label: "BODYCAM" },
  comms:    { icon: Phone,         color: "text-blue-400",       bg: "bg-blue-500/10",       label: "COMMS" },
};

interface UnifiedTimelineProps {
  siteFilter?: string;
  hours?: number;
  compact?: boolean;
}

export const UnifiedTimeline = ({ siteFilter, hours = 24, compact = false }: UnifiedTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const fetchEvents = async () => {
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const merged: TimelineEvent[] = [];

    try {
      const [inc, alm, ob] = await Promise.all([
        supabase.from('incidents').select('id,title,severity,location,created_at,description').gte('created_at', since).order('created_at', { ascending: false }).limit(50),
        supabase.from('alarm_activations').select('id,alarm_number,alarm_type,priority,location,triggered_at').gte('triggered_at', since).order('triggered_at', { ascending: false }).limit(50),
        supabase.from('dob_entries').select('id,entry_type,description,site_name,created_at').gte('created_at', since).order('created_at', { ascending: false }).limit(50),
      ]);

      inc.data?.forEach((r: any) => merged.push({
        id: `inc-${r.id}`, source: 'incident',
        title: r.title || 'Incident', subtitle: r.description?.slice(0, 80),
        ts: new Date(r.created_at), severity: r.severity, site: r.location
      }));
      alm.data?.forEach((r: any) => merged.push({
        id: `alm-${r.id}`, source: 'alarm',
        title: `${r.alarm_type || 'Alarm'} — ${r.alarm_number || ''}`,
        ts: new Date(r.triggered_at),
        severity: r.priority, site: r.location
      }));
      ob.data?.forEach((r: any) => merged.push({
        id: `ob-${r.id}`, source: 'ob',
        title: r.entry_type || 'OB Entry', subtitle: r.description?.slice(0, 80),
        ts: new Date(r.created_at), site: r.site_name
      }));
    } catch (e) {
      console.warn('Timeline source unavailable:', e);
    }

    let filtered = merged.sort((a, b) => b.ts.getTime() - a.ts.getTime());
    if (siteFilter) filtered = filtered.filter(e => e.site?.toLowerCase().includes(siteFilter.toLowerCase()));
    setEvents(filtered);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteFilter, hours]);

  const filtered = activeFilter === 'all' ? events : events.filter(e => e.source === activeFilter);

  const filterChips = [
    { key: 'all', label: 'All' },
    ...Object.entries(sourceMeta).map(([k, v]) => ({ key: k, label: v.label }))
  ];

  return (
    <Card className="p-4 bg-card/50 backdrop-blur border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Unified Command Timeline
          </h3>
          <p className="text-xs text-muted-foreground">Last {hours}h · {events.length} events {siteFilter && `· filtered: ${siteFilter}`}</p>
        </div>
        <Badge variant="outline" className="text-alert-normal border-alert-normal/30">LIVE</Badge>
      </div>

      <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b border-border/50">
        {filterChips.map(chip => (
          <Button
            key={chip.key}
            variant={activeFilter === chip.key ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setActiveFilter(chip.key)}
          >
            {chip.label}
          </Button>
        ))}
      </div>

      <ScrollArea className={compact ? "h-[400px]" : "h-[600px]"}>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading timeline...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No events in this window.</div>
        ) : (
          <div className="relative pl-6 space-y-3">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
            {filtered.map(ev => {
              const meta = sourceMeta[ev.source];
              const Icon = meta.icon;
              return (
                <div key={ev.id} className="relative group">
                  <div className={cn("absolute -left-[18px] top-2 w-4 h-4 rounded-full ring-4 ring-background flex items-center justify-center", meta.bg)}>
                    <Icon className={cn("w-2.5 h-2.5", meta.color)} />
                  </div>
                  <div className="flex items-start justify-between gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-[10px] h-4 px-1", meta.color)}>{meta.label}</Badge>
                        {ev.severity && (
                          <Badge variant="outline" className={cn("text-[10px] h-4 px-1",
                            (ev.severity === 'critical' || ev.severity === 'high') && "text-alert-critical border-alert-critical/40"
                          )}>{ev.severity.toUpperCase()}</Badge>
                        )}
                        <span className="text-sm font-medium text-foreground truncate">{ev.title}</span>
                      </div>
                      {ev.subtitle && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ev.subtitle}</p>}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        {ev.site && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{ev.site}</span>}
                        {ev.actor && <span>· {ev.actor}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDistanceToNow(ev.ts, { addSuffix: true })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default UnifiedTimeline;
