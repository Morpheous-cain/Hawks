import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  MapPin, Navigation, Compass, ExternalLink, 
  Building2, Clock, Route, Target 
} from "lucide-react";

interface AssignedSite {
  id: string;
  site_name: string;
  address: string;
  gps_coordinates: string | null;
  client_name?: string;
}

const FieldNavigationPanel = () => {
  const [sites, setSites] = useState<AssignedSite[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignedSites();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const fetchAssignedSites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sites')
        .select(`
          id,
          site_name,
          address,
          gps_coordinates,
          clients (legal_name)
        `)
        .limit(20);
      
      if (error) throw error;
      
      const transformedSites: AssignedSite[] = (data || []).map(site => ({
        id: site.id,
        site_name: site.site_name,
        address: site.address,
        gps_coordinates: site.gps_coordinates,
        client_name: (site.clients as any)?.legal_name
      }));
      
      setSites(transformedSites);
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const openNavigation = (site: AssignedSite) => {
    if (!site.gps_coordinates && !site.address) {
      toast.error("No location available for this site");
      return;
    }

    let destination = '';
    if (site.gps_coordinates) {
      const [lat, lng] = site.gps_coordinates.split(',').map(c => c.trim());
      destination = `${lat},${lng}`;
    } else {
      destination = encodeURIComponent(site.address);
    }

    // Open Google Maps navigation
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(googleMapsUrl, '_blank');
  };

  const calculateDistance = (gpsCoords: string | null): string | null => {
    if (!currentLocation || !gpsCoords) return null;
    
    try {
      const [lat, lng] = gpsCoords.split(',').map(c => parseFloat(c.trim()));
      
      // Haversine formula for distance
      const R = 6371; // km
      const dLat = (lat - currentLocation.lat) * Math.PI / 180;
      const dLon = (lng - currentLocation.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(currentLocation.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
      }
      return `${distance.toFixed(1)}km`;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Location */}
      <Card className="border-green-500/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <Compass className="h-5 w-5" />
            Current Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentLocation ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  GPS Active
                </p>
              </div>
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                <Target className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Acquiring GPS location...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Quick Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                if (currentLocation) {
                  window.open(`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`, '_blank');
                }
              }}
              disabled={!currentLocation}
            >
              <MapPin className="h-6 w-6 text-blue-500" />
              <span className="text-xs">Share Location</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => {
                window.open('https://www.google.com/maps', '_blank');
              }}
            >
              <Navigation className="h-6 w-6 text-green-500" />
              <span className="text-xs">Open Maps</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Sites */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Assigned Sites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : sites.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No assigned sites</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sites.map((site) => {
                  const distance = calculateDistance(site.gps_coordinates);
                  return (
                    <Card key={site.id} className="bg-card/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{site.site_name}</p>
                            {site.client_name && (
                              <p className="text-sm text-primary">{site.client_name}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {site.address}
                            </p>
                            {distance && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{distance} away</span>
                              </div>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="gap-1"
                            onClick={() => openNavigation(site)}
                          >
                            <Navigation className="h-4 w-4" />
                            Go
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldNavigationPanel;
