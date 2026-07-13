import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { 
  Search, AlertTriangle, Users, Building2, BookOpen, Bell, Wrench,
  MapPin, Truck, Camera
} from "lucide-react";
import { cn } from "@/lib/utils";

type Result = {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  icon: any;
  color: string;
  href: string;
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const moduleShortcuts: Result[] = useMemo(() => [
    { id: 'm-control', title: 'Control Room Command', subtitle: 'Live operations centre', type: 'Module', icon: Bell, color: 'text-primary', href: '/control-room' },
    { id: 'm-incidents', title: 'Incident Management', subtitle: 'All incidents', type: 'Module', icon: AlertTriangle, color: 'text-alert-critical', href: '/incidents' },
    { id: 'm-dob', title: 'Digital Occurrence Book', subtitle: 'OB entries', type: 'Module', icon: BookOpen, color: 'text-primary', href: '/dob' },
    { id: 'm-alarms', title: 'Alarm & Mobile Response', subtitle: 'Active alarms', type: 'Module', icon: Bell, color: 'text-alert-caution', href: '/alarms' },
    { id: 'm-bodycam', title: 'Body Cam & Evidence', subtitle: 'Officer cams', type: 'Module', icon: Camera, color: 'text-purple-400', href: '/bodycam' },
    { id: 'm-fleet', title: 'Fleet Management', subtitle: 'Vehicles', type: 'Module', icon: Truck, color: 'text-blue-400', href: '/fleet' },
    { id: 'm-staff', title: 'Staff Management', subtitle: 'All officers', type: 'Module', icon: Users, color: 'text-foreground', href: '/staff' },
    { id: 'm-clients', title: 'Client Management', subtitle: 'All sites', type: 'Module', icon: Building2, color: 'text-foreground', href: '/clients' },
    { id: 'm-map', title: 'Operational Map', subtitle: 'Live unit map', type: 'Module', icon: MapPin, color: 'text-alert-normal', href: '/map' },
    { id: 'm-tech', title: 'Technical Security', subtitle: 'TIMU work orders', type: 'Module', icon: Wrench, color: 'text-foreground', href: '/technical-security' },
  ], []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(moduleShortcuts.slice(0, 6));
      return;
    }

    const search = async () => {
      setLoading(true);
      const q = query.trim();
      const collected: Result[] = [];

      moduleShortcuts.filter(m =>
        m.title.toLowerCase().includes(q.toLowerCase()) ||
        m.subtitle?.toLowerCase().includes(q.toLowerCase())
      ).forEach(m => collected.push(m));

      try {
        const [inc, cli, stf, alm] = await Promise.all([
          supabase.from('incidents').select('id,title,location,severity').ilike('title', `%${q}%`).limit(5),
          supabase.from('clients').select('id,legal_name,trading_name').or(`legal_name.ilike.%${q}%,trading_name.ilike.%${q}%`).limit(5),
          supabase.from('staff').select('id,full_name,position').ilike('full_name', `%${q}%`).limit(5),
          supabase.from('alarm_activations').select('id,alarm_number,location,alarm_type').or(`alarm_number.ilike.%${q}%,location.ilike.%${q}%`).limit(5),
        ]);

        inc.data?.forEach((r: any) => collected.push({
          id: `inc-${r.id}`, title: r.title, subtitle: `${r.location || ''} · ${r.severity || ''}`,
          type: 'Incident', icon: AlertTriangle, color: 'text-alert-critical', href: '/incidents'
        }));
        cli.data?.forEach((r: any) => collected.push({
          id: `cli-${r.id}`, title: r.trading_name || r.legal_name, subtitle: r.legal_name,
          type: 'Client', icon: Building2, color: 'text-foreground', href: `/clients/${r.id}`
        }));
        stf.data?.forEach((r: any) => collected.push({
          id: `stf-${r.id}`, title: r.full_name, subtitle: r.position,
          type: 'Officer', icon: Users, color: 'text-foreground', href: '/staff'
        }));
        alm.data?.forEach((r: any) => collected.push({
          id: `alm-${r.id}`, title: r.alarm_number, subtitle: `${r.location || ''} · ${r.alarm_type || ''}`,
          type: 'Alarm', icon: Bell, color: 'text-alert-caution', href: '/alarms'
        }));
      } catch (e) {
        console.warn('Search source unavailable:', e);
      }

      setResults(collected.slice(0, 20));
      setLoading(false);
    };

    const timer = setTimeout(search, 200);
    return () => clearTimeout(timer);
  }, [query, moduleShortcuts]);

  const go = (r: Result) => {
    onOpenChange(false);
    setQuery("");
    navigate(r.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-card/95 backdrop-blur border-primary/30">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <DialogDescription className="sr-only">Search across incidents, officers, clients, alarms and modules.</DialogDescription>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <Search className="w-5 h-5 text-primary" />
          <Input
            autoFocus
            placeholder="Search incidents, officers, clients, alarms, modules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 text-base"
          />
          <Badge variant="outline" className="text-[10px]">⌘K</Badge>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="p-2">
            {loading && <div className="px-3 py-2 text-xs text-muted-foreground">Searching...</div>}
            {!loading && results.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">No results.</div>
            )}
            {results.map(r => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => go(r)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-primary/10 transition-colors text-left"
                >
                  <div className={cn("w-8 h-8 rounded-md flex items-center justify-center bg-muted/30", r.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{r.title}</div>
                    {r.subtitle && <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>}
                  </div>
                  <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="px-4 py-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>↑↓ navigate · ↵ open · esc close</span>
          <span>Black Hawk SOC-OS Palette</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
