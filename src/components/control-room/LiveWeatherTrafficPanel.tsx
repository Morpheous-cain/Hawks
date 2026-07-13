import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cloud, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LiveWeatherTrafficPanel = () => {
  const [advisories, setAdvisories] = useState<any[]>([]);

  useEffect(() => {
    fetchAdvisories();
    const interval = setInterval(fetchAdvisories, 120000);

    // Realtime subscription
    const channel = supabase
      .channel('live-weather-traffic')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'strategic_advisories' }, () => {
        fetchAdvisories();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAdvisories = async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('strategic_advisories')
      .select('*')
      .in('category', ['Traffic', 'Weather'])
      .gte('timestamp_detected', cutoff)
      .order('timestamp_detected', { ascending: false })
      .limit(10);

    setAdvisories(data || []);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-alert-critical';
      case 'CAUTION': return 'bg-alert-caution';
      default: return 'bg-alert-normal';
    }
  };

  const trafficAdvisories = advisories.filter(a => a.category === 'Traffic');
  const weatherAdvisories = advisories.filter(a => a.category === 'Weather');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Traffic Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Car className="w-4 h-4" />
            Traffic Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {trafficAdvisories.length === 0 ? (
            <p className="text-xs text-muted-foreground">No traffic alerts</p>
          ) : (
            trafficAdvisories.slice(0, 5).map((advisory) => (
              <div
                key={advisory.id}
                className="p-2 bg-muted/30 rounded-lg border-l-4 border-primary/50"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-medium flex-1">{advisory.title}</p>
                  <Badge className={getSeverityColor(advisory.severity)}>
                    {advisory.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(advisory.timestamp_detected).toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Weather & Safety */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Weather & Safety
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {weatherAdvisories.length === 0 ? (
            <p className="text-xs text-muted-foreground">No weather alerts</p>
          ) : (
            weatherAdvisories.slice(0, 5).map((advisory) => (
              <div
                key={advisory.id}
                className="p-2 bg-muted/30 rounded-lg border-l-4 border-primary/50"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-medium flex-1">{advisory.title}</p>
                  <Badge className={getSeverityColor(advisory.severity)}>
                    {advisory.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(advisory.timestamp_detected).toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi' })}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveWeatherTrafficPanel;
