import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, MapPin, User, Clock, FileText, AlertTriangle, Play, BookOpen, AlertCircle } from 'lucide-react';

interface PatrolEntryDetail {
  id: string;
  entryNumber: string;
  patrolId: string;
  supervisor: string;
  supervisorRfid: string;
  site: string;
  client: string;
  checkpoint: string;
  checkpointQr: string;
  checkpointRfid: string;
  guardOnDuty: string;
  guardRfid: string;
  scanTime: string;
  verificationStatus: string;
  gpsCoordinates: string;
  gpsAccuracy: string;
  observation: string;
  incidentFlag: boolean;
  attachments: number;
  deviceId: string;
  monitoredBy: string;
}

interface PatrolEntryDetailPanelProps {
  entry: PatrolEntryDetail | null;
  open: boolean;
  onClose: () => void;
}

const PatrolEntryDetailPanel = ({ entry, open, onClose }: PatrolEntryDetailPanelProps) => {
  if (!entry) return null;

  const getVerificationBadge = () => {
    if (entry.verificationStatus === 'verified') {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          RFID & QR Match, GPS OK
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        {entry.verificationStatus}
      </Badge>
    );
  };

  const DetailRow = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm text-foreground font-medium break-words">{value}</p>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Patrol Entry Detail – {entry.entryNumber}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {getVerificationBadge()}
            {entry.incidentFlag && (
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Incident Flagged
              </Badge>
            )}
          </div>

          <Separator />

          {/* Patrol Information */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Patrol Information
            </h3>
            <div className="space-y-1">
              <DetailRow label="Patrol ID" value={entry.patrolId} />
              <DetailRow label="Supervisor" value={`${entry.supervisor} (${entry.supervisorRfid})`} icon={User} />
              <DetailRow label="Scan Time" value={entry.scanTime} icon={Clock} />
            </div>
          </div>

          <Separator />

          {/* Location Information */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Information
            </h3>
            <div className="space-y-1">
              <DetailRow label="Site / Client" value={`${entry.site} – ${entry.client}`} />
              <DetailRow label="Checkpoint" value={entry.checkpoint} />
              <DetailRow label="QR Code" value={entry.checkpointQr} />
              <DetailRow label="RFID Tag (Checkpoint)" value={entry.checkpointRfid} />
              <DetailRow label="GPS Coordinates" value={entry.gpsCoordinates} icon={MapPin} />
              <DetailRow label="GPS Accuracy" value={entry.gpsAccuracy} />
            </div>
          </div>

          <Separator />

          {/* Guard Information */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Guard on Duty
            </h3>
            <div className="space-y-1">
              <DetailRow label="Guard Name" value={entry.guardOnDuty} />
              <DetailRow label="RFID" value={entry.guardRfid} />
            </div>
          </div>

          <Separator />

          {/* Observation */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Observation
            </h3>
            <p className="text-sm text-foreground bg-muted p-3 rounded-lg">
              {entry.observation}
            </p>
          </div>

          {/* Attachments */}
          {entry.attachments > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-sm mb-2">Attachments</h3>
                <p className="text-sm text-muted-foreground">
                  {entry.attachments} Photo{entry.attachments > 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* System Information */}
          <div>
            <h3 className="font-semibold text-sm mb-3">System Information</h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <DetailRow label="Logged By (System)" value={`APS Patrol App – Device: ${entry.deviceId}`} />
              <DetailRow label="Monitored By (Control Room)" value={entry.monitoredBy} />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" className="w-full justify-start">
              <Play className="w-4 h-4 mr-2" />
              Replay Route
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BookOpen className="w-4 h-4 mr-2" />
              View DOB Entry
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Open Incident
            </Button>
            {entry.incidentFlag && (
              <Button className="w-full justify-start">
                <CheckCircle className="w-4 h-4 mr-2" />
                Acknowledge Alert
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PatrolEntryDetailPanel;
