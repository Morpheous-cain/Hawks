import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapPin, Clock, CheckCircle, AlertTriangle, XCircle, Camera, Upload } from 'lucide-react';

interface PatrolEntryFormProps {
  patrolId: string;
  checkpointId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface AutoCapturedData {
  entryNumber: string;
  dateTime: string;
  supervisorName: string;
  supervisorRfidId: string;
  checkpointId: string;
  checkpointName: string;
  qrCodeReference: string;
  gpsCoordinates: string;
  patrolType: string;
  controlRoomOperator: string;
  verificationStatus: 'verified' | 'warning' | 'alert';
}

const PatrolEntryForm = ({ patrolId, checkpointId, onSuccess, onCancel }: PatrolEntryFormProps) => {
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [autoData, setAutoData] = useState<AutoCapturedData | null>(null);
  
  // Editable fields
  const [observation, setObservation] = useState('');
  const [incidentFlag, setIncidentFlag] = useState(false);
  const [guardOnDuty, setGuardOnDuty] = useState('');
  const [guardRfidId, setGuardRfidId] = useState('');
  const [nextScheduledPatrol, setNextScheduledPatrol] = useState('');
  const [supervisorPin, setSupervisorPin] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchInitialData();
    fetchStaffList();
    captureGPS();
  }, [patrolId, checkpointId]);

  const fetchInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      const { data: checkpoint } = checkpointId
        ? await supabase
            .from('checkpoints')
            .select('checkpoint_name, qr_code, sites(site_name)')
            .eq('id', checkpointId)
            .single()
        : null;

      const { data: patrol } = await supabase
        .from('patrols')
        .select('site_name, status')
        .eq('id', patrolId)
        .single();

      setAutoData({
        entryNumber: 'Auto-generated',
        dateTime: new Date().toLocaleString('en-GB'),
        supervisorName: profile?.full_name || 'Unknown',
        supervisorRfidId: 'RFID-' + user?.id?.slice(0, 8),
        checkpointId: checkpointId || 'N/A',
        checkpointName: checkpoint?.checkpoint_name || 'N/A',
        qrCodeReference: checkpoint?.qr_code || 'N/A',
        gpsCoordinates: 'Capturing...',
        patrolType: patrol?.site_name || 'Routine Patrol',
        controlRoomOperator: profile?.full_name || 'Unknown',
        verificationStatus: 'verified'
      });
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load patrol data');
    }
  };

  const fetchStaffList = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('id, full_name, staff_id, rfid_card_number')
      .eq('status', 'active')
      .order('full_name');

    if (!error && data) {
      setStaffList(data);
    }
  };

  const captureGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          setAutoData(prev => prev ? { ...prev, gpsCoordinates: coords } : null);
        },
        () => {
          setAutoData(prev => prev ? { ...prev, gpsCoordinates: 'GPS unavailable', verificationStatus: 'warning' } : null);
        }
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!supervisorPin) {
      toast.error('Please enter your supervisor PIN');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const mediaAttachments = selectedFiles.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }));

      const { error } = await supabase
        .from('patrol_checkpoints')
        .insert({
          patrol_id: patrolId,
          checkpoint_id: checkpointId,
          scanned_by: user?.id,
          scan_method: 'qr_code',
          verification_status: autoData?.verificationStatus || 'verified',
          gps_coordinates: autoData?.gpsCoordinates,
          observation: observation,
          incident_flag: incidentFlag,
          guard_on_duty_name: guardOnDuty,
          guard_rfid_id: guardRfidId,
          next_scheduled_patrol: nextScheduledPatrol ? new Date(nextScheduledPatrol).toISOString() : null,
          supervisor_signature: supervisorPin,
          control_room_operator: user?.id,
          patrol_type: autoData?.patrolType,
          media_attachments: mediaAttachments,
          notes: observation
        });

      if (error) throw error;

      toast.success('Patrol entry submitted successfully');
      onSuccess();
    } catch (error) {
      console.error('Error submitting patrol entry:', error);
      toast.error('Failed to submit patrol entry');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'warning':
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Warning</Badge>;
      case 'alert':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Alert</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  if (!autoData) {
    return <div className="flex items-center justify-center p-8">Loading patrol data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Section A: Auto-Captured Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Section A: Auto-Captured Fields (System Generated)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Entry No.</Label>
              <Input value={autoData.entryNumber} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Date & Time</Label>
              <Input value={autoData.dateTime} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Supervisor Name</Label>
              <Input value={autoData.supervisorName} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Supervisor RFID ID</Label>
              <Input value={autoData.supervisorRfidId} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Checkpoint Name</Label>
              <Input value={autoData.checkpointName} disabled className="bg-muted" />
            </div>
            <div>
              <Label>QR Code Reference</Label>
              <Input value={autoData.qrCodeReference} disabled className="bg-muted" />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                GPS Coordinates
              </Label>
              <Input value={autoData.gpsCoordinates} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Patrol Type</Label>
              <Input value={autoData.patrolType} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Control Room Operator</Label>
              <Input value={autoData.controlRoomOperator} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Verification Status</Label>
              <div className="mt-2">
                {getStatusBadge(autoData.verificationStatus)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B: Editable Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Section B: Editable Fields (Manual Input)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="observation">Observation / Remarks</Label>
            <Textarea
              id="observation"
              placeholder="Record patrol details, findings, or any irregularities..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="incident-flag"
              checked={incidentFlag}
              onCheckedChange={setIncidentFlag}
            />
            <Label htmlFor="incident-flag">Incident Flag (Mark if incident detected)</Label>
          </div>

          <div>
            <Label htmlFor="guard-on-duty">Guard on Duty</Label>
            <Select value={guardOnDuty} onValueChange={(value) => {
              setGuardOnDuty(value);
              const staff = staffList.find(s => s.full_name === value);
              if (staff?.rfid_card_number) {
                setGuardRfidId(staff.rfid_card_number);
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select guard from staff list" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.full_name}>
                    {staff.full_name} ({staff.staff_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="guard-rfid">Guard RFID ID</Label>
            <Input
              id="guard-rfid"
              value={guardRfidId}
              onChange={(e) => setGuardRfidId(e.target.value)}
              placeholder="RFID-XXXX (auto-filled or manual)"
            />
          </div>

          <div>
            <Label htmlFor="next-patrol">Next Scheduled Patrol</Label>
            <Input
              id="next-patrol"
              type="datetime-local"
              value={nextScheduledPatrol}
              onChange={(e) => setNextScheduledPatrol(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="media">Attach Media (Photos/Videos)</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                <Camera className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {selectedFiles.length > 0 && (
                <span className="text-sm text-foreground/80 font-medium">
                  {selectedFiles.length} file(s) selected
                </span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="supervisor-pin">Supervisor PIN (Required)</Label>
            <Input
              id="supervisor-pin"
              type="password"
              placeholder="Enter your 4-digit PIN"
              value={supervisorPin}
              onChange={(e) => setSupervisorPin(e.target.value)}
              maxLength={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <Upload className="w-4 h-4 mr-2" />
          {loading ? 'Submitting...' : 'Submit Entry'}
        </Button>
      </div>
    </div>
  );
};

export default PatrolEntryForm;
