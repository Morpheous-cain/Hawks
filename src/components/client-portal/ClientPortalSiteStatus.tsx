import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Shield, 
  Camera, 
  Clock, 
  MapPin,
  Search,
  CheckCircle,
  AlertTriangle,
  Users,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ClientPortalSiteStatusProps {
  clientId?: string;
}

const ClientPortalSiteStatus = ({ clientId }: ClientPortalSiteStatusProps) => {
  const [sites, setSites] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchSites = useCallback(async () => {
    if (!clientId) return;
    
    try {
      const { data } = await supabase
        .from('sites')
        .select(`
          *,
          patrols:patrols(count),
          incidents:incidents(count)
        `)
        .eq('client_id', clientId);

      setSites(data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchSites();
    }
  }, [clientId, fetchSites]);

  // Real-time subscriptions
  useEffect(() => {
    if (!clientId) return;

    const sitesChannel = supabase
      .channel('client-sites-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sites' },
        () => fetchSites()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        () => fetchSites()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patrols' },
        () => fetchSites()
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(sitesChannel);
    };
  }, [clientId, fetchSites]);

  const filteredSites = sites.filter(site => 
    site.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSiteStatus = (site: any) => {
    const hasActiveIncidents = site.incidents?.[0]?.count > 0;
    if (hasActiveIncidents) {
      return { status: 'Alert', color: 'bg-alert-critical', textColor: 'text-white' };
    }
    return { status: 'Normal', color: 'bg-alert-normal', textColor: 'text-white' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading sites...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Live Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-alert-normal animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-sm text-muted-foreground">
            {isLive ? 'Live updates enabled' : 'Connecting...'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search sites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Site Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sites.length}</p>
              <p className="text-xs text-muted-foreground">Total Sites</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-alert-normal/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-alert-normal" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sites.filter(s => !s.incidents?.[0]?.count).length}</p>
              <p className="text-xs text-muted-foreground">Normal Status</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-alert-caution/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-alert-caution" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sites.filter(s => s.incidents?.[0]?.count > 0).length}</p>
              <p className="text-xs text-muted-foreground">With Incidents</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sites.length * 2}</p>
              <p className="text-xs text-muted-foreground">Officers Assigned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSites.map((site) => {
          const status = getSiteStatus(site);
          return (
            <Card key={site.id} className="border-border hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{site.site_name}</CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {site.address || 'Address not specified'}
                    </p>
                  </div>
                  <Badge className={`${status.color} ${status.textColor}`}>
                    {status.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>{site.patrols?.[0]?.count || 0} Patrols Today</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Camera className="w-4 h-4" />
                    <span>CCTV Active</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last patrol: 25m ago
                    </span>
                    <span className="text-primary font-medium">View Details →</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSites.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No sites found</p>
        </div>
      )}
    </div>
  );
};

export default ClientPortalSiteStatus;
