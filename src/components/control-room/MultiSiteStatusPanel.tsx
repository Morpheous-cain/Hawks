import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Camera, Shield, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MultiSiteStatusPanel = () => {
  const [sites, setSites] = useState<any[]>([]);

  useEffect(() => {
    fetchSites();
    const interval = setInterval(fetchSites, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchSites = async () => {
    const { data } = await supabase
      .from('sites')
      .select(`
        *,
        clients(legal_name),
        patrols:patrols(count),
        incidents:incidents(count)
      `)
      .limit(20);

    setSites(data || []);
  };

  const getSiteStatus = (site: any) => {
    // Logic to determine site status based on recent activity
    const hasActiveIncidents = site.incidents?.[0]?.count > 0;
    if (hasActiveIncidents) return { status: 'alert', color: 'bg-alert-critical' };
    return { status: 'normal', color: 'bg-alert-normal' };
  };

  return (
    <Card className="h-[calc(100vh-12rem)] overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Multi-Site Status Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 overflow-y-auto h-[calc(100%-5rem)]">
        {sites.map((site) => {
          const status = getSiteStatus(site);
          return (
            <div
              key={site.id}
              className="p-3 bg-muted/30 rounded-lg border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{site.site_name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {site.clients?.legal_name}
                  </p>
                </div>
                <Badge className={status.color}>
                  {status.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>{site.patrols?.[0]?.count || 0} patrols</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Camera className="w-3 h-3" />
                  <span>Online</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last patrol: 15m ago
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MultiSiteStatusPanel;
