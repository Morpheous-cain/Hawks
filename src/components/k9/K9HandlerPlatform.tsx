import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dog, MapPin, Clock, CheckCircle2, AlertTriangle, 
  Play, Square, MessageSquare, Heart, Calendar,
  Thermometer, Droplets, Activity, FileText, Send,
  Navigation, Phone, Radio, Shield, Syringe
} from "lucide-react";
import { toast } from "sonner";

// Demo handler info
const handlerInfo = {
  name: "John Kamau",
  employeeId: "BH-K9-001",
  k9Partner: {
    name: "Rex",
    k9Id: "K9-001",
    breed: "German Shepherd",
    specialty: "Explosives Detection",
    age: "4 years",
    weight: "38 kg",
    healthStatus: "excellent",
    lastVetCheck: "2025-11-15",
    nextVetCheck: "2025-12-15",
    vaccinations: "Up to date",
    certifications: ["Explosives Detection", "Building Search", "Vehicle Search"]
  },
  currentZone: "JKIA Terminal 1",
  shift: "Day Shift (06:00 - 18:00)",
  status: "on_patrol"
};

// Demo deployment instructions
const deploymentInstructions = [
  {
    id: "1",
    type: "sweep",
    priority: "critical",
    location: "JKIA Terminal 1 - Departure Hall",
    description: "Pre-flight security sweep for VIP departure. Clear all areas before 14:00.",
    assignedAt: "2025-01-10T11:30:00Z",
    deadline: "2025-01-10T14:00:00Z",
    status: "in_progress",
    dispatcher: "Control Room",
    notes: "VIP delegation departing at 15:00. Coordinate with airport security."
  },
  {
    id: "2",
    type: "patrol",
    priority: "high",
    location: "Two Rivers Mall - Ground Floor",
    description: "Routine patrol and detection sweep of commercial areas.",
    assignedAt: "2025-01-10T08:00:00Z",
    deadline: "2025-01-10T12:00:00Z",
    status: "pending",
    dispatcher: "Operations Center",
    notes: "Focus on entry points and storage areas."
  },
  {
    id: "3",
    type: "search",
    priority: "medium",
    location: "Westgate Mall - Parking Level B2",
    description: "Suspicious vehicle reported. Conduct thorough search.",
    assignedAt: "2025-01-10T09:15:00Z",
    deadline: "2025-01-10T11:00:00Z",
    status: "completed",
    dispatcher: "Control Room",
    notes: "Blue Toyota Prado KCE 456X. Coordinate with mall security."
  },
  {
    id: "4",
    type: "event",
    priority: "high",
    location: "KICC - Main Conference Hall",
    description: "International conference security. Pre-event sweep required.",
    assignedAt: "2025-01-10T06:00:00Z",
    deadline: "2025-01-10T08:00:00Z",
    status: "completed",
    dispatcher: "Operations Center",
    notes: "500+ attendees expected. Multiple entry points to cover."
  }
];

// Demo health logs
const healthLogs = [
  { date: "2025-01-10", type: "daily_check", notes: "Normal appetite, active behavior, no signs of fatigue.", temperature: "38.5°C", hydration: "Good" },
  { date: "2025-01-09", type: "daily_check", notes: "Completed 6-hour patrol. Rested well overnight.", temperature: "38.3°C", hydration: "Good" },
  { date: "2025-01-08", type: "exercise", notes: "2km training run. Good stamina and response times.", temperature: "38.6°C", hydration: "Excellent" },
  { date: "2025-01-07", type: "grooming", notes: "Full grooming session. Coat and skin healthy.", temperature: "38.4°C", hydration: "Good" }
];

export const K9HandlerPlatform = () => {
  const [activeTab, setActiveTab] = useState("instructions");
  const [instructions, setInstructions] = useState(deploymentInstructions);
  const [selectedInstruction, setSelectedInstruction] = useState<typeof deploymentInstructions[0] | null>(null);
  const [responseNote, setResponseNote] = useState("");
  const [healthNote, setHealthNote] = useState("");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-alert-critical text-primary-foreground";
      case "high": return "bg-alert-caution text-primary-foreground";
      case "medium": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sweep": return <Shield className="w-4 h-4" />;
      case "patrol": return <Navigation className="w-4 h-4" />;
      case "search": return <Dog className="w-4 h-4" />;
      case "event": return <Calendar className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-alert-normal text-primary-foreground">Completed</Badge>;
      case "in_progress": return <Badge className="bg-primary text-primary-foreground">In Progress</Badge>;
      case "pending": return <Badge className="bg-alert-caution text-primary-foreground">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStartTask = (id: string) => {
    setInstructions(prev => prev.map(inst => 
      inst.id === id ? { ...inst, status: "in_progress" } : inst
    ));
    toast.success("Deployment started - GPS tracking active");
  };

  const handleCompleteTask = (id: string) => {
    setInstructions(prev => prev.map(inst => 
      inst.id === id ? { ...inst, status: "completed" } : inst
    ));
    toast.success("Deployment completed and logged");
  };

  const handleSendResponse = () => {
    if (!responseNote.trim()) return;
    toast.success("Response sent to dispatcher");
    setResponseNote("");
  };

  const handleLogHealth = () => {
    if (!healthNote.trim()) return;
    toast.success("Health observation logged");
    setHealthNote("");
  };

  const pendingCount = instructions.filter(i => i.status === "pending").length;
  const criticalCount = instructions.filter(i => i.priority === "critical" && i.status !== "completed").length;

  return (
    <div className="space-y-4">
      {/* Handler & K9 Header */}
      <Card className="p-4 border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 bg-gradient-command">
              <AvatarFallback className="text-xl font-bold text-primary-foreground">
                {handlerInfo.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold text-foreground">{handlerInfo.name}</h2>
              <p className="text-sm text-muted-foreground">{handlerInfo.employeeId}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {handlerInfo.shift}
                </Badge>
              </div>
            </div>
          </div>

          {/* K9 Partner Info */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-background/50 border border-border">
            <Avatar className="w-12 h-12 bg-primary">
              <AvatarFallback className="text-lg font-bold text-primary-foreground">
                <Dog className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">{handlerInfo.k9Partner.name}</h3>
                <Badge className="bg-alert-normal text-primary-foreground text-xs">
                  {handlerInfo.k9Partner.healthStatus}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{handlerInfo.k9Partner.k9Id} • {handlerInfo.k9Partner.breed}</p>
              <p className="text-xs text-primary font-medium">{handlerInfo.k9Partner.specialty}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">
              <MapPin className="w-3 h-3 mr-1" />
              {handlerInfo.currentZone}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Pending Tasks</p>
              <p className="text-xl font-bold text-foreground">{pendingCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-alert-critical" />
            <div>
              <p className="text-xs text-muted-foreground">Critical</p>
              <p className="text-xl font-bold text-foreground">{criticalCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-border">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-alert-normal" />
            <div>
              <p className="text-xs text-muted-foreground">K9 Health</p>
              <p className="text-xl font-bold text-foreground capitalize">{handlerInfo.k9Partner.healthStatus}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Next Vet</p>
              <p className="text-sm font-bold text-foreground">{handlerInfo.k9Partner.nextVetCheck}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="instructions" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Deployments</span>
          </TabsTrigger>
          <TabsTrigger value="k9health" className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">K9 Health</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-1">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Actions</span>
          </TabsTrigger>
          <TabsTrigger value="comms" className="flex items-center gap-1">
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">Comms</span>
          </TabsTrigger>
        </TabsList>

        {/* Deployments Tab */}
        <TabsContent value="instructions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border">
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Deployment Instructions</h3>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="p-3 space-y-3">
                  {instructions.map((inst) => (
                    <Card 
                      key={inst.id} 
                      className={`p-3 border-border cursor-pointer transition-all hover:shadow-md ${selectedInstruction?.id === inst.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedInstruction(inst)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(inst.type)}
                          <span className="text-sm font-medium text-foreground capitalize">{inst.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(inst.priority)}>
                            {inst.priority}
                          </Badge>
                          {getStatusBadge(inst.status)}
                        </div>
                      </div>
                      <p className="text-sm text-foreground mb-2">{inst.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{inst.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>Due: {new Date(inst.deadline).toLocaleTimeString()}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Selected Instruction Detail */}
            <Card className="border-border">
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Deployment Details</h3>
              </div>
              {selectedInstruction ? (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(selectedInstruction.type)}
                      <span className="font-semibold text-foreground capitalize">{selectedInstruction.type} Operation</span>
                    </div>
                    {getStatusBadge(selectedInstruction.status)}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="text-sm font-medium text-foreground">{selectedInstruction.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-foreground">{selectedInstruction.description}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm text-foreground">{selectedInstruction.notes}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Assigned</p>
                        <p className="text-sm text-foreground">{new Date(selectedInstruction.assignedAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                        <p className="text-sm text-foreground">{new Date(selectedInstruction.deadline).toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Dispatcher</p>
                      <p className="text-sm text-foreground">{selectedInstruction.dispatcher}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {selectedInstruction.status !== "completed" && (
                    <div className="flex gap-2 pt-4 border-t border-border">
                      {selectedInstruction.status === "pending" && (
                        <Button 
                          className="flex-1" 
                          onClick={() => handleStartTask(selectedInstruction.id)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Deployment
                        </Button>
                      )}
                      {selectedInstruction.status === "in_progress" && (
                        <Button 
                          className="flex-1 bg-alert-normal hover:bg-alert-normal/90" 
                          onClick={() => handleCompleteTask(selectedInstruction.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                      )}
                      <Button variant="outline" size="icon">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Response Note */}
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="Add notes or report findings..."
                      value={responseNote}
                      onChange={(e) => setResponseNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleSendResponse}
                      disabled={!responseNote.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Report
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a deployment to view details</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* K9 Health Tab */}
        <TabsContent value="k9health" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* K9 Profile */}
            <Card className="border-border">
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">K9 Profile - {handlerInfo.k9Partner.name}</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20 bg-primary">
                    <AvatarFallback className="text-3xl font-bold text-primary-foreground">
                      <Dog className="w-10 h-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-xl font-bold text-foreground">{handlerInfo.k9Partner.name}</h4>
                    <p className="text-sm text-muted-foreground">{handlerInfo.k9Partner.k9Id}</p>
                    <Badge className="bg-alert-normal text-primary-foreground mt-1">
                      {handlerInfo.k9Partner.healthStatus}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Breed</p>
                    <p className="text-sm font-medium text-foreground">{handlerInfo.k9Partner.breed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Specialty</p>
                    <p className="text-sm font-medium text-foreground">{handlerInfo.k9Partner.specialty}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="text-sm font-medium text-foreground">{handlerInfo.k9Partner.age}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="text-sm font-medium text-foreground">{handlerInfo.k9Partner.weight}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Vet Check</p>
                    <p className="text-sm font-medium text-foreground">{handlerInfo.k9Partner.lastVetCheck}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Next Vet Check</p>
                    <p className="text-sm font-medium text-foreground">{handlerInfo.k9Partner.nextVetCheck}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {handlerInfo.k9Partner.certifications.map((cert, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">{cert}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Vaccinations</p>
                  <Badge className="bg-alert-normal text-primary-foreground">
                    <Syringe className="w-3 h-3 mr-1" />
                    {handlerInfo.k9Partner.vaccinations}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Health Logs */}
            <Card className="border-border">
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Health Observations</h3>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="p-3 space-y-3">
                  {healthLogs.map((log, idx) => (
                    <Card key={idx} className="p-3 border-border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="capitalize">{log.type.replace('_', ' ')}</Badge>
                        <span className="text-xs text-muted-foreground">{log.date}</span>
                      </div>
                      <p className="text-sm text-foreground mb-2">{log.notes}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-alert-caution" />
                          <span>{log.temperature}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-primary" />
                          <span>{log.hydration}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Add Health Note */}
              <div className="p-3 border-t border-border space-y-2">
                <Textarea 
                  placeholder="Log health observation..."
                  value={healthNote}
                  onChange={(e) => setHealthNote(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleLogHealth}
                  disabled={!healthNote.trim()}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Log Observation
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.success("Area sweep started")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-primary/10">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Start Area Sweep</h4>
                <p className="text-xs text-muted-foreground">Begin detection sweep of current zone</p>
              </div>
            </Card>

            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.success("Detection alert logged")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-alert-critical/10">
                  <AlertTriangle className="w-8 h-8 text-alert-critical" />
                </div>
                <h4 className="font-semibold text-foreground">Log Detection</h4>
                <p className="text-xs text-muted-foreground">Report positive detection alert</p>
              </div>
            </Card>

            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.success("K9 break logged")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-accent/10">
                  <Square className="w-8 h-8 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground">K9 Rest Break</h4>
                <p className="text-xs text-muted-foreground">Log rest period for K9 partner</p>
              </div>
            </Card>

            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.success("Water break logged")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-primary/10">
                  <Droplets className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Water/Feed</h4>
                <p className="text-xs text-muted-foreground">Log hydration or feeding</p>
              </div>
            </Card>

            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.success("Health check logged")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-alert-normal/10">
                  <Heart className="w-8 h-8 text-alert-normal" />
                </div>
                <h4 className="font-semibold text-foreground">Health Check</h4>
                <p className="text-xs text-muted-foreground">Perform quick health assessment</p>
              </div>
            </Card>

            <Card className="p-4 border-border hover:shadow-md transition-all cursor-pointer" onClick={() => toast.success("Training session logged")}>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-accent/10">
                  <Activity className="w-8 h-8 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground">Training Exercise</h4>
                <p className="text-xs text-muted-foreground">Log training or practice session</p>
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
                <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Calling K9 Unit HQ...")}>
                  <Phone className="w-4 h-4 mr-3" />
                  K9 Unit HQ
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Calling Veterinary...")}>
                  <Phone className="w-4 h-4 mr-3" />
                  On-Call Veterinary
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Opening radio channel...")}>
                  <Radio className="w-4 h-4 mr-3" />
                  Radio Channel
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
                  onClick={() => toast.error("K9 Medical Emergency Alert Sent!")}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  K9 Medical Emergency
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => toast.error("SOS Alert Sent to Control Room!")}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Handler SOS
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast.success("Backup request sent")}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Request Backup
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
