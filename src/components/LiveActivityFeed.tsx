import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Car, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Activity {
  id: string;
  type: 'alarm' | 'sos' | 'patrol' | 'vehicle' | 'checkpoint';
  title: string;
  description: string;
  timestamp: Date;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  location?: string;
}

export const LiveActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'alarm',
      title: 'Alarm Triggered',
      description: 'Motion detected at Freedom Airline - Gate 3',
      timestamp: new Date(),
      priority: 'critical',
      location: 'JKIA Terminal 1',
    },
    {
      id: '2',
      type: 'patrol',
      title: 'Patrol Started',
      description: 'Unit MPT-2025-0042 began route verification',
      timestamp: new Date(Date.now() - 120000),
      priority: 'medium',
      location: 'Westlands Route',
    },
    {
      id: '3',
      type: 'vehicle',
      title: 'Vehicle Dispatch',
      description: 'Unit V-247 dispatched to alarm location',
      timestamp: new Date(Date.now() - 180000),
      priority: 'high',
      location: 'CBD Zone',
    },
  ]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'alarm':
        return <AlertTriangle className="w-4 h-4" />;
      case 'sos':
        return <Shield className="w-4 h-4" />;
      case 'patrol':
      case 'checkpoint':
        return <MapPin className="w-4 h-4" />;
      case 'vehicle':
        return <Car className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-alert-critical/20 text-alert-critical border-alert-critical/40';
      case 'high':
        return 'bg-alert-caution/20 text-alert-caution border-alert-caution/40';
      case 'medium':
        return 'bg-primary/20 text-primary border-primary/40';
      default:
        return 'bg-muted/20 text-muted-foreground border-border/40';
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: ['alarm', 'patrol', 'vehicle', 'checkpoint'][Math.floor(Math.random() * 4)] as Activity['type'],
        title: ['New Checkpoint Verified', 'Patrol Update', 'Vehicle Status Change', 'Alarm Cleared'][Math.floor(Math.random() * 4)],
        description: 'System event - automated update',
        timestamp: new Date(),
        priority: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as Activity['priority'],
        location: ['Westlands', 'CBD', 'JKIA', 'Thika Road'][Math.floor(Math.random() * 4)],
      };

      setActivities((prev) => [newActivity, ...prev].slice(0, 50));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-card/80 backdrop-blur-xl border-2 border-border/50 shadow-glow">
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse pulse-glow" />
          Live Activity Feed
          <Badge variant="outline" className="ml-auto bg-primary/20 text-primary border-primary/40">
            {activities.length} Events
          </Badge>
        </h3>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="p-4 space-y-3">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`
                p-3 rounded-lg border-2 bg-card/40 backdrop-blur-sm
                transition-all duration-300 hover:shadow-glow hover:border-primary/50
                ${index === 0 ? 'animate-fade-in border-primary/40' : 'border-border/30'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-lg
                  ${activity.priority === 'critical' ? 'bg-alert-critical/20 text-alert-critical' : 
                    activity.priority === 'high' ? 'bg-alert-caution/20 text-alert-caution' : 
                    'bg-primary/20 text-primary'}
                `}>
                  {getActivityIcon(activity.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm">
                      {activity.title}
                    </span>
                    {activity.priority && (
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0 ${getPriorityColor(activity.priority)}`}
                      >
                        {activity.priority.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs font-medium text-foreground/80 mb-2">
                    {activity.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs font-medium text-foreground/80">
                    {activity.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {activity.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(activity.timestamp, 'HH:mm:ss')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
