import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Camera, 
  AlertTriangle, 
  Radio, 
  Activity, 
  Monitor,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

const ClientControlRoomMode = () => {
  const clientSites = [
    { id: "SITE-001", name: "Main Building - Ground Floor", cameras: 12, status: "active" },
    { id: "SITE-002", name: "Main Building - First Floor", cameras: 8, status: "active" },
    { id: "SITE-003", name: "Parking Area", cameras: 6, status: "active" },
    { id: "SITE-004", name: "Perimeter - North", cameras: 4, status: "maintenance" },
  ];

  const localIncidents = [
    { 
      id: "INC-001", 
      time: "14:23", 
      zone: "Main Entrance", 
      camera: "CAM-001",
      category: "Loitering", 
      severity: "medium",
      status: "in_progress",
      response: "Guard deployed"
    },
    { 
      id: "INC-002", 
      time: "13:45", 
      zone: "Parking Lot B", 
      camera: "CAM-012",
      category: "Suspicious Vehicle", 
      severity: "high",
      status: "escalated",
      response: "HQ notified"
    },
  ];

  const systemHealth = [
    { camera: "CAM-001", status: "online", location: "Main Entrance" },
    { camera: "CAM-007", status: "offline", location: "Loading Bay" },
    { camera: "CAM-012", status: "online", location: "Parking B" },
    { camera: "CAM-015", status: "degraded", location: "Perimeter North" },
  ];

  return (
    <div className="space-y-6">
      {/* Client Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-alert-normal/20">
              <Camera className="w-5 h-5 text-alert-normal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Cameras</p>
              <p className="text-2xl font-bold text-foreground">28/30</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-alert-caution/20">
              <AlertTriangle className="w-5 h-5 text-alert-caution" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Incidents</p>
              <p className="text-2xl font-bold text-foreground">7</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-alert-normal/20">
              <Activity className="w-5 h-5 text-alert-normal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Risk Status</p>
              <p className="text-lg font-bold text-alert-normal">Normal</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold text-foreground">4.2m</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList>
          <TabsTrigger value="live">Live Wall</TabsTrigger>
          <TabsTrigger value="incidents">Incident Board</TabsTrigger>
          <TabsTrigger value="radio">Radio & Comms</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm">Entry Points</Button>
            <Button variant="outline" size="sm">Cash Areas</Button>
            <Button variant="outline" size="sm">Loading Zones</Button>
            <Button variant="outline" size="sm">Parking</Button>
            <Button variant="outline" size="sm">Critical Rooms</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {clientSites.map((site) => (
              <Card key={site.id} className="overflow-hidden border-border">
                <div className="relative aspect-video bg-muted/30 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-muted-foreground/50" />
                  <div className="absolute top-2 right-2">
                    <Badge className={site.status === "active" ? "bg-alert-normal" : "bg-alert-caution"}>
                      {site.status === "active" ? "LIVE" : "OFFLINE"}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm text-foreground">{site.id}</p>
                  <p className="text-xs text-muted-foreground mt-1">{site.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{site.cameras} cameras</p>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="secondary" className="flex-1">
                      <Monitor className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="secondary" className="flex-1">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Flag
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Local Incident Board</h3>
            <Button size="sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Create Incident
            </Button>
          </div>

          <div className="space-y-2">
            {localIncidents.map((incident) => (
              <Card key={incident.id} className="p-4 border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant={incident.severity === "high" ? "destructive" : "secondary"}>
                      {incident.severity.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium text-foreground">{incident.id} - {incident.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {incident.time} • {incident.zone} • {incident.camera}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{incident.response}</Badge>
                    <Button size="sm" variant="destructive">
                      Escalate to HQ SOC
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="radio" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-border">
              <div className="flex items-center gap-3 mb-4">
                <Radio className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Site Security Channel</h3>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  Dispatch Guard to Zone A
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Radio className="w-4 h-4 mr-2" />
                  Call Supervisor
                </Button>
              </div>
            </Card>

            <Card className="p-4 border-border">
              <div className="flex items-center gap-3 mb-4">
                <Phone className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">HQ SOC Line</h3>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Request Backup
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="w-4 h-4 mr-2" />
                  Direct Call to Control Room
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">System Health Monitor</h3>
          <div className="space-y-2">
            {systemHealth.map((item) => (
              <Card key={item.camera} className="p-4 border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{item.camera}</p>
                      <p className="text-sm text-muted-foreground">{item.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "online" && (
                      <Badge className="bg-alert-normal">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Online
                      </Badge>
                    )}
                    {item.status === "offline" && (
                      <Badge className="bg-alert-critical">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Offline
                      </Badge>
                    )}
                    {item.status === "degraded" && (
                      <Badge className="bg-alert-caution">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Degraded
                      </Badge>
                    )}
                    <Button size="sm" variant="outline">Report Issue</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientControlRoomMode;
