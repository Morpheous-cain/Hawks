import { Card, CardContent } from '@/components/ui/card';
import { Activity, CheckCircle, Clock, AlertTriangle, Users, MapPin } from 'lucide-react';
import { statusColors } from '@/lib/colors';

interface LiveStatusSummaryProps {
  activePatrols: number;
  checkpointsVerified: number;
  delayedCheckpoints: number;
  missedCheckpoints: number;
  supervisorsOnPatrol: number;
  sitesUnderSupervision: number;
}

const LiveStatusSummary = ({
  activePatrols,
  checkpointsVerified,
  delayedCheckpoints,
  missedCheckpoints,
  supervisorsOnPatrol,
  sitesUnderSupervision,
}: LiveStatusSummaryProps) => {
  const stats = [
    {
      label: 'Active Patrols',
      value: activePatrols,
      icon: Activity,
      colorKey: 'active' as const,
    },
    {
      label: 'Checkpoints Verified (60 mins)',
      value: checkpointsVerified,
      icon: CheckCircle,
      colorKey: 'verified' as const,
    },
    {
      label: 'Delayed Checkpoints',
      value: delayedCheckpoints,
      icon: Clock,
      colorKey: 'delayed' as const,
    },
    {
      label: 'Missed Checkpoints',
      value: missedCheckpoints,
      icon: AlertTriangle,
      colorKey: 'missed' as const,
    },
    {
      label: 'Supervisors on Patrol',
      value: supervisorsOnPatrol,
      icon: Users,
      colorKey: 'on_patrol' as const,
    },
    {
      label: 'Sites Under Supervision',
      value: sitesUnderSupervision,
      icon: MapPin,
      colorKey: 'active' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {stats.map((stat) => {
        const colors = statusColors[stat.colorKey];
        return (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <stat.icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-foreground/90 font-semibold">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LiveStatusSummary;
