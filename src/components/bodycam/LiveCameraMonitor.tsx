import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, MapPin, Wifi, WifiOff, AlertCircle, Play, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LiveFeed {
  id: string;
  officer_name: string;
  device_id: string;
  site_name: string;
  is_live: boolean;
  stream_url: string;
  gps_lat: number;
  gps_lng: number;
  recording_start: string;
  status: string;
}

const LiveCameraMonitor = () => {
  const { toast } = useToast();
  const [liveFeeds, setLiveFeeds] = useState<LiveFeed[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<LiveFeed | null>(null);
  const [filterSite, setFilterSite] = useState<string>("all");
  const [searchOfficer, setSearchOfficer] = useState<string>("");

  useEffect(() => {
    fetchLiveFeeds();
    const channel = setupRealtimeSubscription();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLiveFeeds = async () => {
    const { data, error } = await supabase
      .from("body_cam_footage")
      .select(`
        id,
        is_live,
        stream_url,
        gps_lat,
        gps_lng,
        recording_start,
        device_id,
        officer:officer_id(full_name),
        site:site_id(site_name)
      `)
      .eq("is_live", true)
      .order("recording_start", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load live feeds",
        variant: "destructive",
      });
      return;
    }

    const formattedFeeds = data?.map((feed: any) => ({
      id: feed.id,
      officer_name: feed.officer?.full_name || "Unknown",
      device_id: feed.device_id,
      site_name: feed.site?.site_name || "Unknown",
      is_live: feed.is_live,
      stream_url: feed.stream_url,
      gps_lat: feed.gps_lat,
      gps_lng: feed.gps_lng,
      recording_start: feed.recording_start,
      status: "recording",
    })) || [];

    setLiveFeeds(formattedFeeds);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("live-body-cam-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "body_cam_footage",
          filter: "is_live=eq.true",
        },
        () => {
          fetchLiveFeeds();
        }
      )
      .subscribe();

    return channel;
  };

  const filteredFeeds = liveFeeds.filter((feed) => {
    const matchesSite = filterSite === "all" || feed.site_name === filterSite;
    const matchesOfficer = feed.officer_name.toLowerCase().includes(searchOfficer.toLowerCase());
    return matchesSite && matchesOfficer;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "recording":
        return "bg-alert-normal";
      case "incident":
        return "bg-alert-critical";
      case "poor_signal":
        return "bg-alert-caution";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Live Grid */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Active Cameras ({filteredFeeds.length})</h3>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search officer..."
                value={searchOfficer}
                onChange={(e) => setSearchOfficer(e.target.value)}
                className="w-48"
              />
              <Select value={filterSite} onValueChange={setFilterSite}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  <SelectItem value="JKIA">JKIA</SelectItem>
                  <SelectItem value="Villa Rosa">Villa Rosa</SelectItem>
                  <SelectItem value="Two Rivers">Two Rivers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredFeeds.map((feed) => (
              <Card
                key={feed.id}
                className={`cursor-pointer transition-all hover:shadow-glow ${
                  selectedFeed?.id === feed.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedFeed(feed)}
              >
                <div className="relative aspect-video bg-muted flex items-center justify-center">
                  <Camera className="w-12 h-12 text-muted-foreground/50" />
                  <div className="absolute top-2 right-2">
                    <Badge className={getStatusColor(feed.status)}>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                    </Badge>
                  </div>
                  <div className="absolute top-2 left-2">
                    {feed.gps_lat && feed.gps_lng ? (
                      <Wifi className="w-4 h-4 text-alert-normal" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-alert-caution" />
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm truncate">{feed.officer_name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    {feed.site_name}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{feed.device_id}</p>
                </div>
              </Card>
            ))}
          </div>

          {filteredFeeds.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No active cameras found</p>
            </div>
          )}
        </Card>
      </div>

      {/* Right Panel - Selected Feed Detail */}
      <div className="space-y-4">
        <Card className="p-6">
          {selectedFeed ? (
            <>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <Camera className="w-16 h-16 text-muted-foreground/50" />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Officer</p>
                  <p className="font-medium">{selectedFeed.officer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedFeed.site_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GPS Coordinates</p>
                  <p className="font-medium text-xs">
                    {selectedFeed.gps_lat?.toFixed(6)}, {selectedFeed.gps_lng?.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recording Started</p>
                  <p className="font-medium text-sm">
                    {new Date(selectedFeed.recording_start).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Device ID</p>
                  <p className="font-medium text-sm">{selectedFeed.device_id}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button size="sm" className="flex-1">
                  <Square className="w-4 h-4 mr-2" />
                  Create Clip
                </Button>
                <Button size="sm" variant="secondary" className="flex-1">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Mark Incident
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a camera to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LiveCameraMonitor;
