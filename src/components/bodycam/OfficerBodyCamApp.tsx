import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Camera, Video, VideoOff, Circle, Square, AlertTriangle, Upload,
  MapPin, Clock, Battery, Wifi, WifiOff, Tag, CheckCircle, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface RecordingSession {
  id: string;
  startTime: Date;
  duration: number;
  incidents: number;
}

const OfficerBodyCamApp = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [isOnline, setIsOnline] = useState(true);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [pendingUploads, setPendingUploads] = useState<any[]>([]);
  const [isMarkIncidentOpen, setIsMarkIncidentOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [gpsLocation, setGpsLocation] = useState({ lat: -1.2921, lng: 36.8219 });

  // Simulate recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Simulate battery drain and GPS updates
  useEffect(() => {
    const batteryInterval = setInterval(() => {
      setBatteryLevel(prev => Math.max(5, prev - Math.random() * 0.5));
    }, 30000);

    const gpsInterval = setInterval(() => {
      setGpsLocation(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.0001,
        lng: prev.lng + (Math.random() - 0.5) * 0.0001
      }));
    }, 10000);

    const connectionInterval = setInterval(() => {
      if (Math.random() > 0.95) {
        setIsOnline(false);
        toast.warning("Connection lost - switching to offline mode");
        setTimeout(() => {
          setIsOnline(true);
          toast.success("Connection restored");
        }, 3000);
      }
    }, 20000);

    // Real-time subscription for body cam clips
    const clipsChannel = supabase
      .channel('bodycam-clips')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'body_cam_clips' }, () => {
        toast.success("New clip uploaded to evidence library");
      })
      .subscribe();

    return () => {
      clearInterval(batteryInterval);
      clearInterval(gpsInterval);
      clearInterval(connectionInterval);
      supabase.removeChannel(clipsChannel);
    };
  }, []);

  // Format duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    setRecordingDuration(0);
    setCurrentSession({
      id: `REC-${Date.now()}`,
      startTime: new Date(),
      duration: 0,
      incidents: 0
    });
    toast.success("Recording started");
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    if (currentSession) {
      setPendingUploads(prev => [...prev, {
        ...currentSession,
        duration: recordingDuration,
        status: 'pending'
      }]);
    }
    setCurrentSession(null);
    toast.info("Recording stopped - Added to upload queue");
  };

  const handleMarkIncident = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase.from('body_cam_clips').insert({
        footage_id: currentSession?.id || `FT-${Date.now()}`,
        evidence_id: `EV-${Date.now()}`,
        clip_name: formData.get('title') as string,
        clip_description: formData.get('description') as string,
        trigger_type: formData.get('category') as string,
        officer_id: (await supabase.from('staff').select('id').limit(1).single()).data?.id,
        clip_start: new Date().toISOString(),
        clip_end: new Date().toISOString(),
        clip_url: '/placeholder.mp4',
        duration_seconds: recordingDuration,
        gps_lat: gpsLocation.lat,
        gps_lng: gpsLocation.lng,
        status: 'draft'
      });

      if (error) throw error;
      
      toast.success("Incident marked successfully");
      setIsMarkIncidentOpen(false);
    } catch (error) {
      toast.error("Failed to mark incident");
    }
  };

  const handleUploadClip = async (upload: any) => {
    // Simulate upload
    setPendingUploads(prev => prev.map(u => 
      u.id === upload.id ? { ...u, status: 'uploading' } : u
    ));

    setTimeout(() => {
      setPendingUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, status: 'uploaded' } : u
      ));
      toast.success(`Clip ${upload.id} uploaded successfully`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Battery className={`w-5 h-5 ${batteryLevel > 20 ? 'text-alert-normal' : 'text-alert-critical'}`} />
                <span className="text-sm font-medium">{batteryLevel}%</span>
              </div>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-alert-normal" />
                ) : (
                  <WifiOff className="w-5 h-5 text-alert-caution" />
                )}
                <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              <Clock className="w-3 h-3 mr-1" />
              {format(new Date(), 'HH:mm:ss')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Recording Panel */}
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-muted/50 flex items-center justify-center">
          <div className="text-center">
            <Camera className="w-24 h-24 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Camera Preview</p>
          </div>
          
          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Badge className="bg-alert-critical text-primary-foreground animate-pulse">
                <Circle className="w-3 h-3 mr-1 fill-current" />
                REC
              </Badge>
              <span className="font-mono text-lg font-bold text-alert-critical">
                {formatDuration(recordingDuration)}
              </span>
            </div>
          )}

          {/* GPS Overlay */}
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md">
            <span className="text-xs text-muted-foreground">
              GPS: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
            </span>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {!isRecording ? (
              <Button
                size="lg"
                className="w-32 h-32 rounded-full bg-alert-critical hover:bg-alert-critical/90"
                onClick={handleStartRecording}
              >
                <Video className="w-12 h-12" />
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="w-32 h-32 rounded-full border-2 border-alert-critical"
                onClick={handleStopRecording}
              >
                <Square className="w-12 h-12 text-alert-critical fill-alert-critical" />
              </Button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Dialog open={isMarkIncidentOpen} onOpenChange={setIsMarkIncidentOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-16 gap-2"
                  disabled={!isRecording}
                >
                  <AlertTriangle className="w-5 h-5 text-alert-caution" />
                  Mark Incident
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark Incident</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMarkIncident} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Incident Title</Label>
                    <Input name="title" placeholder="Brief description" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assault">Assault</SelectItem>
                        <SelectItem value="theft">Theft</SelectItem>
                        <SelectItem value="trespass">Trespass</SelectItem>
                        <SelectItem value="vandalism">Vandalism</SelectItem>
                        <SelectItem value="dispute">Dispute</SelectItem>
                        <SelectItem value="arrest">Arrest</SelectItem>
                        <SelectItem value="safety">Safety Violation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea name="description" placeholder="Detailed description..." rows={3} />
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Timestamp: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Location: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                    </p>
                  </div>
                  <Button type="submit" className="w-full">
                    <Tag className="w-4 h-4 mr-2" />
                    Mark Incident
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-16 gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Clips
                  {pendingUploads.filter(u => u.status === 'pending').length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingUploads.filter(u => u.status === 'pending').length}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Pending Uploads</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {pendingUploads.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No pending uploads</p>
                      </div>
                    ) : (
                      pendingUploads.map((upload) => (
                        <Card key={upload.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{upload.id}</p>
                              <p className="text-xs text-muted-foreground">
                                Duration: {formatDuration(upload.duration)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(upload.startTime, 'MMM dd, HH:mm')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {upload.status === 'pending' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleUploadClip(upload)}
                                >
                                  <Upload className="w-4 h-4" />
                                </Button>
                              )}
                              {upload.status === 'uploading' && (
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                              )}
                              {upload.status === 'uploaded' && (
                                <CheckCircle className="w-5 h-5 text-alert-normal" />
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
                {pendingUploads.filter(u => u.status === 'pending').length > 0 && (
                  <Button 
                    className="w-full mt-4"
                    onClick={() => pendingUploads.filter(u => u.status === 'pending').forEach(handleUploadClip)}
                  >
                    Upload All ({pendingUploads.filter(u => u.status === 'pending').length})
                  </Button>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Recent Recordings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="w-5 h-5" />
            Today's Recordings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: 'REC-001', time: '08:15', duration: '02:34:12', incidents: 2, status: 'uploaded' },
              { id: 'REC-002', time: '10:45', duration: '01:15:33', incidents: 0, status: 'uploaded' },
              { id: 'REC-003', time: '14:00', duration: '00:45:20', incidents: 1, status: 'pending' },
            ].map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{rec.id}</p>
                    <p className="text-xs text-muted-foreground">Started {rec.time} • {rec.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {rec.incidents > 0 && (
                    <Badge variant="secondary" className="bg-alert-caution/20 text-alert-caution">
                      {rec.incidents} incidents
                    </Badge>
                  )}
                  <Badge variant={rec.status === 'uploaded' ? 'default' : 'secondary'}>
                    {rec.status === 'uploaded' ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Uploaded</>
                    ) : (
                      'Pending'
                    )}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfficerBodyCamApp;
