import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Search,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ClientPortalIncidentsProps {
  clientId?: string;
}

const ClientPortalIncidents = ({ clientId }: ClientPortalIncidentsProps) => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchIncidents = useCallback(async () => {
    if (!clientId) return;
    
    try {
      const { data } = await supabase
        .from('incidents')
        .select(`
          *,
          sites(site_name)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      setIncidents(data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchIncidents();
    }
  }, [clientId, fetchIncidents]);

  // Real-time subscription
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('client-incidents-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incidents' },
        () => fetchIncidents()
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, fetchIncidents]);

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = 
      incident.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.incident_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'bg-alert-normal text-white';
      case 'open':
        return 'bg-alert-critical text-white';
      case 'in_progress':
      case 'investigating':
        return 'bg-alert-caution text-white';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-alert-critical text-alert-critical';
      case 'high':
        return 'border-alert-caution text-alert-caution';
      case 'medium':
        return 'border-primary text-primary';
      default:
        return 'border-muted-foreground text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading incidents...</div>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted/30 rounded-lg">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incidents.length}</p>
                <p className="text-xs text-muted-foreground">Total Incidents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-alert-critical/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-alert-critical" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {incidents.filter(i => i.status === 'open').length}
                </p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-alert-caution/10 rounded-lg">
                <Clock className="w-5 h-5 text-alert-caution" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {incidents.filter(i => i.status === 'in_progress' || i.status === 'investigating').length}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-alert-normal/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-alert-normal" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length}
                </p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.map((incident) => (
          <Card key={incident.id} className="border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(incident.status)}>
                        {incident.status?.replace('_', ' ')}
                      </Badge>
                      {incident.priority && (
                        <Badge variant="outline" className={getPriorityColor(incident.priority)}>
                          {incident.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-base font-semibold text-foreground">
                    {incident.title || incident.incident_type || 'Incident Report'}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {incident.description || 'No description provided'}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(incident.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                    {incident.sites?.site_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {incident.sites.site_name}
                      </span>
                    )}
                    {incident.incident_type && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {incident.incident_type}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedIncident(incident)}
                    className="gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Download className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIncidents.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No incidents found</p>
        </div>
      )}

      {/* Incident Detail Modal would go here */}
    </div>
  );
};

export default ClientPortalIncidents;
