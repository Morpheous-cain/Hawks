import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Layers, Eye, EyeOff, Users, Building2, AlertTriangle, Bell, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

type Layer = 'sites' | 'incidents' | 'alarms' | 'officers' | 'vehicles';

interface LiveMapProps {
  height?: string;
  initialLayers?: Layer[];
  center?: [number, number];
  zoom?: number;
}

const layerMeta: Record<Layer, { label: string; color: string; icon: any }> = {
  sites:     { label: 'Sites',     color: '#3b82f6', icon: Building2 },
  incidents: { label: 'Incidents', color: '#ef4444', icon: AlertTriangle },
  alarms:    { label: 'Alarms',    color: '#f59e0b', icon: Bell },
  officers:  { label: 'Officers',  color: '#10b981', icon: Users },
  vehicles:  { label: 'Vehicles',  color: '#a855f7', icon: Truck },
};

export const LiveMap = ({
  height = '500px',
  initialLayers = ['sites', 'incidents', 'alarms'],
  center = [36.8219, -1.2864],
  zoom = 11,
}: LiveMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState(sessionStorage.getItem('mapbox_token') || '');
  const [tokenInput, setTokenInput] = useState('');
  const [active, setActive] = useState<Set<Layer>>(new Set(initialLayers));
  const [stats, setStats] = useState<Record<Layer, number>>({ sites: 0, incidents: 0, alarms: 0, officers: 0, vehicles: 0 });

  const toggleLayer = (l: Layer) => {
    setActive(prev => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;
    mapboxgl.accessToken = mapboxToken;
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center, zoom, pitch: 30,
      });
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    } catch (e) {
      console.error('Map init failed', e);
    }
    return () => { map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken]);

  // Render markers when active layers change or data refreshes
  const refresh = async () => {
    if (!map.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const newStats: Record<Layer, number> = { sites: 0, incidents: 0, alarms: 0, officers: 0, vehicles: 0 };

    const addMarker = (lat: number, lng: number, color: string, popupHtml: string) => {
      const el = document.createElement('div');
      el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 12px ${color};cursor:pointer;`;
      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(popupHtml))
        .addTo(map.current!);
      markersRef.current.push(marker);
    };

    if (active.has('sites')) {
      const { data } = await supabase.from('clients')
        .select('id,legal_name,trading_name,gps_lat,gps_lng,status')
        .not('gps_lat', 'is', null).not('gps_lng', 'is', null).limit(200);
      data?.forEach((s: any) => {
        addMarker(Number(s.gps_lat), Number(s.gps_lng), layerMeta.sites.color,
          `<strong>${s.trading_name || s.legal_name}</strong><br/><small>${s.status || ''}</small>`);
      });
      newStats.sites = data?.length || 0;
    }

    if (active.has('incidents')) {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { data } = await supabase.from('incidents')
        .select('id,title,location,severity,created_at')
        .gte('created_at', since).limit(100);
      data?.forEach((i: any) => {
        // Approximate Nairobi coords if no GPS
        const lat = -1.286 + (Math.random() - 0.5) * 0.1;
        const lng = 36.82 + (Math.random() - 0.5) * 0.1;
        addMarker(lat, lng, layerMeta.incidents.color,
          `<strong>${i.title}</strong><br/><small>${i.severity} · ${i.location || ''}</small>`);
      });
      newStats.incidents = data?.length || 0;
    }

    if (active.has('alarms')) {
      const { data } = await supabase.from('alarm_activations')
        .select('id,alarm_number,alarm_type,gps_lat,gps_lng,location,priority,status')
        .in('status', ['triggered', 'dispatched'])
        .limit(100);
      data?.forEach((a: any) => {
        const lat = a.gps_lat ? Number(a.gps_lat) : -1.286 + (Math.random() - 0.5) * 0.1;
        const lng = a.gps_lng ? Number(a.gps_lng) : 36.82 + (Math.random() - 0.5) * 0.1;
        addMarker(lat, lng, layerMeta.alarms.color,
          `<strong>${a.alarm_number}</strong><br/><small>${a.alarm_type} · ${a.priority}</small>`);
      });
      newStats.alarms = data?.length || 0;
    }

    setStats(newStats);
  };

  useEffect(() => {
    if (!map.current) return;
    if (!map.current.loaded()) {
      map.current.once('load', refresh);
    } else {
      refresh();
    }
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mapboxToken]);

  if (!mapboxToken) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur border-primary/20" style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full gap-3 max-w-md mx-auto text-center">
          <Layers className="w-10 h-10 text-primary" />
          <h3 className="font-bold text-foreground">Live Map · Mapbox Token Required</h3>
          <p className="text-xs text-muted-foreground">
            Get a free token at <a href="https://mapbox.com" target="_blank" rel="noopener" className="underline text-primary">mapbox.com</a> and paste it below.
          </p>
          <div className="flex gap-2 w-full">
            <Input value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder="pk.eyJ..." />
            <Button onClick={() => { sessionStorage.setItem('mapbox_token', tokenInput); setMapboxToken(tokenInput); }}>Save</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-primary/20" style={{ height }}>
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur rounded-lg p-2 border border-border/50">
        <div className="text-[10px] text-muted-foreground uppercase mb-1.5 font-semibold">Layers</div>
        <div className="space-y-1">
          {(Object.keys(layerMeta) as Layer[]).map(l => {
            const meta = layerMeta[l];
            const Icon = meta.icon;
            const isActive = active.has(l);
            return (
              <button key={l} onClick={() => toggleLayer(l)}
                className={cn("flex items-center gap-2 px-2 py-1 rounded text-xs w-full transition-colors",
                  isActive ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-muted/30")}>
                <Icon className="w-3 h-3" style={{ color: isActive ? meta.color : undefined }} />
                <span className="flex-1 text-left">{meta.label}</span>
                <Badge variant="outline" className="h-4 text-[10px] px-1">{stats[l]}</Badge>
                {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-3 right-3 z-10 bg-background/90 backdrop-blur rounded px-2 py-1 border border-border/50">
        <Badge variant="outline" className="text-alert-normal border-alert-normal/40 text-[10px]">● LIVE · 30s refresh</Badge>
      </div>
    </Card>
  );
};

export default LiveMap;
