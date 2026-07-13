import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Truck, AlertTriangle, Building2, Flame, Eye, EyeOff } from "lucide-react";

interface Props {
  vehicles: any[];
  sosAlerts: any[];
  onSelectVehicle?: (v: any) => void;
  onDispatchToLocation?: (loc: { lat: number; lng: number; label?: string }) => void;
}

const statusColor: Record<string, string> = {
  available: "#10b981",
  on_patrol: "#3b82f6",
  en_route: "#f59e0b",
  on_scene: "#fb923c",
  break: "#94a3b8",
  off_duty: "#475569",
  emergency: "#ef4444",
};

const MDTLiveMap = ({ vehicles, sosAlerts, onSelectVehicle, onDispatchToLocation }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [token, setToken] = useState(sessionStorage.getItem("mapbox_token") || "");
  const [tokenInput, setTokenInput] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [layers, setLayers] = useState({ vehicles: true, sos: true, heat: true, sites: true });
  const [incidents24h, setIncidents24h] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("clients")
      .select("id,trading_name,legal_name,gps_lat,gps_lng,geofence_radius_meters")
      .not("gps_lat", "is", null)
      .then(({ data }) => setClients(data || []));

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    supabase
      .from("mobile_incidents")
      .select("id,gps_lat,gps_lng,incident_type,priority,occurred_at")
      .gte("occurred_at", since)
      .not("gps_lat", "is", null)
      .then(({ data }) => setIncidents24h(data || []));
  }, []);

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    try {
      mapRef.current = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [36.8219, -1.2864],
        zoom: 11,
      });
      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current.on("click", (e) => {
        if (e.originalEvent.shiftKey && onDispatchToLocation) {
          onDispatchToLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng, label: "Custom pin" });
        }
      });
      mapRef.current.on("load", () => {
        // SOS heat-source
        mapRef.current!.addSource("sos-heat", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        mapRef.current!.addLayer({
          id: "sos-heat-layer",
          type: "heatmap",
          source: "sos-heat",
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
            "heatmap-intensity": 1.2,
            "heatmap-radius": 40,
            "heatmap-opacity": 0.7,
          },
        });
      });
    } catch (e) {
      console.error(e);
    }
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token]);

  // Render markers + heat data whenever data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Client geofence circles (approximate with circle layer)
    if (layers.sites) {
      clients.forEach((c) => {
        const el = document.createElement("div");
        el.style.cssText =
          "width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2px solid #fff;cursor:pointer;";
        const m = new mapboxgl.Marker(el)
          .setLngLat([Number(c.gps_lng), Number(c.gps_lat)])
          .setPopup(
            new mapboxgl.Popup({ offset: 12 }).setHTML(
              `<strong>${c.trading_name || c.legal_name}</strong><br/><small>Geofence ${c.geofence_radius_meters || 100}m</small><br/><small>Shift+Click map to dispatch here</small>`
            )
          )
          .addTo(map);
        markersRef.current.push(m);
      });
    }

    // Vehicles
    if (layers.vehicles) {
      vehicles
        .filter((v) => v.last_gps_lat && v.last_gps_lng)
        .forEach((v) => {
          const el = document.createElement("div");
          const color = statusColor[v.status] || "#94a3b8";
          el.style.cssText = `width:22px;height:22px;border-radius:50%;background:${color};border:3px solid #fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:bold;color:#fff;box-shadow:0 0 0 2px ${color}55;`;
          el.textContent = v.vehicle_id?.replace(/[^0-9]/g, "").slice(-2) || "?";
          el.title = `${v.vehicle_id} · ${v.status}`;
          el.onclick = () => onSelectVehicle?.(v);
          if (v.status === "emergency") el.style.animation = "pulse 1.2s infinite";
          const m = new mapboxgl.Marker(el).setLngLat([Number(v.last_gps_lng), Number(v.last_gps_lat)]).addTo(map);
          markersRef.current.push(m);
        });
    }

    // SOS markers (active)
    if (layers.sos) {
      sosAlerts
        .filter((s) => s.gps_lat && s.gps_lng && s.status !== "resolved")
        .forEach((s) => {
          const el = document.createElement("div");
          el.style.cssText =
            "width:26px;height:26px;border-radius:50%;background:#dc2626;border:3px solid #fef2f2;cursor:pointer;animation:pulse 1s infinite;";
          el.title = `SOS ${s.alert_number}`;
          el.onclick = () => onDispatchToLocation?.({ lat: Number(s.gps_lat), lng: Number(s.gps_lng), label: s.alert_number });
          const m = new mapboxgl.Marker(el).setLngLat([Number(s.gps_lng), Number(s.gps_lat)]).addTo(map);
          markersRef.current.push(m);
        });
    }

    // Heat data
    if (layers.heat && map.getSource("sos-heat")) {
      const points = [...sosAlerts, ...incidents24h]
        .filter((p) => p.gps_lat && p.gps_lng)
        .map((p) => ({
          type: "Feature" as const,
          properties: { weight: p.priority === "critical" ? 1 : 0.6 },
          geometry: { type: "Point" as const, coordinates: [Number(p.gps_lng), Number(p.gps_lat)] },
        }));
      (map.getSource("sos-heat") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: points,
      });
    }
  }, [vehicles, sosAlerts, clients, incidents24h, layers, onSelectVehicle, onDispatchToLocation]);

  const saveToken = () => {
    if (tokenInput.trim()) {
      sessionStorage.setItem("mapbox_token", tokenInput.trim());
      setToken(tokenInput.trim());
    }
  };

  if (!token) {
    return (
      <Card className="p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Live Map needs a Mapbox public token. Get one free at{" "}
          <a href="https://mapbox.com" target="_blank" rel="noreferrer" className="text-primary underline">
            mapbox.com
          </a>
          .
        </p>
        <div className="flex gap-2 max-w-md mx-auto">
          <Input
            placeholder="pk.eyJ1Ij…"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <Button onClick={saveToken}>Load Map</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-2 border-b flex flex-wrap gap-2 items-center text-xs">
        <span className="font-semibold mr-2">Layers:</span>
        {(["vehicles", "sos", "heat", "sites"] as const).map((k) => {
          const Icon = { vehicles: Truck, sos: AlertTriangle, heat: Flame, sites: Building2 }[k];
          return (
            <Badge
              key={k}
              variant={layers[k] ? "default" : "outline"}
              className="cursor-pointer gap-1"
              onClick={() => setLayers((p) => ({ ...p, [k]: !p[k] }))}
            >
              {layers[k] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <Icon className="w-3 h-3" />
              {k}
            </Badge>
          );
        })}
        <span className="ml-auto text-muted-foreground">Tip: Shift+Click map to dispatch to a custom pin</span>
      </div>
      <div ref={containerRef} style={{ height: 540 }} />
    </Card>
  );
};

export default MDTLiveMap;
