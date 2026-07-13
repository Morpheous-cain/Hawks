import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, MapPin, CheckCircle, Clock, User, 
  RefreshCw, Download, Camera, Activity 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { downloadShiftReport } from "@/utils/shiftReportGenerator";
import { toast } from "sonner";

interface PatrolProofEntry {
  id: string;
  checkpointName: string;
  siteName: string;
  scannedAt: string;
  scannedBy: string;
  gpsCoordinates: string | null;
  verificationMethod: string;
}

interface AttendanceProof {
  officerName: string;
  clockIn: string;
  clockOut: string | null;
  site: string;
  verified: boolean;
  method: string;
}

const ClientPortalPatrolProof = ({ clientId }: { clientId?: string }) => {
  const [patrolProofs, setPatrolProofs] = useState<PatrolProofEntry[]>([]);
  const [attendanceProofs, setAttendanceProofs] = useState<AttendanceProof[]>([]);
  const [complianceScore, setComplianceScore] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchProofs = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch checkpoint scans
    const { data: scans } = await supabase
      .from('patrol_checkpoints')
      .select('*, checkpoints(checkpoint_name, sites(site_name))')
      .gte('scanned_at', today.toISOString())
      .order('scanned_at', { ascending: false })
      .limit(50);

    if (scans) {
      setPatrolProofs(scans.map((s: any) => ({
        id: s.id,
        checkpointName: s.checkpoints?.checkpoint_name || 'Unknown',
        siteName: s.checkpoints?.sites?.site_name || 'Unknown',
        scannedAt: s.scanned_at,
        scannedBy: s.scanned_by || 'Unknown',
        gpsCoordinates: s.gps_coordinates,
        verificationMethod: s.gps_coordinates ? 'QR + GPS' : 'QR',
      })));
    }

    // Fetch attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*, staff:staff_id(full_name)')
      .gte('check_in', today.toISOString())
      .order('check_in', { ascending: false })
      .limit(30);

    if (attendance) {
      const proofs: AttendanceProof[] = attendance.map((a: any) => ({
        officerName: a.staff?.full_name || 'Unknown',
        clockIn: a.check_in,
        clockOut: a.check_out,
        site: a.site,
        verified: a.status === 'verified',
        method: a.notes?.includes('Biometric: verified') ? 'Bio+Selfie+GPS' :
          a.notes?.includes('Selfie: captured') ? 'Selfie+GPS' : 'GPS',
      }));
      setAttendanceProofs(proofs);

      // Calculate compliance
      const verified = proofs.filter(p => p.verified).length;
      setComplianceScore(proofs.length > 0 ? Math.round((verified / proofs.length) * 100) : 100);
    }
  }, [clientId]);

  useEffect(() => {
    fetchProofs();

    const channel = supabase
      .channel('client-patrol-proof')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patrol_checkpoints' }, fetchProofs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchProofs)
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, [fetchProofs]);

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await downloadShiftReport(today);
      toast.success('Shift report downloaded');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-sm text-muted-foreground">
            {isLive ? 'Real-time patrol verification' : 'Connecting...'}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadReport} disabled={downloading}>
          <Download className="w-4 h-4 mr-2" />
          {downloading ? 'Generating...' : 'Download Report'}
        </Button>
      </div>

      {/* Compliance Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Today's Verification Score</h3>
              <p className="text-sm text-muted-foreground">
                {attendanceProofs.length} officers verified • {patrolProofs.length} checkpoints scanned
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{complianceScore}%</p>
              <Badge variant={complianceScore >= 90 ? 'default' : 'destructive'}>
                {complianceScore >= 90 ? 'Excellent' : complianceScore >= 70 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>
          <Progress value={complianceScore} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Officer Attendance Proof */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-5 h-5 text-primary" />
              Officer Attendance Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {attendanceProofs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No attendance records today</p>
            ) : (
              attendanceProofs.map((proof, idx) => (
                <div key={idx} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{proof.officerName}</p>
                    <Badge variant={proof.verified ? 'default' : 'outline'} className="text-xs">
                      {proof.verified ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Verified</>
                      ) : 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(proof.clockIn), 'HH:mm')}
                      {proof.clockOut && ` — ${format(new Date(proof.clockOut), 'HH:mm')}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {proof.site}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <Camera className="w-3 h-3 mr-1" />
                      {proof.method}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Checkpoint Scan Proof */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-5 h-5 text-primary" />
              Checkpoint Scan Proof
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {patrolProofs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No checkpoint scans today</p>
            ) : (
              patrolProofs.map((proof) => (
                <div key={proof.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{proof.checkpointName}</p>
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" /> Scanned
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(proof.scannedAt), 'HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {proof.siteName}
                    </span>
                    <span>{proof.verificationMethod}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientPortalPatrolProof;
