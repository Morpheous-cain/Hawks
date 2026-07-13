import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera, AlertTriangle, Bell, Eye, Monitor, Grid3X3, Square,
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize2, Download, Tag, Clock, MapPin, Shield, Siren
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface CamRow { id: string; name: string; location: string | null; status: string; alerts: number; recording: boolean; site_id: string | null; }
interface EventRow { id: string; camera_id: string | null; cameraName: string; event_type: string; occurred_at: string; description: string | null; }
interface AlertRow { id: string; camera_id: string | null; cameraName: string; severity: string; description: string | null; occurred_at: string; }

const EVENT_TYPE_MAP: Record<string, string> = {
  motion: "suspicious_activity", intrusion: "incident", loitering: "suspicious_activity",
  vehicle: "suspicious_activity", crowd: "suspicious_activity", other: "note",
};

const CCTVOperatorConsole = () => {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'quad' | 'grid'>('quad');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameras, setCameras] = useState<CamRow[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventRow[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<AlertRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>("all");

  const { data: sites } = useQuery({
    queryKey: ['sites-for-cctv'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const fetchData = useCallback(async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const [camRes, eventsRes, alertsRes] = await Promise.all([
      supabase.from("cctv_cameras" as any).select("id, name, location, status, is_active, site_id").eq("is_active", true).order("name"),
      supabase.from("cctv_events" as any).select("id, camera_id, event_type, occurred_at, description, severity, cctv_cameras(name)").gte("occurred_at", yesterday).order("occurred_at", { ascending: false }).limit(20),
      supabase.from("cctv_events" as any).select("id, camera_id, event_type, occurred_at, description, severity, cctv_cameras(name)").in("severity", ["high", "critical"]).gte("occurred_at", yesterday).order("occurred_at", { ascending: false }).limit(10),
    ]);

    const cams: CamRow[] = ((camRes.data as any[]) ?? []).map((c: any) => ({
      id: c.id, name: c.name, location: c.location, status: c.status, alerts: 0, recording: c.status === "online", site_id: c.site_id ?? null,
    }));
    setCameras(cams);
    if (cams.length > 0 && !selectedCamera) setSelectedCamera(cams[0].id);

    setRecentEvents(((eventsRes.data as any[]) ?? []).map((e: any) => ({
      id: e.id, camera_id: e.camera_id, cameraName: e.cctv_cameras?.name ?? "Unknown",
      event_type: e.event_type, occurred_at: e.occurred_at, description: e.description,
    })));

    setActiveAlerts(((alertsRes.data as any[]) ?? []).map((e: any) => ({
      id: e.id, camera_id: e.camera_id, cameraName: e.cctv_cameras?.name ?? "Unknown",
      severity: e.severity, description: e.description, occurred_at: e.occurred_at,
    })));
  }, [selectedCamera]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const camId = fd.get("camera") as string || null;
    const rawType = fd.get("type") as string;
    const notes = fd.get("notes") as string;
    const { data: u } = await supabase.auth.getUser();
    setSubmitting(true);
    try {
      const { error } = await (supabase.from("cctv_events" as any) as any).insert({
        camera_id: camId || null,
        event_type: EVENT_TYPE_MAP[rawType] ?? "note",
        description: notes || null,
        severity: "low",
        operator_id: u.user?.id ?? null,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Event marked and logged");
      setIsEventDialogOpen(false);
      fetchData();
    } finally { setSubmitting(false); }
  };

  const handleTriggerAlert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const alertType = fd.get("type") as string;
    const priority = fd.get("priority") as string;
    const description = fd.get("description") as string;
    const { data: u } = await supabase.auth.getUser();
    setSubmitting(true);
    try {
      const { error } = await (supabase.from("cctv_events" as any) as any).insert({
        camera_id: selectedCamera ?? null,
        event_type: "alert",
        description: `[${alertType.toUpperCase()}] ${description}`,
        severity: priority,
        operator_id: u.user?.id ?? null,
      });
      if (error) { toast.error(error.message); return; }
      toast.warning(`Alert triggered: ${alertType}`);
      setIsAlertDialogOpen(false);
      fetchData();
    } finally { setSubmitting(false); }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-alert-critical text-primary-foreground';
      case 'warning': return 'bg-alert-caution text-primary-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Control Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'single' ? 'default' : 'ghost'}
                onClick={() => setViewMode('single')}
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'quad' ? 'default' : 'ghost'}
                onClick={() => setViewMode('quad')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </div>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Eye className="w-3 h-3" />
              {cameras.filter(c => c.status === 'active' && (selectedSite === "all" || c.site_id === selectedSite)).length} Active
            </Badge>
            <Badge variant="secondary" className="gap-1 bg-alert-critical/20 text-alert-critical">
              <AlertTriangle className="w-3 h-3" />
              {cameras.filter(c => (selectedSite === "all" || c.site_id === selectedSite)).reduce((sum, c) => sum + c.alerts, 0)} Alerts
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Camera Grid */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <div className={`grid gap-2 ${
              viewMode === 'single' ? 'grid-cols-1' : 
              viewMode === 'quad' ? 'grid-cols-2' : 'grid-cols-3'
            }`}>
              {cameras.filter(c => selectedSite === "all" || c.site_id === selectedSite).slice(0, viewMode === 'single' ? 1 : viewMode === 'quad' ? 4 : 9).map((camera) => (
                <div
                  key={camera.id}
                  className={`relative aspect-video bg-muted/50 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedCamera === camera.id ? 'border-primary' : 'border-transparent hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedCamera(camera.id)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge className={camera.status === 'active' ? 'bg-alert-normal' : 'bg-alert-caution'}>
                      {camera.recording && <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />}
                      {camera.status === 'active' ? 'LIVE' : 'OFFLINE'}
                    </Badge>
                  </div>

                  {/* Alert Badge */}
                  {camera.alerts > 0 && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-alert-critical">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {camera.alerts}
                      </Badge>
                    </div>
                  )}

                  {/* Camera Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-2">
                    <p className="text-xs font-medium">{camera.name}</p>
                    <p className="text-xs text-muted-foreground">{camera.location}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Playback Controls */}
            {selectedCamera && (
              <div className="flex items-center justify-center gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
                <Button size="sm" variant="ghost">
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Play className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Pause className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <SkipForward className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button size="sm" variant="ghost" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="ghost">
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Tag className="w-4 h-4" />
                    Mark Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mark Event</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleMarkEvent} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Event Title</Label>
                      <Input name="title" placeholder="Brief description" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Camera</Label>
                      <Select name="camera" defaultValue={selectedCamera || undefined}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select camera" />
                        </SelectTrigger>
                        <SelectContent>
                          {cameras.map(cam => (
                            <SelectItem key={cam.id} value={cam.id}>{cam.name}{cam.location ? ` — ${cam.location}` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Event Type</Label>
                      <Select name="type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="motion">Motion Detection</SelectItem>
                          <SelectItem value="intrusion">Intrusion</SelectItem>
                          <SelectItem value="loitering">Loitering</SelectItem>
                          <SelectItem value="vehicle">Vehicle Activity</SelectItem>
                          <SelectItem value="crowd">Crowd Formation</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea name="notes" placeholder="Additional details..." rows={3} />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Saving…" : "Mark Event"}</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start gap-2">
                    <Siren className="w-4 h-4" />
                    Trigger Alert
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Trigger Alert</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleTriggerAlert} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Alert Type</Label>
                      <Select name="type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="intrusion">Intrusion Alert</SelectItem>
                          <SelectItem value="emergency">Emergency Response</SelectItem>
                          <SelectItem value="fire">Fire Alarm</SelectItem>
                          <SelectItem value="medical">Medical Emergency</SelectItem>
                          <SelectItem value="lockdown">Lockdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select name="priority" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea name="description" placeholder="Describe the situation..." rows={3} required />
                    </div>
                    <Button type="submit" variant="destructive" className="w-full" disabled={submitting}>
                      <Siren className="w-4 h-4 mr-2" />
                      {submitting ? "Triggering…" : "Trigger Alert"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {activeAlerts.length === 0 && <p className="text-xs text-muted-foreground italic">No active alerts</p>}
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(alert.occurred_at), "HH:mm")}</span>
                      </div>
                      <p className="text-xs font-medium">{alert.cameraName}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Recent Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {recentEvents.length === 0 && <p className="text-xs text-muted-foreground italic">No recent events</p>}
                  {recentEvents.map((event) => (
                    <div key={event.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline">{event.event_type.replace(/_/g, " ")}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(event.occurred_at), "HH:mm")}</span>
                      </div>
                      <p className="text-xs font-medium">{event.cameraName}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CCTVOperatorConsole;
