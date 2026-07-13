import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield,
  TrendingUp,
  FileText,
  Users,
  RefreshCw,
  Bell,
  MapPin,
  Radio,
  Car,
  Activity,
  Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import LiveSiteDashboard from "@/components/client-portal/LiveSiteDashboard";

interface ClientPortalDashboardProps {
  clientId?: string;
}

const ClientPortalDashboard = ({ clientId }: ClientPortalDashboardProps) => {
  const [stats, setStats] = useState({
    totalSites: 0,
    activeSites: 0,
    openIncidents: 0,
    resolvedIncidents: 0,
    pendingRequests: 0,
    officersOnDuty: 0,
    activeAlarms: 0,
    patrolsToday: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentPatrols, setRecentPatrols] = useState<any[]>([]);
  const [recentAlarms, setRecentAlarms] = useState<any[]>([]);
  const [dobEntries, setDobEntries] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    try {
      // Fetch sites count
      const { count: sitesCount } = await supabase
        .from('sites')
        .select('*', { count: 'exact', head: true });

      // Fetch incidents
      const { data: incidents } = await supabase
        .from('incidents')
        .select('status');

      const openIncidents = incidents?.filter(i => 
        ['open', 'in_progress', 'investigating'].includes(i.status || '')
      ).length || 0;
      const resolvedIncidents = incidents?.filter(i => 
        i.status === 'resolved' || i.status === 'closed'
      ).length || 0;

      // Fetch service requests
      const { count: requestsCount } = await supabase
        .from('communication_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['new', 'in_progress']);

      // Fetch officers on duty (from patrols)
      const { count: activePatrols } = await supabase
        .from('patrols')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch active alarms
      const { count: activeAlarms } = await supabase
        .from('alarm_activations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'dispatched', 'acknowledged']);

      // Fetch today's patrols
      const today = new Date().toISOString().split('T')[0];
      const { count: patrolsToday } = await supabase
        .from('patrols')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      setStats({
        totalSites: sitesCount || 0,
        activeSites: sitesCount || 0,
        openIncidents,
        resolvedIncidents,
        pendingRequests: requestsCount || 0,
        officersOnDuty: activePatrols || 0,
        activeAlarms: activeAlarms || 0,
        patrolsToday: patrolsToday || 0
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    try {
      const { data: incidents } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(incidents || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  }, []);

  const fetchRecentPatrols = useCallback(async () => {
    try {
      const { data: patrols } = await supabase
        .from('patrols')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      setRecentPatrols(patrols || []);
    } catch (error) {
      console.error('Error fetching patrols:', error);
    }
  }, []);

  const fetchRecentAlarms = useCallback(async () => {
    try {
      const { data: alarms } = await supabase
        .from('alarm_activations')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(5);

      setRecentAlarms(alarms || []);
    } catch (error) {
      console.error('Error fetching alarms:', error);
    }
  }, []);

  const fetchDobEntries = useCallback(async () => {
    try {
      const { data: entries } = await supabase
        .from('dob_entries')
        .select('*')
        .order('entry_time', { ascending: false })
        .limit(5);

      setDobEntries(entries || []);
    } catch (error) {
      console.error('Error fetching DOB entries:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
    fetchRecentPatrols();
    fetchRecentAlarms();
    fetchDobEntries();
  }, [fetchStats, fetchRecentActivity, fetchRecentPatrols, fetchRecentAlarms, fetchDobEntries]);

  // Real-time subscriptions
  useEffect(() => {
    const channels = [
      supabase
        .channel('dashboard-incidents')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
          fetchStats();
          fetchRecentActivity();
        })
        .subscribe((status) => setIsLive(status === 'SUBSCRIBED')),

      supabase
        .channel('dashboard-tickets')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'communication_tickets' }, fetchStats)
        .subscribe(),

      supabase
        .channel('dashboard-patrols')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'patrols' }, () => {
          fetchStats();
          fetchRecentPatrols();
        })
        .subscribe(),

      supabase
        .channel('dashboard-alarms')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alarm_activations' }, () => {
          fetchStats();
          fetchRecentAlarms();
        })
        .subscribe(),

      supabase
        .channel('dashboard-dob')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dob_entries' }, fetchDobEntries)
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [fetchStats, fetchRecentActivity, fetchRecentPatrols, fetchRecentAlarms, fetchDobEntries]);

  const getAlarmStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-alert-critical text-white';
      case 'dispatched': return 'bg-alert-warning text-white';
      case 'acknowledged': return 'bg-primary text-white';
      case 'resolved': return 'bg-alert-normal text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPatrolStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-alert-normal text-white';
      case 'completed': return 'bg-primary text-white';
      case 'scheduled': return 'bg-muted text-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statCards = [
    { label: "Total Sites", value: stats.totalSites, icon: Building2, color: "text-primary", bgColor: "bg-primary/10" },
    { label: "Open Incidents", value: stats.openIncidents, icon: AlertTriangle, color: "text-alert-caution", bgColor: "bg-alert-caution/10" },
    { label: "Active Alarms", value: stats.activeAlarms, icon: Bell, color: "text-alert-critical", bgColor: "bg-alert-critical/10" },
    { label: "Officers On Duty", value: stats.officersOnDuty, icon: Shield, color: "text-primary", bgColor: "bg-primary/10" },
    { label: "Patrols Today", value: stats.patrolsToday, icon: Car, color: "text-alert-normal", bgColor: "bg-alert-normal/10" },
    { label: "Pending Requests", value: stats.pendingRequests, icon: Clock, color: "text-muted-foreground", bgColor: "bg-muted/30" }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* TIER 1: Live Site Dashboard at the very top */}
      <LiveSiteDashboard clientId={clientId} clientName="Your Site" />

      {/* Live Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-alert-normal animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-sm text-muted-foreground">
            {isLive ? 'Live updates enabled' : 'Connecting...'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alarms */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-alert-critical" />
              Recent Alarms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[350px] overflow-y-auto">
            {recentAlarms.length > 0 ? (
              recentAlarms.map((alarm, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{alarm.alarm_type}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {alarm.location}
                      </p>
                    </div>
                    <Badge className={getAlarmStatusColor(alarm.status)}>
                      {alarm.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{alarm.alarm_number}</span>
                    <span>{format(new Date(alarm.triggered_at), "dd MMM, HH:mm")}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent alarms</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Patrols */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              Patrol Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[350px] overflow-y-auto">
            {recentPatrols.length > 0 ? (
              recentPatrols.map((patrol, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{patrol.site_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {patrol.patrol_type || 'Routine'} Patrol
                      </p>
                    </div>
                    <Badge className={getPatrolStatusColor(patrol.status)}>
                      {patrol.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{patrol.patrol_id}</span>
                    <span>{format(new Date(patrol.created_at), "dd MMM, HH:mm")}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Car className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No patrol activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DOB Entries */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Daily Occurrence Book
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[350px] overflow-y-auto">
            {dobEntries.length > 0 ? (
              dobEntries.map((entry, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-1">{entry.entry_type}</Badge>
                      <p className="text-sm text-foreground line-clamp-2">{entry.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {entry.site_name}
                    </span>
                    <span>{format(new Date(entry.entry_time), "dd MMM, HH:mm")}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No DOB entries</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-alert-caution" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.title || activity.incident_type || 'Incident Report'}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {activity.description || 'No description available'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), "dd MMM yyyy, HH:mm")}
                      </p>
                    </div>
                    <Badge 
                      variant="outline"
                      className={
                        activity.status === 'resolved' ? 'border-alert-normal text-alert-normal' :
                        activity.status === 'open' ? 'border-alert-critical text-alert-critical' :
                        'border-alert-caution text-alert-caution'
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-alert-normal mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent incidents</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Level Overview */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-alert-normal" />
              Service Level Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alarm Response SLA</span>
                <span className="text-sm font-medium text-alert-normal">98% Met</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-alert-normal h-2 rounded-full" style={{ width: '98%' }} />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Patrol Completion</span>
                <span className="text-sm font-medium text-primary">95% Complete</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '95%' }} />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Incident Resolution</span>
                <span className="text-sm font-medium text-alert-caution">87% Within SLA</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-alert-caution h-2 rounded-full" style={{ width: '87%' }} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Officer Attendance</span>
                <span className="text-sm font-medium text-primary">100%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors text-left">
              <FileText className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-medium">View Reports</p>
              <p className="text-xs text-muted-foreground">Monthly summaries</p>
            </button>
            <button className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors text-left">
              <Users className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-medium">Officer Details</p>
              <p className="text-xs text-muted-foreground">View assigned staff</p>
            </button>
            <button className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors text-left">
              <Eye className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-medium">CCTV Footage</p>
              <p className="text-xs text-muted-foreground">Request recordings</p>
            </button>
            <button className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors text-left">
              <Activity className="w-6 h-6 text-primary mb-2" />
              <p className="text-sm font-medium">Live Tracking</p>
              <p className="text-xs text-muted-foreground">GPS officer tracking</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPortalDashboard;
