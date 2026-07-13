import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Camera, X, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { validateGuardLocation, calculateDistance } from '@/utils/geofenceValidation';

interface QRScannerProps {
  patrolId: string;
  onScanSuccess: (checkpointId: string) => void;
  onClose: () => void;
  clientId?: string; // Optional client ID for geofence validation
}

const QRScanner = ({ patrolId, onScanSuccess, onClose, clientId }: QRScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [gpsValidation, setGpsValidation] = useState<{
    status: 'checking' | 'valid' | 'invalid' | 'no-geofence';
    message: string;
    distance?: number;
    coords?: { lat: number; lng: number };
  }>({ status: 'checking', message: 'Checking GPS location...' });
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Validate geofence on mount
    validateGeofence();
    return () => {
      stopCamera();
    };
  }, [clientId]);

  const validateGeofence = async () => {
    setGpsValidation({ status: 'checking', message: 'Checking GPS location...' });

    try {
      // Get client geofence if clientId provided
      let geofenceConfig = null;

      if (clientId) {
        const { data: client } = await supabase
          .from('clients')
          .select('gps_lat, gps_lng, geofence_radius_meters, legal_name')
          .eq('id', clientId)
          .single();

        if (client?.gps_lat && client?.gps_lng) {
          geofenceConfig = {
            centerLat: client.gps_lat,
            centerLng: client.gps_lng,
            radiusMeters: client.geofence_radius_meters || 50,
          };
        }
      }

      const result = await validateGuardLocation(geofenceConfig);

      if (!geofenceConfig) {
        setGpsValidation({
          status: 'no-geofence',
          message: 'No geofence configured - GPS validation skipped',
          coords: result.coords || undefined,
        });
      } else if (result.isValid) {
        setGpsValidation({
          status: 'valid',
          message: result.message,
          distance: result.distance || undefined,
          coords: result.coords || undefined,
        });
      } else {
        setGpsValidation({
          status: 'invalid',
          message: result.message,
          distance: result.distance || undefined,
          coords: result.coords || undefined,
        });
      }
    } catch (error) {
      setGpsValidation({
        status: 'invalid',
        message: 'Failed to validate GPS location',
      });
    }
  };

  const startCamera = async () => {
    // Check geofence before allowing scan
    if (gpsValidation.status === 'invalid') {
      toast.error('Cannot scan - You are outside the client geofence area');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setScanning(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleManualEntry = async () => {
    // Check geofence before allowing manual entry
    if (gpsValidation.status === 'invalid') {
      toast.error('Cannot scan - You are outside the client geofence area');
      return;
    }

    const qrCode = prompt('Enter checkpoint QR code:');
    if (!qrCode) return;

    await verifyCheckpoint(qrCode);
  };

  const verifyCheckpoint = async (qrCode: string) => {
    try {
      // Find checkpoint by QR code
      const { data: checkpoint, error: checkpointError } = await supabase
        .from('checkpoints')
        .select('*')
        .eq('qr_code', qrCode)
        .eq('is_active', true)
        .single();

      if (checkpointError || !checkpoint) {
        toast.error('Invalid checkpoint QR code');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      // Record checkpoint scan with GPS coordinates
      const { error: scanError } = await supabase
        .from('patrol_checkpoints')
        .insert({
          patrol_id: patrolId,
          checkpoint_id: checkpoint.id,
          scanned_by: user.id,
          scan_method: 'qr_code',
          verification_status: gpsValidation.status === 'valid' ? 'verified' : 'pending',
          gps_coordinates: gpsValidation.coords 
            ? `${gpsValidation.coords.lat.toFixed(6)},${gpsValidation.coords.lng.toFixed(6)}` 
            : null,
          notes: gpsValidation.distance ? `Distance from geofence center: ${gpsValidation.distance}m` : null
        });

      if (scanError) {
        console.error('Scan recording error:', scanError);
        toast.error('Failed to record checkpoint scan');
        return;
      }

      toast.success(`Checkpoint "${checkpoint.checkpoint_name}" verified!`);
      onScanSuccess(checkpoint.id);
      stopCamera();
    } catch (err) {
      console.error('Checkpoint verification error:', err);
      toast.error('Failed to verify checkpoint');
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scan Checkpoint</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Geofence Status */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${
        gpsValidation.status === 'valid' ? 'bg-green-500/10 border-green-500/30' :
        gpsValidation.status === 'invalid' ? 'bg-destructive/10 border-destructive/30' :
        gpsValidation.status === 'no-geofence' ? 'bg-muted border-muted-foreground/20' :
        'bg-primary/10 border-primary/30'
      }`}>
        {gpsValidation.status === 'valid' && <CheckCircle className="w-5 h-5 text-green-500" />}
        {gpsValidation.status === 'invalid' && <AlertTriangle className="w-5 h-5 text-destructive" />}
        {gpsValidation.status === 'no-geofence' && <MapPin className="w-5 h-5 text-muted-foreground" />}
        {gpsValidation.status === 'checking' && <MapPin className="w-5 h-5 text-primary animate-pulse" />}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {gpsValidation.status === 'valid' && 'Location Verified'}
            {gpsValidation.status === 'invalid' && 'Outside Geofence'}
            {gpsValidation.status === 'no-geofence' && 'No Geofence Set'}
            {gpsValidation.status === 'checking' && 'Checking Location...'}
          </p>
          <p className="text-xs text-muted-foreground">{gpsValidation.message}</p>
        </div>
        {gpsValidation.distance !== undefined && (
          <Badge variant={gpsValidation.status === 'valid' ? 'default' : 'destructive'}>
            {gpsValidation.distance}m
          </Badge>
        )}
      </div>

      {gpsValidation.status === 'invalid' && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <p className="text-sm text-destructive font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            QR scanning is disabled because you are outside the client's assigned location.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Please move to the designated client site to verify checkpoints.
          </p>
        </div>
      )}

      {!scanning ? (
        <div className="space-y-4">
          <Button 
            onClick={startCamera} 
            className="w-full gap-2"
            disabled={gpsValidation.status === 'invalid' || gpsValidation.status === 'checking'}
          >
            <Camera className="w-4 h-4" />
            Start Camera Scan
          </Button>
          <Button 
            onClick={handleManualEntry} 
            variant="outline" 
            className="w-full"
            disabled={gpsValidation.status === 'invalid' || gpsValidation.status === 'checking'}
          >
            Enter QR Code Manually
          </Button>
          <Button onClick={validateGeofence} variant="ghost" className="w-full gap-2">
            <MapPin className="w-4 h-4" />
            Re-check GPS Location
          </Button>
          {hasPermission === false && (
            <p className="text-sm text-destructive">
              Camera access denied. Please enable camera permissions in your browser settings.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-sm text-foreground/80 font-medium text-center">
            Point your camera at the checkpoint QR code
          </div>
          <Button onClick={stopCamera} variant="outline" className="w-full">
            Cancel Scan
          </Button>
        </div>
      )}
    </Card>
  );
};

export default QRScanner;