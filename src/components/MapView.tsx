import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState(
    sessionStorage.getItem('mapbox_token') || ''
  );
  const [tokenInput, setTokenInput] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);

  // Security locations in Nairobi
  const securityLocations = [
    { name: 'JKIA Terminal 2', coords: [-1.3192, 36.9278], status: 'active', personnel: 12 },
    { name: 'Villa Rosa Kempinski', coords: [-1.2921, 36.8219], status: 'active', personnel: 8 },
    { name: 'Two Rivers Mall', coords: [-1.2244, 36.8066], status: 'caution', personnel: 15 },
    { name: 'Nairobi Hospital', coords: [-1.2921, 36.8105], status: 'active', personnel: 6 },
    { name: 'Westgate Mall', coords: [-1.2679, 36.8065], status: 'active', personnel: 10 },
  ];

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [36.8219, -1.2864], // Nairobi center
        zoom: 11,
        pitch: 45,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add markers for each location
      map.current.on('load', () => {
        setIsMapReady(true);
        
        securityLocations.forEach((location) => {
          const el = document.createElement('div');
          el.className = 'security-marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.borderRadius = '50%';
          el.style.cursor = 'pointer';
          
          if (location.status === 'active') {
            el.style.backgroundColor = 'hsl(142 76% 45%)';
            el.style.boxShadow = '0 0 20px hsl(142 76% 45%)';
          } else {
            el.style.backgroundColor = 'hsl(38 92% 55%)';
            el.style.boxShadow = '0 0 20px hsl(38 92% 55%)';
          }
          
          el.style.border = '3px solid white';
          
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px; color: black;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${location.name}</h3>
              <p style="font-size: 12px; margin: 0;">Status: <span style="text-transform: uppercase;">${location.status}</span></p>
              <p style="font-size: 12px; margin: 0;">Personnel: ${location.personnel}</p>
            </div>`
          );

          new mapboxgl.Marker(el)
            .setLngLat([location.coords[1], location.coords[0]])
            .setPopup(popup)
            .addTo(map.current!);
        });

        toast({
          title: "Map Loaded",
          description: `${securityLocations.length} security locations displayed`,
        });
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Map Error",
        description: "Failed to initialize map. Please check your Mapbox token.",
        variant: "destructive",
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const handleTokenSave = () => {
    if (!tokenInput.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your Mapbox token",
        variant: "destructive",
      });
      return;
    }

    sessionStorage.setItem('mapbox_token', tokenInput);
    setMapboxToken(tokenInput);
    
    toast({
      title: "Token Saved",
      description: "Mapbox token saved successfully. Reloading map...",
    });
  };

  if (!mapboxToken) {
    return (
      <Card className="p-6 border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Mapbox Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          To display the interactive map, please enter your Mapbox public token.
          Get your token at{' '}
          <a
            href="https://mapbox.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            mapbox.com
          </a>
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="pk.eyJ1..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleTokenSave}>
            Save Token
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-0 border-border overflow-hidden">
      <div 
        ref={mapContainer} 
        className="w-full h-[500px] md:h-[600px]"
      />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MapView;
