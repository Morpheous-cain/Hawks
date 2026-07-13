import React, { useState, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Bell,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Phone,
  Radio,
  Car,
  Shield,
  Siren,
  Camera,
  FileText,
  Play,
  Square,
  Target,
  Users,
  Zap,
  MessageSquare,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Officer MDT Terminal — full real-data terminal (patrols, messages, incidents, checkpoints, map, SOS)
const OfficerMDTTerminal = lazy(() => import('@/pages/MDT'));


const MobileResponseOfficerPlatform = () => {
  const [activeTab, setActiveTab] = useState('dispatch');
  const [closureNotes, setClosureNotes] = useState('');

  // Demo data - would come from Supabase in production
  const officerInfo = {
    name: 'David Ochieng',
    callSign: 'ALPHA QRF-1',
    vehicleId: 'AP-RT-01',
    status: 'available',
    zone: 'Nairobi CBD / Industrial Area',
    currentLocation: 'Jumeira Center HQ'
  };

  const activeAlarms = [
    {
      id: 'ALM-2025-001',
      type: 'Intrusion',
      priority: 'critical',
      client: 'Freedom Airlines',
      site: 'Main Office - Westlands',
      location: 'Back Perimeter Fence',
      triggeredAt: '2025-01-10T14:30:00',
      status: 'dispatched',
      slaMinutes: 10,
      gps: { lat: -1.2641, lng: 36.8034 },
      sensorId: 'SENS-042',
      notes: 'Motion sensor triggered. CCTV shows movement near loading bay.'
    },
    {
      id: 'ALM-2025-002',
      type: 'Panic',
      priority: 'high',
      client: 'KCB Bank',
      site: 'Moi Avenue Branch',
      location: 'Teller Counter 3',
      triggeredAt: '2025-01-10T14:25:00',
      status: 'en_route',
      slaMinutes: 8,
      gps: { lat: -1.2833, lng: 36.8219 },
      sensorId: 'PANIC-019',
      notes: 'Silent panic activated by teller. Police notified.'
    }
  ];

  const recentResponses = [
    {
      id: 'ALM-2025-098',
      type: 'False Alarm',
      client: 'Safaricom HQ',
      closedAt: '2025-01-10T13:45:00',
      responseTime: 8,
      outcome: 'All Clear'
    },
    {
      id: 'ALM-2025-097',
      type: 'Power Failure',
      client: 'Nation Media',
      closedAt: '2025-01-10T11:20:00',
      responseTime: 12,
      outcome: 'Technical Issue'
    }
  ];

  const teamMembers = [
    { name: 'David Ochieng', role: 'Team Leader', status: 'active' },
    { name: 'Peter Wanjiku', role: 'Response Officer', status: 'active' },
    { name: 'Grace Muthoni', role: 'Response Officer', status: 'active' },
    { name: 'James Kimani', role: 'Driver', status: 'active' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'en_route': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'on_scene': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'dispatched': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTimeSince = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  };

  const handleAccept = async (alarmId: string) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("alarm_activations")
      .update({ status: "acknowledged", acknowledged_at: new Date().toISOString(), acknowledged_by: u.user?.id })
      .eq("id", alarmId)
      .eq("status", "active");
    if (error) { toast.error(error.message); return; }
    toast.success(`Accepted alarm ${alarmId}`);
  };

  const handleEnRoute = async (alarmId: string) => {
    const { error } = await supabase
      .from("alarm_activations")
      .update({ status: "dispatched", dispatched_at: new Date().toISOString() })
      .eq("id", alarmId)
      .eq("status", "acknowledged");
    if (error) { toast.error(error.message); return; }
    toast.success(`En route to ${alarmId}`);
  };

  const handleOnScene = async (alarmId: string) => {
    const { error } = await supabase
      .from("alarm_activations")
      .update({ status: "arrived" })
      .eq("id", alarmId)
      .eq("status", "dispatched");
    if (error) { toast.error(error.message); return; }
    toast.success(`Arrived on scene — ${alarmId}`);
  };

  const handleClose = async (alarmId: string, isFalseAlarm: boolean) => {
    if (!closureNotes.trim()) {
      toast.error('Please add closure notes');
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("alarm_activations")
      .update({
        status: isFalseAlarm ? "false_alarm" : "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: u.user?.id ?? null,
        resolution_notes: closureNotes.trim(),
        false_alarm: isFalseAlarm,
      })
      .eq("id", alarmId)
      .eq("status", "arrived");
    if (error) { toast.error(error.message); return; }
    toast.success(isFalseAlarm ? `False alarm logged — ${alarmId}` : `Alarm closed — ${alarmId}`);
    setClosureNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Officer Header */}
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{officerInfo.name}</h3>
                <p className="text-sm text-muted-foreground">{officerInfo.callSign} • {officerInfo.vehicleId}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={getStatusColor(officerInfo.status)}>
                {officerInfo.status.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">{officerInfo.zone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-3 text-center">
            <Siren className="h-5 w-5 mx-auto text-red-400 mb-1" />
            <p className="text-2xl font-bold text-red-400">{activeAlarms.length}</p>
            <p className="text-xs text-muted-foreground">Active Alarms</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-amber-400 mb-1" />
            <p className="text-2xl font-bold text-amber-400">1</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-3 text-center">
            <Navigation className="h-5 w-5 mx-auto text-blue-400 mb-1" />
            <p className="text-2xl font-bold text-blue-400">1</p>
            <p className="text-xs text-muted-foreground">En Route</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-3 text-center">
            <CheckCircle className="h-5 w-5 mx-auto text-green-400 mb-1" />
            <p className="text-2xl font-bold text-green-400">{recentResponses.length}</p>
            <p className="text-xs text-muted-foreground">Closed Today</p>
          </CardContent>
        </Card>
      </div>

      {/* In-Vehicle MDT Terminal — integrated inline (not a tab) */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Monitor className="h-4 w-4 text-primary" />
            In-Vehicle MDT Terminal
            <Badge variant="outline" className="ml-auto text-[10px]">LIVE</Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Real-time patrols, dispatcher messages, incidents, checkpoints, live map & SOS — synced with Control Room.
          </p>
        </CardHeader>
        <CardContent className="p-2">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <OfficerMDTTerminal />
          </Suspense>
        </CardContent>
      </Card>

      {/* Operational Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dispatch" className="gap-1">
            <Siren className="h-3 w-3" />
            <span className="hidden sm:inline">Dispatch</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-1">
            <Zap className="h-3 w-3" />
            <span className="hidden sm:inline">Actions</span>
          </TabsTrigger>
          <TabsTrigger value="comms" className="gap-1">
            <Radio className="h-3 w-3" />
            <span className="hidden sm:inline">Comms</span>
          </TabsTrigger>
        </TabsList>


        <TabsContent value="dispatch" className="space-y-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">

              {activeAlarms.map((alarm) => (
                <Card key={alarm.id} className={`border-l-4 ${
                  alarm.priority === 'critical' ? 'border-l-red-500' : 'border-l-orange-500'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{alarm.id}</CardTitle>
                          <Badge className={getPriorityColor(alarm.priority)}>
                            {alarm.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alarm.client}</p>
                      </div>
                      <Badge className={getStatusColor(alarm.status)}>
                        {alarm.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <span>{alarm.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{getTimeSince(alarm.triggeredAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{alarm.site} - {alarm.location}</span>
                      </div>
                    </div>

                    <div className="p-2 bg-muted/50 rounded text-sm">
                      <p className="text-muted-foreground">{alarm.notes}</p>
                    </div>

                    {/* SLA Timer */}
                    <div className="flex items-center justify-between p-2 bg-red-500/10 rounded">
                      <span className="text-sm">SLA Target: {alarm.slaMinutes} mins</span>
                      <Badge variant="destructive">
                        <Clock className="h-3 w-3 mr-1" />
                        Respond Now
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {alarm.status === 'dispatched' && (
                        <>
                          <Button size="sm" onClick={() => handleAccept(alarm.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleEnRoute(alarm.id)}>
                            <Navigation className="h-4 w-4 mr-1" />
                            En Route
                          </Button>
                        </>
                      )}
                      {alarm.status === 'dispatched' && (
                        <Button size="sm" onClick={() => handleOnScene(alarm.id)}>
                          <Target className="h-4 w-4 mr-1" />
                          On Scene
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Navigation className="h-4 w-4 mr-1" />
                        Navigate
                      </Button>
                      <Button size="sm" variant="outline">
                        <Camera className="h-4 w-4 mr-1" />
                        Photo
                      </Button>
                    </div>

                    {/* Closure Section — only available once officer is on-scene (arrived) */}
                    {alarm.status === 'arrived' && (
                      <div className="space-y-2 pt-2 border-t">
                        <Textarea
                          placeholder="Enter closure notes..."
                          value={closureNotes}
                          onChange={(e) => setClosureNotes(e.target.value)}
                          className="h-20"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleClose(alarm.id, false)}
                            disabled={!closureNotes.trim()}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Close - All Clear
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleClose(alarm.id, false)}
                            disabled={!closureNotes.trim()}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Close - Incident
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Recent Responses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentResponses.map((response) => (
                      <div 
                        key={response.id} 
                        className="flex items-center justify-between p-2 bg-muted/30 rounded"
                      >
                        <div>
                          <p className="text-sm font-medium">{response.id}</p>
                          <p className="text-xs text-muted-foreground">{response.client}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {response.outcome}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {response.responseTime}m response
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                {officerInfo.callSign} Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">
                      {member.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vehicle Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded text-center">
                  <p className="text-2xl font-bold text-green-400">85%</p>
                  <p className="text-xs text-muted-foreground">Fuel Level</p>
                </div>
                <div className="p-3 bg-muted/30 rounded text-center">
                  <p className="text-2xl font-bold text-blue-400">Good</p>
                  <p className="text-xs text-muted-foreground">Condition</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button className="h-20 flex-col gap-2" variant="destructive">
              <Siren className="h-6 w-6" />
              <span>Emergency SOS</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="secondary">
              <Play className="h-6 w-6" />
              <span>Start Patrol</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Square className="h-6 w-6" />
              <span>End Patrol</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Camera className="h-6 w-6" />
              <span>Capture Evidence</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <FileText className="h-6 w-6" />
              <span>Quick Report</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline">
              <Zap className="h-6 w-6" />
              <span>Request Backup</span>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Equipment Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Radio', 'Torch', 'First Aid Kit', 'Restraints', 'Body Cam'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Radio className="h-4 w-4 mr-2" />
                Control Room - Channel 1
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                SOC Direct Line
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                ALPHA QRF-2 (Backup)
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Operations Manager
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Control Room</span>
                    <span className="text-xs text-muted-foreground">2m ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    New alarm at KCB Moi Ave. You are nearest unit.
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Operations</span>
                    <span className="text-xs text-muted-foreground">15m ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Zone coverage update: ALPHA-2 covering Westlands until 1800hrs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-500/30">
            <CardHeader>
              <CardTitle className="text-sm text-red-400">Emergency Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="destructive">
                <Siren className="h-4 w-4 mr-2" />
                Trigger SOS Alert
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call Police Emergency
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileResponseOfficerPlatform;
