import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, Users, MapPin, Camera, AlertTriangle, 
  Radio, Clock, Shield, Eye, RefreshCw, Zap
} from "lucide-react";
import { format } from "date-fns";

interface EventMonitoringDashboardProps {
  event: any;
  assignments?: any[];
}

const EventMonitoringDashboard = ({ event, assignments = [] }: EventMonitoringDashboardProps) => {
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, [isLive]);

  const zones = [
    { name: 'Main Entrance', status: 'normal', guards: 4, incidents: 0, crowdLevel: 65 },
    { name: 'VIP Area', status: 'normal', guards: 6, incidents: 0, crowdLevel: 30 },
    { name: 'Stage Front', status: 'caution', guards: 8, incidents: 1, crowdLevel: 85 },
    { name: 'Food Court', status: 'normal', guards: 2, incidents: 0, crowdLevel: 45 },
    { name: 'Parking A', status: 'normal', guards: 2, incidents: 0, crowdLevel: 70 },
    { name: 'Exit Gates', status: 'normal', guards: 3, incidents: 0, crowdLevel: 20 },
  ];

  const recentActivity = [
    { time: '14:32', type: 'patrol', message: 'Patrol completed at Section B', status: 'success' },
    { time: '14:28', type: 'alert', message: 'Crowd density warning at Stage Front', status: 'warning' },
    { time: '14:25', type: 'checkin', message: 'Guard check-in: John Kamau at Gate A', status: 'info' },
    { time: '14:20', type: 'incident', message: 'Minor medical assistance provided', status: 'resolved' },
    { time: '14:15', type: 'comm', message: 'VIP escort team in position', status: 'success' },
  ];

  const getZoneStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-alert-critical/20 border-alert-critical text-alert-critical';
      case 'caution': return 'bg-alert-caution/20 border-alert-caution text-alert-caution';
      default: return 'bg-alert-normal/20 border-alert-normal text-alert-normal';
    }
  };

  const getCrowdColor = (level: number) => {
    if (level >= 80) return 'bg-alert-critical';
    if (level >= 60) return 'bg-alert-caution';
    return 'bg-alert-normal';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'patrol': return <Shield className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'checkin': return <Users className="w-4 h-4" />;
      case 'incident': return <Zap className="w-4 h-4" />;
      case 'comm': return <Radio className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-amber-500';
      case 'resolved': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Status Header */}
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                <span className="font-semibold">{isLive ? 'LIVE MONITORING' : 'PAUSED'}</span>
              </div>
              <Badge variant="secondary">
                Last update: {format(lastUpdate, 'HH:mm:ss')}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? 'Pause' : 'Resume'}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Guards Active</p>
              <p className="text-xl font-bold">{event?.staff_assigned || zones.reduce((a, z) => a + z.guards, 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Camera className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CCTV Active</p>
              <p className="text-xl font-bold">12/12</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <MapPin className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Zones Covered</p>
              <p className="text-xl font-bold">{zones.length}/{zones.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Crowd Avg</p>
              <p className="text-xl font-bold">{Math.round(zones.reduce((a, z) => a + z.crowdLevel, 0) / zones.length)}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Alerts</p>
              <p className="text-xl font-bold">{zones.filter(z => z.status !== 'normal').length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Status */}
        <Card className="lg:col-span-2 bg-card/50 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Zone Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {zones.map((zone, i) => (
                <Card 
                  key={i} 
                  className={`p-4 border ${getZoneStatusColor(zone.status)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-sm">{zone.name}</h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {zone.status}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Guards</span>
                      <span className="font-medium">{zone.guards}</span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Crowd</span>
                        <span className="font-medium">{zone.crowdLevel}%</span>
                      </div>
                      <Progress 
                        value={zone.crowdLevel} 
                        className={`h-2 ${getCrowdColor(zone.crowdLevel)}`} 
                      />
                    </div>
                    {zone.incidents > 0 && (
                      <Badge className="bg-amber-500/20 text-amber-500 w-full justify-center">
                        {zone.incidents} Active Incident
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-3">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-1.5 rounded-lg bg-muted ${getActivityColor(activity.status)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* CCTV Preview Grid */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              CCTV Live Preview
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="w-4 h-4" />
              Full View
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Main Entrance', 'VIP Lounge', 'Stage Area', 'Parking Lot'].map((cam, i) => (
              <div key={i} className="relative aspect-video rounded-lg bg-muted overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{cam}</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventMonitoringDashboard;
