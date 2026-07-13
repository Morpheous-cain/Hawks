import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Car, MapPin, Clock, CheckCircle2, AlertTriangle, 
  Play, Square, MessageSquare, Navigation, Shield,
  Phone, Radio, Users, Route, Flag, Send, Eye,
  Fuel, MapPinned, Timer, UserCheck, Zap
} from "lucide-react";
import { toast } from "sonner";

// Demo officer info
const officerInfo = {
  name: "LT Wanjiru Akinyi",
  employeeId: "BH-VIP-001",
  role: "Lead Escort Officer",
  currentMission: {
    id: "ESC-2025-042",
    client: "Hon. Cabinet Secretary",
    priority: "critical",
    status: "in_transit"
  },
  vehicle: {
    callSign: "ALPHA-LEAD-1",
    registration: "GK A 001A",
    type: "Toyota Land Cruiser V8"
  },
  shift: "Day Shift (06:00 - 18:00)",
  teamSize: 12
};

// Demo missions
const missions = [
  {
    id: "ESC-2025-042",
    priority: "critical",
    client: "Hon. Cabinet Secretary",
    routeStart: "State House",
    routeEnd: "JKIA Terminal 3",
    scheduledTime: "2025-01-10T14:00:00Z",
    status: "in_transit",
    vehicles: 5,
    officers: 12,
    eta: "18 mins",
    distance: "24.5 km",
    checkpoints: [
      { name: "State House Gate", status: "passed", time: "14:02" },
      { name: "Uhuru Highway Junction", status: "passed", time: "14:08" },
      { name: "Mombasa Road Entry", status: "current", time: null },
      { name: "JKIA Checkpoint", status: "pending", time: null },
      { name: "Terminal 3 VIP Entry", status: "pending", time: null }
    ],
    notes: "VIP departure at 15:00. Coordinate with airport security. Alternative route via Southern Bypass if traffic."
  },
  {
    id: "ESC-2025-043",
    priority: "high",
    client: "CEO - Banking Corporation",
    routeStart: "Westlands Office",
    routeEnd: "Two Rivers Mall",
    scheduledTime: "2025-01-10T16:00:00Z",
    status: "scheduled",
    vehicles: 3,
    officers: 6,
    eta: "Ready",
    distance: "8.2 km",
    checkpoints: [
      { name: "Westlands Pickup", status: "pending", time: null },
      { name: "Waiyaki Way", status: "pending", time: null },
      { name: "Two Rivers Entry", status: "pending", time: null }
    ],
    notes: "Client meeting at 16:30. Pre-clear parking at Two Rivers VIP area."
  },
  {
    id: "ESC-2025-040",
    priority: "medium",
    client: "Ambassador - EU Delegation",
    routeStart: "UN Complex",
    routeEnd: "Diplomatic Quarter",
    scheduledTime: "2025-01-10T10:00:00Z",
    status: "completed",
    vehicles: 4,
    officers: 8,
    eta: "Completed",
    distance: "12.1 km",
    checkpoints: [
      { name: "UN Complex Gate", status: "passed", time: "10:02" },
      { name: "Limuru Road", status: "passed", time: "10:15" },
      { name: "Diplomatic Quarter", status: "passed", time: "10:28" }
    ],
    notes: "Completed without incident."
  }
];

// Demo convoy team
const convoyTeam = [
  { id: "1", name: "SGT Kamau P.", role: "Lead Driver", vehicle: "ALPHA-LEAD-1", status: "active" },
  { id: "2", name: "CPL Omondi J.", role: "Close Protection", vehicle: "ALPHA-LEAD-1", status: "active" },
  { id: "3", name: "CPL Mwangi S.", role: "Advance Scout", vehicle: "ALPHA-SCOUT-1", status: "active" },
  { id: "4", name: "SGT Njoroge K.", role: "Tail Vehicle", vehicle: "ALPHA-TAIL-1", status: "active" },
  { id: "5", name: "CPL Wekesa B.", role: "Support Officer", vehicle: "ALPHA-SUP-1", status: "active" },
  { id: "6", name: "PVT Otieno R.", role: "Outrider", vehicle: "ALPHA-BIKE-1", status: "active" }
];

export const EscortOfficerPlatform = () => {
  const [activeTab, setActiveTab] = useState("missions");
  const [selectedMission, setSelectedMission] = useState<typeof missions[0] | null>(missions[0]);
  const [responseNote, setResponseNote] = useState("");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-alert-critical text-primary-foreground";
      case "high": return "bg-alert-caution text-primary-foreground";
      case "medium": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-alert-normal text-primary-foreground">Completed</Badge>;
      case "in_transit": return <Badge className="bg-primary text-primary-foreground animate-pulse">In Transit</Badge>;
      case "scheduled": return <Badge className="bg-accent text-accent-foreground">Scheduled</Badge>;
      case "standby": return <Badge className="bg-alert-caution text-primary-foreground">Standby</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCheckpointStatus = (status: string) => {
    switch (status) {
      case "passed": return <CheckCircle2 className="w-4 h-4 text-alert-normal" />;
      case "current": return <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />;
      case "pending": return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />;
      default: return null;
    }
  };

  const handleStartMission = (id: string) => {
    toast.success("Mission started - GPS tracking active");
  };

  const handleCompleteMission = (id: string) => {
    toast.success("Mission completed and logged");
  };

  const handleCheckpointPass = (checkpoint: string) => {
    toast.success(`Checkpoint "${checkpoint}" marked as passed`);
  };

  const handleSendUpdate = () => {
    if (!responseNote.trim()) return;
    toast.success("Update sent to Control Room");
    setResponseNote("");
  };

  const activeMissions = missions.filter(m => m.status !== "completed").length;
  const criticalMissions = missions.filter(m => m.priority === "critical" && m.status !== "completed").length;

  return (
    <div className="space-y-4">
      {/* Officer & Vehicle Header */}
      <Card className="p-4 border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 bg-gradient-command">
              <AvatarFallback className="text-xl font-bold text-primary-foreground">
                {officerInfo.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold text-foreground">{officerInfo.name}</h2>
              <p className="text-sm text-muted-foreground">{officerInfo.employeeId} • {officerInfo.role}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {officerInfo.shift}
                </Badge>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-background/50 border border-border">
            <Car className="w-10 h-10 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">{officerInfo.vehicle.callSign}</h3>
                <Badge className="bg-alert-normal text-primary-foreground text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{officerInfo.vehicle.registration}</p>
              <p className="text-xs text-primary font-medium">{officerInfo.vehicle.type}</p>
            </div>
          </div>

          {/* Current Mission Badge */}
          {officerInfo.currentMission && (
            <Badge className={`${getPriorityColor(officerInfo.currentMission.priority)} text-sm py-1 px-3`}>
              <Shield className="w-4 h-4 mr-2" />
              {officerInfo.currentMission.id}
            </Badge>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 border-border">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Active Missions</p>
              <p className="text-xl font-bold text-foreground">{activeMissions}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-alert-critical" />
            <div>
              <p className="text-xs text-muted-foreground">Critical</p>
              <p className="text-xl font-bold text-foreground">{criticalMissions}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Team Size</p>
              <p className="text-xl font-bold text-foreground">{officerInfo.teamSize}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-border">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-alert-caution" />
            <div>
              <p className="text-xs text-muted-foreground">Current ETA</p>
              <p className="text-xl font-bold text-foreground">{selectedMission?.eta || "N/A"}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="missions" className="flex items-center gap-1">
            <Route className="w-4 h-4" />
            <span className="hidden sm:inline">Missions</span>
          </TabsTrigger>
          <TabsTrigger value="convoy" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Convoy</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Actions</span>
          </TabsTrigger>
          <TabsTrigger value="comms" className="flex items-center gap-1">
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">Comms</span>
          </TabsTrigger>
        </TabsList>

        {/* Missions Tab */}
        <TabsContent value="missions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border">
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Escort Missions</h3>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="p-3 space-y-3">
                  {missions.map((mission) => (
                    <Card 
                      key={mission.id} 
                      className={`p-3 border-border cursor-pointer transition-all hover:shadow-md ${selectedMission?.id === mission.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedMission(mission)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">{mission.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(mission.priority)}>
                            {mission.priority}
                          </Badge>
                          {getStatusBadge(mission.status)}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-2">{mission.client}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Navigation className="w-3 h-3" />
                        <span>{mission.routeStart} → {mission.routeEnd}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>{mission.vehicles} vehicles</span>
                        <span>{mission.officers} officers</span>
                        <span>{mission.distance}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Selected Mission Detail */}
            <Card className="border-border">
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Mission Details</h3>
              </div>
              {selectedMission ? (
                <ScrollArea className="h-[400px]">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-foreground">{selectedMission.id}</span>
                      </div>
                      {getStatusBadge(selectedMission.status)}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">VIP Client</p>
                        <p className="text-sm font-bold text-foreground">{selectedMission.client}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">From</p>
                          <p className="text-sm font-medium text-foreground">{selectedMission.routeStart}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">To</p>
                          <p className="text-sm font-medium text-foreground">{selectedMission.routeEnd}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Vehicles</p>
                          <p className="text-sm text-foreground">{selectedMission.vehicles}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Officers</p>
                          <p className="text-sm text-foreground">{selectedMission.officers}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">ETA</p>
                          <p className="text-sm font-bold text-foreground">{selectedMission.eta}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm text-foreground">{selectedMission.notes}</p>
                      </div>
                    </div>

                    {/* Checkpoints */}
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-3">Route Checkpoints</p>
                      <div className="space-y-2">
                        {selectedMission.checkpoints.map((cp, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <div className="flex items-center gap-3">
                              {getCheckpointStatus(cp.status)}
                              <span className={`text-sm ${cp.status === 'current' ? 'font-bold text-primary' : 'text-foreground'}`}>
                                {cp.name}
                              </span>
                            </div>
                            {cp.time && <span className="text-xs text-muted-foreground">{cp.time}</span>}
                            {cp.status === 'current' && selectedMission.status === 'in_transit' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 text-xs"
                                onClick={() => handleCheckpointPass(cp.name)}
                              >
                                Pass
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {selectedMission.status !== "completed" && (
                      <div className="flex gap-2 pt-4 border-t border-border">
                        {selectedMission.status === "scheduled" && (
                          <Button 
                            className="flex-1" 
                            onClick={() => handleStartMission(selectedMission.id)}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Mission
                          </Button>
                        )}
                        {selectedMission.status === "in_transit" && (
                          <Button 
                            className="flex-1 bg-alert-normal hover:bg-alert-normal/90" 
                            onClick={() => handleCompleteMission(selectedMission.id)}
                          >
                            <Flag className="w-4 h-4 mr-2" />
                            Complete Mission
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Update Note */}
                    <div className="space-y-2">
                      <Textarea 
                        placeholder="Send status update to Control Room..."
                        value={responseNote}
                        onChange={(e) => setResponseNote(e.target.value)}
                        className="min-h-[60px]"
                      />
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleSendUpdate}
                        disabled={!responseNote.trim()}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send Update
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Route className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a mission to view details</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Convoy Tab */}
        <TabsContent value="convoy" className="space-y-4">
          <Card className="border-border">
            <div className="p-3 border-b border-border">
              <h3 className="font-semibold text-foreground">Convoy Team - {selectedMission?.id || "No Active Mission"}</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {convoyTeam.map((member) => (
                  <Card key={member.id} className="p-3 border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 bg-primary">
                        <AvatarFallback className="text-sm font-bold text-primary-foreground">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground text-sm">{member.name}</p>
                          <Badge className="bg-alert-normal text-primary-foreground text-xs">{member.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                        <p className="text-xs text-primary font-medium">{member.vehicle}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>

          {/* Convoy Formation */}
          <Card className="border-border">
            <div className="p-3 border-b border-border">
              <h3 className="font-semibold text-foreground">Convoy Formation</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-center gap-4 py-8">
                <div className="text-center">
                  <div className="w-12 h-8 bg-accent rounded flex items-center justify-center mb-1">
                    <Car className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Scout</p>
                </div>
                <div className="w-8 border-t-2 border-dashed border-muted-foreground" />
                <div className="text-center">
                  <div className="w-14 h-10 bg-primary rounded flex items-center justify-center mb-1">
                    <Shield className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">VIP</p>
                </div>
                <div className="w-8 border-t-2 border-dashed border-muted-foreground" />
                <div className="text-center">
                  <div className="w-12 h-8 bg-primary/70 rounded flex items-center justify-center mb-1">
                    <Car className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Close Protection</p>
                </div>
                <div className="w-8 border-t-2 border-dashed border-muted-foreground" />
                <div className="text-center">
                  <div className="w-12 h-8 bg-muted rounded flex items-center justify-center mb-1">
                    <Car className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Tail</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.success("Route recalculation requested")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-primary/10">
                  <Navigation className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Recalculate Route</h4>
                <p className="text-xs text-muted-foreground">Find alternative path</p>
              </div>
            </Card>

            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.error("Emergency alert sent!")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-alert-critical/10">
                  <AlertTriangle className="w-8 h-8 text-alert-critical" />
                </div>
                <h4 className="font-semibold text-foreground">Emergency Alert</h4>
                <p className="text-xs text-muted-foreground">Immediate threat response</p>
              </div>
            </Card>

            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.success("Traffic advisory requested")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-alert-caution/10">
                  <Eye className="w-8 h-8 text-alert-caution" />
                </div>
                <h4 className="font-semibold text-foreground">Traffic Advisory</h4>
                <p className="text-xs text-muted-foreground">Check route conditions</p>
              </div>
            </Card>

            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.success("Fuel stop logged")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-accent/10">
                  <Fuel className="w-8 h-8 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground">Log Fuel Stop</h4>
                <p className="text-xs text-muted-foreground">Record refueling break</p>
              </div>
            </Card>

            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.success("VIP status confirmed")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-alert-normal/10">
                  <UserCheck className="w-8 h-8 text-alert-normal" />
                </div>
                <h4 className="font-semibold text-foreground">VIP Status Check</h4>
                <p className="text-xs text-muted-foreground">Confirm client welfare</p>
              </div>
            </Card>

            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.success("Position pinned")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-primary/10">
                  <MapPinned className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Pin Location</h4>
                <p className="text-xs text-muted-foreground">Mark current position</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="comms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border">
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Quick Contact</h3>
              </div>
              <div className="p-4 space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Calling Control Room...")}>
                  <Phone className="w-4 h-4 mr-3" />
                  Control Room
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Calling Advance Scout...")}>
                  <Phone className="w-4 h-4 mr-3" />
                  Advance Scout
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Calling Close Protection...")}>
                  <Phone className="w-4 h-4 mr-3" />
                  Close Protection Team
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Opening convoy radio...")}>
                  <Radio className="w-4 h-4 mr-3" />
                  Convoy Radio Channel
                </Button>
              </div>
            </Card>

            <Card className="border-border">
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Emergency Actions</h3>
              </div>
              <div className="p-4 space-y-3">
                <Button 
                  className="w-full bg-alert-critical hover:bg-alert-critical/90"
                  onClick={() => toast.error("EMERGENCY ALERT - All units notified!")}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Convoy Emergency
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => toast.error("Police assistance requested!")}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Request Police Support
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast.success("Medical support en route")}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Request Medical
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EscortOfficerPlatform;
