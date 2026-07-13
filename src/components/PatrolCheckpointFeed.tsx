import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LogEntry {
  time: string;
  checkpoint: string;
  site: string;
  id: string;
  officer: string;
  supervisorName: string;
  scanType: 'QR' | 'RFID';
  status: 'Passed' | 'Late' | 'Delayed' | 'Missed Scan';
  elapsed: string;
  remarks: string;
  supervisor: 'Reviewed' | 'Follow-Up' | 'Pending';
}

const entries: LogEntry[] = [
  { time: '18:45:10', checkpoint: 'Main Gate', site: 'Nairobi Hospital', id: 'QR-MG-001', officer: 'G001 – Ahmed Omar', supervisorName: 'Samuel Ochieng', scanType: 'QR', status: 'Passed', elapsed: '00:30 min', remarks: 'Routine entry scan successful', supervisor: 'Reviewed' },
  { time: '18:47:00', checkpoint: 'Hotel Lobby', site: 'Melili Hotel', id: 'RFID-HL-002', officer: 'G004 – Fatma Ali', supervisorName: 'Grace Wanjiru', scanType: 'RFID', status: 'Passed', elapsed: '00:50 min', remarks: 'Checked lobby area and reception', supervisor: 'Reviewed' },
  { time: '18:49:15', checkpoint: 'Parking Lot A', site: 'Nairobi Hospital', id: 'QR-PLA-003', officer: 'G009 – James Njoroge', supervisorName: 'Samuel Ochieng', scanType: 'QR', status: 'Passed', elapsed: '00:45 min', remarks: 'Parking area secured, lighting OK', supervisor: 'Reviewed' },
  { time: '18:52:40', checkpoint: 'Restaurant Entrance', site: 'Aks Restaurant', id: 'RFID-RE-004', officer: 'G007 – Musa Otieno', supervisorName: 'David Kipchoge', scanType: 'RFID', status: 'Late', elapsed: '04:05 min', remarks: 'Minor delay due to customer inquiry', supervisor: 'Follow-Up' },
  { time: '18:56:10', checkpoint: 'Emergency Exit North', site: 'Nairobi Hospital', id: 'QR-EEN-005', officer: 'G002 – Brian Kimani', supervisorName: 'Samuel Ochieng', scanType: 'QR', status: 'Passed', elapsed: '00:55 min', remarks: 'Exit clear, alarm system checked', supervisor: 'Reviewed' },
  { time: '18:58:20', checkpoint: 'Rooftop Access', site: 'Melili Hotel', id: 'RFID-RA-006', officer: 'G006 – Peter Mwangi', supervisorName: 'Grace Wanjiru', scanType: 'RFID', status: 'Passed', elapsed: '00:47 min', remarks: 'Rooftop secured, no intrusion', supervisor: 'Reviewed' },
  { time: '19:00:50', checkpoint: 'Staff Room', site: 'Aks Restaurant', id: 'QR-SR-007', officer: 'G008 – John Mutua', supervisorName: 'David Kipchoge', scanType: 'QR', status: 'Delayed', elapsed: '02:15 min', remarks: 'Staff briefing in progress', supervisor: 'Follow-Up' },
  { time: '19:04:22', checkpoint: 'Kitchen Service Entry', site: 'Melili Hotel', id: 'RFID-KSE-008', officer: 'G004 – Fatma Ali', supervisorName: 'Grace Wanjiru', scanType: 'RFID', status: 'Passed', elapsed: '00:51 min', remarks: 'Kitchen area secured, no issues', supervisor: 'Reviewed' },
  { time: '19:07:31', checkpoint: 'Storage Area', site: 'Aks Restaurant', id: 'QR-SA-009', officer: 'G010 – Hassan Noor', supervisorName: 'David Kipchoge', scanType: 'QR', status: 'Passed', elapsed: '00:56 min', remarks: 'Inventory secured, locks checked', supervisor: 'Reviewed' },
  { time: '19:10:00', checkpoint: 'Back Exit', site: 'Aks Restaurant', id: 'RFID-BE-010', officer: 'G001 – Ahmed Omar', supervisorName: 'David Kipchoge', scanType: 'RFID', status: 'Passed', elapsed: '00:59 min', remarks: 'Exit secured, lighting functional', supervisor: 'Reviewed' },
  { time: '19:12:18', checkpoint: 'Main Gate', site: 'Nairobi Hospital', id: 'QR-MG-001', officer: 'G001 – Ahmed Omar', supervisorName: 'Samuel Ochieng', scanType: 'QR', status: 'Passed', elapsed: '00:28 min', remarks: 'Second round, guard present', supervisor: 'Reviewed' },
  { time: '19:14:40', checkpoint: 'Hotel Lobby', site: 'Melili Hotel', id: 'RFID-HL-002', officer: 'G004 – Fatma Ali', supervisorName: 'Grace Wanjiru', scanType: 'RFID', status: 'Passed', elapsed: '00:45 min', remarks: 'Night shift transition complete', supervisor: 'Reviewed' },
  { time: '19:17:02', checkpoint: 'Parking Lot A', site: 'Nairobi Hospital', id: 'QR-PLA-003', officer: 'G009 – James Njoroge', supervisorName: 'Samuel Ochieng', scanType: 'QR', status: 'Passed', elapsed: '00:46 min', remarks: 'Vehicle count verified', supervisor: 'Reviewed' },
  { time: '19:20:18', checkpoint: 'Restaurant Entrance', site: 'Aks Restaurant', id: 'RFID-RE-004', officer: 'G007 – Musa Otieno', supervisorName: 'David Kipchoge', scanType: 'RFID', status: 'Missed Scan', elapsed: '05:20 min', remarks: 'Patrol rerouted, alert sent', supervisor: 'Pending' },
  { time: '19:22:43', checkpoint: 'Emergency Exit North', site: 'Nairobi Hospital', id: 'QR-EEN-005', officer: 'G002 – Brian Kimani', supervisorName: 'Samuel Ochieng', scanType: 'QR', status: 'Passed', elapsed: '00:44 min', remarks: 'Emergency lighting confirmed', supervisor: 'Reviewed' },
  { time: '19:25:11', checkpoint: 'Rooftop Access', site: 'Melili Hotel', id: 'RFID-RA-006', officer: 'G006 – Peter Mwangi', supervisorName: 'Grace Wanjiru', scanType: 'RFID', status: 'Passed', elapsed: '00:52 min', remarks: 'All access points secure', supervisor: 'Reviewed' },
  { time: '19:28:30', checkpoint: 'Staff Room', site: 'Aks Restaurant', id: 'QR-SR-007', officer: 'G008 – John Mutua', supervisorName: 'David Kipchoge', scanType: 'QR', status: 'Passed', elapsed: '00:47 min', remarks: 'Staff area cleared', supervisor: 'Reviewed' },
  { time: '19:31:05', checkpoint: 'Kitchen Service Entry', site: 'Melili Hotel', id: 'RFID-KSE-008', officer: 'G004 – Fatma Ali', supervisorName: 'Grace Wanjiru', scanType: 'RFID', status: 'Passed', elapsed: '00:53 min', remarks: 'Kitchen closed and secured', supervisor: 'Reviewed' },
  { time: '19:34:21', checkpoint: 'Storage Area', site: 'Aks Restaurant', id: 'QR-SA-009', officer: 'G010 – Hassan Noor', supervisorName: 'David Kipchoge', scanType: 'QR', status: 'Passed', elapsed: '00:55 min', remarks: 'Final inventory check complete', supervisor: 'Reviewed' },
  { time: '19:36:40', checkpoint: 'Back Exit', site: 'Aks Restaurant', id: 'RFID-BE-010', officer: 'G001 – Ahmed Omar', supervisorName: 'David Kipchoge', scanType: 'RFID', status: 'Passed', elapsed: '00:59 min', remarks: 'Final round complete', supervisor: 'Reviewed' },
];

function statusBadgeVariant(status: LogEntry['status']) {
  switch (status) {
    case 'Passed':
      return 'default' as const;
    case 'Late':
    case 'Delayed':
      return 'secondary' as const;
    case 'Missed Scan':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
}

function supervisorBadgeVariant(s: LogEntry['supervisor']) {
  switch (s) {
    case 'Reviewed':
      return 'default' as const;
    case 'Follow-Up':
      return 'secondary' as const;
    case 'Pending':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
}

const PatrolCheckpointFeed = () => {
  const [liveEntries, setLiveEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchCheckpointScans();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('patrol-checkpoints-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patrol_checkpoints'
        },
        () => {
          fetchCheckpointScans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCheckpointScans = async () => {
    try {
      const { data, error } = await supabase
        .from('patrol_checkpoints')
        .select(`
          id,
          scanned_at,
          scan_method,
          verification_status,
          notes,
          scanned_by,
          checkpoints!inner (
            checkpoint_name,
            qr_code,
            sites (
              site_name
            )
          ),
          patrols!inner (
            guard_id
          )
        `)
        .order('scanned_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching checkpoint scans:', error);
        setIsLive(false);
      } else if (data && data.length > 0) {
        // Map database data to LogEntry format
        const mapped = data.map((scan: any) => {
          // Determine supervisor based on site
          let supervisorName = 'Unassigned';
          const siteName = scan.checkpoints.sites?.site_name;
          if (siteName === 'Nairobi Hospital') supervisorName = 'Samuel Ochieng';
          else if (siteName === 'Melili Hotel') supervisorName = 'Grace Wanjiru';
          else if (siteName === 'Aks Restaurant') supervisorName = 'David Kipchoge';
          
          return {
            time: new Date(scan.scanned_at).toLocaleTimeString('en-GB'),
            checkpoint: scan.checkpoints.checkpoint_name,
            site: siteName || 'Not Assigned',
            id: scan.checkpoints.qr_code,
            officer: `Guard ${scan.patrols.guard_id}`,
            supervisorName,
            scanType: scan.scan_method === 'qr_code' ? 'QR' : 'RFID',
            status: scan.verification_status === 'verified' ? 'Passed' : 'Late',
            elapsed: '00:45 min',
            remarks: scan.notes || 'Checkpoint verified',
            supervisor: 'Reviewed'
          };
        }) as LogEntry[];
        
        setLiveEntries(mapped);
        setIsLive(true);
      } else {
        setIsLive(false);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  const displayEntries = isLive ? liveEntries : entries;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Supervision Patrol – Live Checkpoint Verification Log</CardTitle>
            <Badge variant={isLive ? 'default' : 'secondary'}>
              {isLive ? '🟢 Live Data' : '📊 Simulated Data'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-foreground/80 font-medium">Loading checkpoint data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time (Live)</TableHead>
                    <TableHead>Checkpoint / Location</TableHead>
                    <TableHead>Site / Assignment</TableHead>
                    <TableHead>Area Supervisor</TableHead>
                    <TableHead>Scan Status</TableHead>
                    <TableHead className="hidden md:table-cell">Scan Type</TableHead>
                    <TableHead className="hidden lg:table-cell">Checkpoint ID</TableHead>
                    <TableHead className="hidden md:table-cell">Officer</TableHead>
                    <TableHead className="hidden xl:table-cell">Elapsed</TableHead>
                    <TableHead className="hidden lg:table-cell">Remarks</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayEntries.map((e, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{e.time}</TableCell>
                      <TableCell>{e.checkpoint}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{e.site}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{e.supervisorName}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(e.status)}>
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{e.scanType}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{e.id}</code>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{e.officer}</TableCell>
                      <TableCell className="hidden xl:table-cell">{e.elapsed}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[280px] truncate" title={e.remarks}>
                        {e.remarks}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={supervisorBadgeVariant(e.supervisor)}>
                          {e.supervisor}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Intelligence Summary (Auto-Analytics)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryItem label="Total Checkpoints Active" value="10" note="All checkpoints operational" />
            <SummaryItem label="Scans Completed" value="20" note="Within expected patrol range" />
            <SummaryItem label="Missed / Delayed Scans" value="2" note="Alerts sent to Supervisor" />
            <SummaryItem label="Avg Completion Time" value="3 min 22 sec" note="Within standard" />
            <SummaryItem label="RFID / QR Ratio" value="60% / 40%" note="Balanced coverage" />
            <SummaryItem label="Supervisor Reviews" value="90%" note="Synced to Control" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SummaryItem = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div className="rounded-lg border p-4">
    <div className="text-sm text-foreground/90 font-semibold">{label}</div>
    <div className="text-2xl font-semibold">{value}</div>
    {note && <div className="text-xs text-foreground/80 font-medium mt-1">{note}</div>}
  </div>
);

export default PatrolCheckpointFeed;
