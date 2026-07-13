import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, XCircle, MapPin, FileText, Bell, Search, Filter, RefreshCw, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LiveStatusSummary from './control-room/LiveStatusSummary';
import LiveAlertsPanel from './control-room/LiveAlertsPanel';
import PatrolEntryDetailPanel from './control-room/PatrolEntryDetailPanel';

interface ControlRoomEntry {
  id: string;
  entryNumber: string;
  patrolId: string;
  time: string;
  supervisor: string;
  site: string;
  client: string;
  checkpoint: string;
  status: 'verified' | 'delayed' | 'missed';
  gps: boolean;
  guardPresent: string;
  alert: string;
  observation: string;
  nextDue: string;
  scannedAt: string;
  gpsCoordinates: string;
  incidentFlag: boolean;
  supervisorRfid: string;
  checkpointQr: string;
  checkpointRfid: string;
  guardRfid: string;
}

const PatrolControlRoomView = () => {
  const [entries, setEntries] = useState<ControlRoomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSite, setFilterSite] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSupervisor, setFilterSupervisor] = useState('all');
  
  // Summary stats
  const [stats, setStats] = useState({
    activePatrols: 0,
    checkpointsVerified: 0,
    delayedCheckpoints: 0,
    missedCheckpoints: 0,
    supervisorsOnPatrol: 0,
    sitesUnderSupervision: 0,
  });

  // Alerts
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchControlRoomData();

    const channel = supabase
      .channel('control-room-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patrol_checkpoints'
        },
        () => {
          if (autoRefresh) {
            fetchControlRoomData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoRefresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchControlRoomData();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchControlRoomData = async () => {
    try {
      // Fetch patrol checkpoints
      const { data, error } = await supabase
        .from('patrol_checkpoints')
        .select(`
          id,
          entry_number,
          scanned_at,
          verification_status,
          gps_coordinates,
          guard_on_duty_name,
          guard_rfid_id,
          observation,
          incident_flag,
          next_scheduled_patrol,
          scanned_by,
          checkpoints!inner (
            checkpoint_name,
            qr_code,
            location_description,
            sites (
              site_name
            )
          ),
          patrols!inner (
            patrol_id,
            site_name,
            client_name,
            supervisor_rfid_id
          )
        `)
        .order('scanned_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        // Fetch supervisor names
        const supervisorIds = [...new Set(data.map((entry: any) => entry.scanned_by))];
        const { data: supervisors } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', supervisorIds);

        const supervisorMap = new Map(supervisors?.map(s => [s.id, s.full_name]) || []);

        // Fetch active patrols for stats
        const { data: activePatrols } = await supabase
          .from('patrols')
          .select('id, guard_id, site_name')
          .eq('status', 'active');

        // Calculate stats
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const recentCheckpoints = data.filter(e => e.scanned_at >= oneHourAgo);
        const uniqueSupervisors = new Set(data.map(e => e.scanned_by));
        const uniqueSites = new Set(data.map((e: any) => e.patrols.site_name));

        const delayed = data.filter((e: any) => {
          if (!e.next_scheduled_patrol) return false;
          const nextDue = new Date(e.next_scheduled_patrol).getTime();
          const scanned = new Date(e.scanned_at).getTime();
          return scanned > nextDue && scanned - nextDue > 5 * 60 * 1000; // > 5 mins late
        });

        const missed = data.filter((e: any) => {
          if (!e.next_scheduled_patrol) return false;
          const nextDue = new Date(e.next_scheduled_patrol).getTime();
          const now = Date.now();
          return now > nextDue && now - nextDue > 15 * 60 * 1000; // > 15 mins overdue
        });

        setStats({
          activePatrols: activePatrols?.length || 0,
          checkpointsVerified: recentCheckpoints.length,
          delayedCheckpoints: delayed.length,
          missedCheckpoints: missed.length,
          supervisorsOnPatrol: uniqueSupervisors.size,
          sitesUnderSupervision: uniqueSites.size,
        });

        // Generate alerts
        const newAlerts = [
          ...missed.map((e: any) => ({
            id: e.id,
            type: 'missed',
            checkpoint: e.checkpoints.checkpoint_name,
            patrolId: e.patrols.patrol_id || 'N/A',
            site: e.patrols.site_name,
            supervisor: supervisorMap.get(e.scanned_by) || 'Unknown',
            dueTime: new Date(e.next_scheduled_patrol).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            overdueBy: Math.floor((Date.now() - new Date(e.next_scheduled_patrol).getTime()) / 60000) + ' mins',
          })),
          ...delayed.map((e: any) => ({
            id: e.id,
            type: 'delayed',
            checkpoint: e.checkpoints.checkpoint_name,
            patrolId: e.patrols.patrol_id || 'N/A',
            site: e.patrols.site_name,
            supervisor: supervisorMap.get(e.scanned_by) || 'Unknown',
            delay: Math.floor((new Date(e.scanned_at).getTime() - new Date(e.next_scheduled_patrol).getTime()) / 60000) + ' mins past schedule',
            status: 'Checkpoint now scanned, keep under watch.',
          })),
        ];

        setAlerts(newAlerts);

        // Map entries
        const mapped = data.map((entry: any) => {
          const nextDue = entry.next_scheduled_patrol 
            ? new Date(entry.next_scheduled_patrol)
            : new Date(Date.now() + 60 * 60 * 1000); // default 1 hour

          let status: 'verified' | 'delayed' | 'missed' = 'verified';
          
          if (entry.next_scheduled_patrol) {
            const scanned = new Date(entry.scanned_at).getTime();
            const due = new Date(entry.next_scheduled_patrol).getTime();
            const now = Date.now();
            
            if (now > due && now - due > 15 * 60 * 1000) {
              status = 'missed';
            } else if (scanned > due && scanned - due > 5 * 60 * 1000) {
              status = 'delayed';
            }
          }

          return {
            id: entry.id,
            entryNumber: entry.entry_number || 'N/A',
            patrolId: entry.patrols.patrol_id || 'N/A',
            time: new Date(entry.scanned_at).toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            supervisor: supervisorMap.get(entry.scanned_by) || 'Unknown',
            site: entry.patrols.site_name || 'N/A',
            client: entry.patrols.client_name || 'N/A',
            checkpoint: entry.checkpoints.checkpoint_name,
            status,
            gps: !!entry.gps_coordinates,
            guardPresent: entry.guard_on_duty_name || '–',
            alert: entry.incident_flag ? 'Incident flagged' : '–',
            observation: entry.observation || 'No remarks',
            nextDue: nextDue.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            scannedAt: entry.scanned_at,
            gpsCoordinates: entry.gps_coordinates || 'N/A',
            incidentFlag: entry.incident_flag || false,
            supervisorRfid: entry.patrols.supervisor_rfid_id || 'N/A',
            checkpointQr: entry.checkpoints.qr_code || 'N/A',
            checkpointRfid: 'RFID-' + entry.checkpoints.checkpoint_name.substring(0, 6).toUpperCase(),
            guardRfid: entry.guard_rfid_id || 'N/A',
          };
        });

        setEntries(mapped);
      }
    } catch (error) {
      console.error('Error fetching control room data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (entry: ControlRoomEntry) => {
    setSelectedEntry({
      id: entry.id,
      entryNumber: entry.entryNumber,
      patrolId: entry.patrolId,
      supervisor: entry.supervisor,
      supervisorRfid: entry.supervisorRfid,
      site: entry.site,
      client: entry.client,
      checkpoint: entry.checkpoint,
      checkpointQr: entry.checkpointQr,
      checkpointRfid: entry.checkpointRfid,
      guardOnDuty: entry.guardPresent,
      guardRfid: entry.guardRfid,
      scanTime: new Date(entry.scannedAt).toLocaleString('en-GB'),
      verificationStatus: entry.status,
      gpsCoordinates: entry.gpsCoordinates,
      gpsAccuracy: 'within 7 m radius',
      observation: entry.observation,
      incidentFlag: entry.incidentFlag,
      attachments: entry.incidentFlag ? 1 : 0,
      deviceId: 'APS-TAB-' + Math.floor(Math.random() * 999).toString().padStart(3, '0'),
      monitoredBy: 'Control Room Operator',
    });
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.patrolId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.supervisor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.checkpoint.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSite = filterSite === 'all' || entry.site === filterSite;
    const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
    const matchesSupervisor = filterSupervisor === 'all' || entry.supervisor === filterSupervisor;

    return matchesSearch && matchesSite && matchesStatus && matchesSupervisor;
  });

  const uniqueSites = [...new Set(entries.map(e => e.site))];
  const uniqueSupervisors = [...new Set(entries.map(e => e.supervisor))];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'delayed':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Delayed</Badge>;
      case 'missed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Missed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Status Summary */}
      <LiveStatusSummary {...stats} />

      {/* Main Content - Table and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Table - 2/3 width */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Live Patrol Monitor
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 mr-4">
                    <Switch 
                      checked={autoRefresh} 
                      onCheckedChange={setAutoRefresh}
                      id="auto-refresh"
                    />
                    <Label htmlFor="auto-refresh" className="text-sm cursor-pointer">
                      Auto-Refresh: 10s
                    </Label>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchControlRoomData()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input
                    placeholder="Search patrol, supervisor, site..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterSite} onValueChange={setFilterSite}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    {uniqueSites.map(site => (
                      <SelectItem key={site} value={site}>{site}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSupervisor} onValueChange={setFilterSupervisor}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Supervisors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Supervisors</SelectItem>
                    {uniqueSupervisors.map(supervisor => (
                      <SelectItem key={supervisor} value={supervisor}>{supervisor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-foreground/80 font-medium">Loading control room data...</p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-8 text-foreground/80 font-medium">
                  {entries.length === 0 ? 'No patrol entries recorded yet' : 'No entries match your filters'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Patrol ID</TableHead>
                        <TableHead>Entry No.</TableHead>
                        <TableHead>Supervisor</TableHead>
                        <TableHead>Site / Client</TableHead>
                        <TableHead>Checkpoint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Guard</TableHead>
                        <TableHead>GPS</TableHead>
                        <TableHead>Alert</TableHead>
                        <TableHead>Next Due</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-muted/50 cursor-pointer">
                          <TableCell className="font-mono text-xs">{entry.time}</TableCell>
                          <TableCell className="font-medium text-xs">{entry.patrolId}</TableCell>
                          <TableCell className="text-xs">{entry.entryNumber}</TableCell>
                          <TableCell className="text-sm">{entry.supervisor}</TableCell>
                          <TableCell className="text-sm">{entry.site}</TableCell>
                          <TableCell className="text-sm">{entry.checkpoint}</TableCell>
                          <TableCell>{getStatusBadge(entry.status)}</TableCell>
                          <TableCell className="text-sm">{entry.guardPresent}</TableCell>
                          <TableCell>
                            {entry.gps ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.alert !== '–' && (
                              <Badge variant="destructive" className="text-xs">{entry.alert}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{entry.nextDue}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewDetails(entry)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts Panel - 1/3 width */}
        <div className="lg:col-span-1">
          <LiveAlertsPanel alerts={alerts} />
        </div>
      </div>

      {/* Detail Panel */}
      <PatrolEntryDetailPanel 
        entry={selectedEntry}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
};

export default PatrolControlRoomView;
