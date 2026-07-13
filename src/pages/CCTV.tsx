import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Camera, Monitor, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientControlRoomMode from "@/components/cctv/ClientControlRoomMode";
import CCTVOperatorConsole from "@/components/cctv/CCTVOperatorConsole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Play, Pause, Download, Maximize2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CCTVCamera {
  id: string;
  name: string;
  location: string | null;
  status: string;
  alerts: number;
}

interface CCTVAnalytic {
  label: string;
  value: string;
}

const CCTV = () => {
  const [expandedCamera, setExpandedCamera] = useState<CCTVCamera | null>(null);
  const [playingCameras, setPlayingCameras] = useState<Set<string>>(new Set());
  const [cameras, setCameras] = useState<CCTVCamera[]>([]);
  const [analytics, setAnalytics] = useState<CCTVAnalytic[]>([]);

  const fetchData = useCallback(async () => {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    const [camRes, eventsRes] = await Promise.all([
      supabase.from("cctv_cameras" as any).select("id, name, location, status, is_active").eq("is_active", true).order("name"),
      supabase.from("cctv_events" as any).select("camera_id, event_type, severity").gte("occurred_at", todayStart),
    ]);

    const eventData = (eventsRes.data as any[]) ?? [];
    const alertCountByCam: Record<string, number> = {};
    eventData.forEach((e: any) => {
      if (e.camera_id && (e.severity === "high" || e.severity === "critical")) {
        alertCountByCam[e.camera_id] = (alertCountByCam[e.camera_id] ?? 0) + 1;
      }
    });

    const camList: CCTVCamera[] = ((camRes.data as any[]) ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      location: c.location,
      status: c.status,
      alerts: alertCountByCam[c.id] ?? 0,
    }));
    setCameras(camList);
    setPlayingCameras(new Set(camList.filter(c => c.status === "online").map(c => c.id)));

    const motionCount = eventData.filter((e: any) => e.event_type === "motion").length;
    const suspiciousCount = eventData.filter((e: any) => e.event_type === "suspicious_activity").length;
    const alertCount = eventData.filter((e: any) => e.severity === "high" || e.severity === "critical").length;
    setAnalytics([
      { label: "Motion Events (Today)", value: String(motionCount) },
      { label: "Alerts (Today)", value: String(alertCount) },
      { label: "Suspicious Activity (Today)", value: String(suspiciousCount) },
    ]);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const togglePlay = (camId: string) => {
    setPlayingCameras(prev => {
      const next = new Set(prev);
      if (next.has(camId)) { next.delete(camId); toast.info(`Camera paused`); }
      else { next.add(camId); toast.info(`Camera resumed`); }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CCTV & Video Management System"
        description="Live streaming, client control room, and loss control intelligence"
        icon={Camera}
      />

      <Tabs defaultValue="live" className="w-full">
        <TabsList>
          <TabsTrigger value="live">Live Cameras</TabsTrigger>
          <TabsTrigger value="operator" className="gap-2">
            <Monitor className="w-4 h-4" />
            Operator Console
          </TabsTrigger>
          <TabsTrigger value="control-room" className="gap-2">
            <Users className="w-4 h-4" />
            Client Control Room
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">
          {/* Analytics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.map((item, idx) => (
              <Card key={idx} className="p-4 border-border">
                <p className="text-sm text-primary font-semibold mb-1">{item.label}</p>
                <p className="text-3xl font-bold text-foreground">{item.value}</p>
              </Card>
            ))}
          </div>

          {/* Live Camera Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cameras.map((camera) => (
              <Card key={camera.id} className="overflow-hidden border-border">
                {/* Video Feed Placeholder */}
                <div className="relative aspect-video bg-muted/30 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-muted-foreground/50" />
                  
                  {/* Status Overlay */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      className={
                        camera.status === "active"
                          ? "bg-alert-normal text-primary-foreground"
                          : "bg-alert-caution text-primary-foreground"
                      }
                    >
                      {camera.status === "active" ? "LIVE" : "OFFLINE"}
                    </Badge>
                  </div>

                  {/* Alert Badge */}
                  {camera.alerts > 0 && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-alert-critical text-primary-foreground flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {camera.alerts}
                      </Badge>
                    </div>
                  )}

                  {/* Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-2 flex gap-1">
                    <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={() => togglePlay(camera.id)}>
                      {playingCameras.has(camera.id) ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={() => toast.success(`Snapshot saved for ${camera.id}`)}>
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="secondary" className="h-7 w-7 p-0 ml-auto" onClick={() => setExpandedCamera(camera)}>
                      <Maximize2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Camera Info */}
                <div className="p-3">
                  <p className="font-medium text-sm text-foreground">{camera.name}</p>
                  <p className="text-xs text-foreground/70 font-medium mt-1">{camera.location}</p>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="operator">
          <CCTVOperatorConsole />
        </TabsContent>

        <TabsContent value="control-room">
          <ClientControlRoomMode />
        </TabsContent>
      </Tabs>

      {/* Expanded Camera Dialog */}
      <Dialog open={!!expandedCamera} onOpenChange={() => setExpandedCamera(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{expandedCamera?.id} - {expandedCamera?.location}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-16 h-16 text-muted-foreground/50 mx-auto mb-2" />
              <Badge className={expandedCamera?.status === "active" ? "bg-alert-normal" : "bg-alert-caution"}>
                {expandedCamera?.status === "active" ? "LIVE FEED" : "OFFLINE"}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => togglePlay(expandedCamera?.id)}>
              {playingCameras.has(expandedCamera?.id) ? <><Pause className="w-4 h-4 mr-2" />Pause</> : <><Play className="w-4 h-4 mr-2" />Play</>}
            </Button>
            <Button variant="outline" onClick={() => toast.success(`Snapshot saved for ${expandedCamera?.id}`)}>
              <Download className="w-4 h-4 mr-2" />Save Snapshot
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CCTV;
