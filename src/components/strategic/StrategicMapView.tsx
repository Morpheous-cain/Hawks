import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import AdvisoryMapMarkers from "./AdvisoryMapMarkers";
import AdvisoryHeatmap from "./AdvisoryHeatmap";

interface StrategicMapViewProps {
  advisories: any[];
  onMarkerClick: (advisory: any) => void;
}

const StrategicMapView = ({ advisories, onMarkerClick }: StrategicMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapToken, setMapToken] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapToken) return;
    if (map.current) return; // Initialize map only once

    mapboxgl.accessToken = mapToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [36.8219, -1.2921], // Nairobi coordinates
      zoom: 11,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.on('load', () => {
      setIsMapReady(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapToken]);

  if (!mapToken) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg p-8">
        <div className="text-center max-w-md">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your Mapbox public token to display the interactive map with incident markers.
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIi..."
              onChange={(e) => setMapToken(e.target.value)}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Get your token from{" "}
            <a
              href="https://account.mapbox.com/access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
      
      {isMapReady && (
        <>
          <AdvisoryMapMarkers 
            map={map.current} 
            advisories={advisories} 
            onMarkerClick={onMarkerClick}
          />
          <AdvisoryHeatmap
            map={map.current}
            advisories={advisories}
            category="all"
            enabled={showHeatmap}
          />
          
          {/* Heatmap Toggle */}
          <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <Label htmlFor="heatmap-toggle" className="text-sm font-medium cursor-pointer">
                Heatmap Layer
              </Label>
              <Switch
                id="heatmap-toggle"
                checked={showHeatmap}
                onCheckedChange={setShowHeatmap}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border">
            <h4 className="font-semibold text-xs mb-2">Severity</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-alert-critical" />
                <span className="text-xs">Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-alert-warning" />
                <span className="text-xs">Caution</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-alert-normal" />
                <span className="text-xs">Normal</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StrategicMapView;