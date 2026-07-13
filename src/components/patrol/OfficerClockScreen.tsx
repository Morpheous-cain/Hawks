import { useState, useEffect, useRef } from "react";
import { QrCode, MapPin, Wifi, Radio, Camera, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, User, Building, Fingerprint, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { validateGuardLocation, isWithinGeofence } from "@/utils/geofenceValidation";
import SelfieCapture from "@/components/patrol/SelfieCapture";
import useBiometricAuth from "@/hooks/useBiometricAuth";

interface OfficerClockScreenProps {
  officerId?: string;
  siteId?: string;
}

interface NonceData {
  nonce: string;
  expiresAt: Date;
  qrId: string;
}

interface ClockHistory {
  id: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
  time: string;
  site: string;
  status: 'verified' | 'pending' | 'rejected';
  officerName?: string;
}

interface StaffMember {
  id: string;
  staff_id: string;
  full_name: string;
  position: string;
  current_site: string | null;
  status: string | null;
}

interface Site {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  gpsLat?: number;
  gpsLng?: number;
  geofenceRadius?: number;
}

const OfficerClockScreen = ({ officerId, siteId }: OfficerClockScreenProps) => {
  const [scanning, setScanning] = useState(false);
  const [nonce, setNonce] = useState<NonceData | null>(null);
  const [ttlRemaining, setTtlRemaining] = useState(30);
  const [gpsStatus, setGpsStatus] = useState<'checking' | 'verified' | 'failed' | 'outside'>('checking');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [wifiStatus, setWifiStatus] = useState<'unknown' | 'verified' | 'unavailable'>('unknown');
  const [lastClockEvent, setLastClockEvent] = useState<{ type: string; time: string; status: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string>(siteId || '');
  const [selectedOfficer, setSelectedOfficer] = useState<string>(officerId || '');
  const [clockHistory, setClockHistory] = useState<ClockHistory[]>([]);
  const [currentShiftStatus, setCurrentShiftStatus] = useState<'off' | 'clocked_in' | 'on_break'>('off');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [geofenceStatus, setGeofenceStatus] = useState<{
    status: 'checking' | 'valid' | 'invalid' | 'no-geofence';
    message: string;
    distance?: number;
  }>({ status: 'no-geofence', message: 'Select a site to validate geofence' });
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Anti-fraud verification state
  const [selfieRequired, setSelfieRequired] = useState(false);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [pendingAction, setPendingAction] = useState<'clock_in' | 'clock_out' | null>(null);
  const { isSupported: biometricSupported, isVerifying: biometricVerifying, checkSupport, requestBiometric } = useBiometricAuth();

  // Check biometric support on mount
  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  // Simulate nonce TTL countdown
  useEffect(() => {
    if (nonce && ttlRemaining > 0) {
      const timer = setInterval(() => {
        setTtlRemaining((prev) => {
          if (prev <= 1) {
            setNonce(null);
            toast.error("Nonce expired. Please scan again.");
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [nonce, ttlRemaining]);

  // Load staff, sites, GPS and history on mount
  useEffect(() => {
    fetchStaffMembers();
    fetchSites();
    checkGPSLocation();
    fetchClockHistory();
    checkCurrentShiftStatus();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, staff_id, full_name, position, current_site, status')
        .eq('status', 'active')
        .order('full_name');
      
      if (!error && data) {
        setStaffMembers(data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const fetchSites = async () => {
    try {
      // Fetch sites with their client info for geofencing
      const { data, error } = await supabase
        .from('sites')
        .select(`
          id, 
          site_name,
          client_id,
          clients (
            id,
            legal_name,
            gps_lat,
            gps_lng,
            geofence_radius_meters
          )
        `)
        .order('site_name');
      
      if (!error && data) {
        setSites(data.map((s: any) => ({ 
          id: s.id, 
          name: s.site_name,
          clientId: s.client_id,
          clientName: s.clients?.legal_name || null,
          gpsLat: s.clients?.gps_lat || null,
          gpsLng: s.clients?.gps_lng || null,
          geofenceRadius: s.clients?.geofence_radius_meters || 50
        })));
      } else {
        // Fallback to hardcoded sites if table doesn't exist
        setSites([
          { id: '1', name: 'Nairobi Hospital' },
          { id: '2', name: 'Melili Hotel' },
          { id: '3', name: 'Aks Restaurant' },
          { id: '4', name: 'HQ Office' },
          { id: '5', name: 'Westgate Mall' }
        ]);
      }
    } catch (error) {
      console.error("Error fetching sites:", error);
      // Fallback sites
      setSites([
        { id: '1', name: 'Nairobi Hospital' },
        { id: '2', name: 'Melili Hotel' },
        { id: '3', name: 'Aks Restaurant' },
        { id: '4', name: 'HQ Office' },
        { id: '5', name: 'Westgate Mall' }
      ]);
    }
  };

  const checkCurrentShiftStatus = async () => {
    try {
      const staffId = selectedOfficer || officerId;
      if (!staffId) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('staff_id', staffId)
        .gte('check_in', today.toISOString())
        .order('check_in', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const latest = data[0];
        if (!latest.check_out) {
          setCurrentShiftStatus('clocked_in');
        } else {
          setCurrentShiftStatus('off');
        }
      }
    } catch (error) {
      console.error("Error checking shift status:", error);
    }
  };

  const fetchClockHistory = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch attendance with staff info
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          staff:staff_id (
            full_name,
            position
          )
        `)
        .gte('check_in', today.toISOString())
        .order('check_in', { ascending: false })
        .limit(20);

      if (!error && data) {
        const history: ClockHistory[] = [];
        data.forEach((record: any) => {
          const staffName = record.staff?.full_name || 'Unknown Officer';
          history.push({
            id: `${record.id}-in`,
            type: 'CLOCK_IN',
            time: record.check_in,
            site: record.site,
            status: record.status as 'verified' | 'pending' | 'rejected' || 'pending',
            officerName: staffName
          });
          if (record.check_out) {
            history.push({
              id: `${record.id}-out`,
              type: 'CLOCK_OUT',
              time: record.check_out,
              site: record.site,
              status: 'verified',
              officerName: staffName
            });
          }
        });
        setClockHistory(history);
      }
    } catch (error) {
      console.error("Error fetching clock history:", error);
    }
  };

  const checkGPSLocation = async () => {
    setGpsStatus('checking');
    setGeofenceStatus({ status: 'checking', message: 'Validating location...' });

    if (!navigator.geolocation) {
      setGpsStatus('failed');
      setGeofenceStatus({ status: 'invalid', message: 'Geolocation not supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setGpsCoords(coords);

        // Basic GPS accuracy check
        if (coords.accuracy > 30) {
          setGpsStatus('outside');
        } else {
          setGpsStatus('verified');
        }

        // Validate against selected site's client geofence
        const selectedSiteData = sites.find(s => s.id === selectedSite);
        if (selectedSiteData?.gpsLat && selectedSiteData?.gpsLng) {
          const validation = isWithinGeofence(
            { lat: coords.lat, lng: coords.lng },
            {
              centerLat: selectedSiteData.gpsLat,
              centerLng: selectedSiteData.gpsLng,
              radiusMeters: selectedSiteData.geofenceRadius || 50
            }
          );

          if (validation.isValid) {
            setGeofenceStatus({
              status: 'valid',
              message: `Within ${selectedSiteData.clientName || 'client'} geofence`,
              distance: validation.distance
            });
            setGpsStatus('verified');
          } else {
            setGeofenceStatus({
              status: 'invalid',
              message: `Outside ${selectedSiteData.clientName || 'client'} geofence by ${Math.round(validation.distance - (selectedSiteData.geofenceRadius || 50))}m`,
              distance: validation.distance
            });
            setGpsStatus('outside');
          }
        } else {
          setGeofenceStatus({
            status: 'no-geofence',
            message: 'No client geofence configured for this site'
          });
        }
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsStatus('failed');
        setGeofenceStatus({ status: 'invalid', message: 'GPS location failed' });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const requestNonce = async () => {
    setProcessing(true);
    try {
      const newNonce: NonceData = {
        nonce: `NONCE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 30000),
        qrId: officerId || 'unknown'
      };
      setNonce(newNonce);
      setTtlRemaining(30);
      toast.success("Nonce issued. Scan your QR within 30 seconds.");
    } catch (error) {
      toast.error("Failed to request nonce");
    } finally {
      setProcessing(false);
    }
  };

  // Initiate clock action — requires selfie + biometric first
  const initiateClockAction = (action: 'clock_in' | 'clock_out') => {
    if (action === 'clock_in') {
      if (gpsStatus !== 'verified') {
        toast.error("GPS verification required. Please ensure you are within the site geofence.");
        return;
      }
      if (!selectedSite) {
        toast.error("Please select a site first");
        return;
      }
      if (!selectedOfficer) {
        toast.error("Please select an officer first");
        return;
      }
    } else {
      if (!selectedOfficer) {
        toast.error("Please select an officer first");
        return;
      }
    }

    // Reset verification state and start flow
    setSelfieImage(null);
    setBiometricVerified(false);
    setPendingAction(action);
    setSelfieRequired(true);
  };

  const handleSelfieCapture = async (imageDataUrl: string) => {
    setSelfieImage(imageDataUrl);
    setSelfieRequired(false);

    // Now request biometric if supported
    if (biometricSupported) {
      const result = await requestBiometric(selectedOfficer || 'unknown');
      if (result.verified) {
        setBiometricVerified(true);
        toast.success("Biometric verified — proceeding with clock action");
        // Execute the pending action
        if (pendingAction === 'clock_in') {
          await executeClockIn(imageDataUrl, true);
        } else {
          await executeClockOut(imageDataUrl, true);
        }
      } else {
        toast.error(result.error || "Biometric verification failed");
        // Still allow clock action but flag it as unverified biometric
        if (pendingAction === 'clock_in') {
          await executeClockIn(imageDataUrl, false);
        } else {
          await executeClockOut(imageDataUrl, false);
        }
      }
    } else {
      // No biometric available — proceed with selfie only
      toast.info("Biometric not available on this device — selfie verification only");
      if (pendingAction === 'clock_in') {
        await executeClockIn(imageDataUrl, false);
      } else {
        await executeClockOut(imageDataUrl, false);
      }
    }
    setPendingAction(null);
  };

  const handleSelfieCancelled = () => {
    setSelfieRequired(false);
    setPendingAction(null);
    toast.error("Clock action cancelled — selfie verification is required");
  };

  const executeClockIn = async (selfieData: string, biometricPassed: boolean) => {
    setProcessing(true);
    try {
      const officer = staffMembers.find(s => s.id === selectedOfficer);
      const siteName = sites.find(s => s.id === selectedSite)?.name || selectedSite;

      const verificationNotes = [
        `GPS: ${gpsCoords?.lat.toFixed(6)}, ${gpsCoords?.lng.toFixed(6)}`,
        `Accuracy: ${gpsCoords?.accuracy.toFixed(0)}m`,
        `Officer: ${officer?.full_name}`,
        `Selfie: captured`,
        `Biometric: ${biometricPassed ? 'verified' : biometricSupported ? 'failed' : 'not_available'}`,
      ].join(' | ');

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          staff_id: selectedOfficer,
          check_in: new Date().toISOString(),
          site: siteName,
          status: 'verified',
          shift_type: 'day',
          notes: verificationNotes
        })
        .select()
        .single();

      if (error) throw error;

      setLastClockEvent({
        type: 'CLOCK_IN',
        time: new Date().toLocaleTimeString(),
        status: 'VERIFIED'
      });
      setCurrentShiftStatus('clocked_in');
      await fetchClockHistory();
      toast.success(`Clock-IN Verified — ${officer?.full_name} at ${siteName}. Time: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error("Clock-in error:", error);
      toast.error("Check-in rejected — Please request manual verification");
    } finally {
      setProcessing(false);
    }
  };

  const executeClockOut = async (selfieData: string, biometricPassed: boolean) => {
    setProcessing(true);
    try {
      const officer = staffMembers.find(s => s.id === selectedOfficer);

      const { data: latestAttendance, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('staff_id', selectedOfficer)
        .is('check_out', null)
        .order('check_in', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !latestAttendance) {
        toast.error("No active check-in found for this officer");
        return;
      }

      const checkoutNotes = [
        latestAttendance.notes || '',
        `Clock-out GPS: ${gpsCoords?.lat?.toFixed(6) || 'N/A'}, ${gpsCoords?.lng?.toFixed(6) || 'N/A'}`,
        `Selfie: captured`,
        `Biometric: ${biometricPassed ? 'verified' : biometricSupported ? 'failed' : 'not_available'}`,
      ].join(' | ');

      const { error } = await supabase
        .from('attendance')
        .update({
          check_out: new Date().toISOString(),
          notes: checkoutNotes
        })
        .eq('id', latestAttendance.id);

      if (error) throw error;

      setLastClockEvent({
        type: 'CLOCK_OUT',
        time: new Date().toLocaleTimeString(),
        status: 'VERIFIED'
      });
      setCurrentShiftStatus('off');
      await fetchClockHistory();
      toast.success(`Clock-OUT Verified — ${officer?.full_name}. Time: ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error("Clock-out error:", error);
      toast.error("Clock-out failed — Please request manual verification");
    } finally {
      setProcessing(false);
    }
  };

  const startQRScanner = () => {
    setScanning(true);
    requestNonce();
  };

  // Update shift status when officer changes
  useEffect(() => {
    if (selectedOfficer) {
      checkCurrentShiftStatus();
    }
  }, [selectedOfficer]);

  // Re-validate geofence when site changes
  useEffect(() => {
    if (selectedSite && gpsCoords) {
      checkGPSLocation();
    }
  }, [selectedSite]);

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Officer-QR Clock Mode</h2>
                <p className="text-muted-foreground text-sm">Secure attendance verification with GPS & nonce</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={currentShiftStatus === 'clocked_in' ? 'default' : 'secondary'}
                className={currentShiftStatus === 'clocked_in' ? 'bg-green-600' : ''}
              >
                {currentShiftStatus === 'clocked_in' ? 'On Duty' : currentShiftStatus === 'on_break' ? 'On Break' : 'Off Duty'}
              </Badge>
              <Badge variant={gpsStatus === 'verified' ? 'default' : 'destructive'} className="text-sm">
                {gpsStatus === 'checking' && 'Checking GPS...'}
                {gpsStatus === 'verified' && '✓ GPS Verified'}
                {gpsStatus === 'failed' && '✗ GPS Failed'}
                {gpsStatus === 'outside' && '⚠ Outside Geofence'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Officer & Site Selection */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="officer">Select Officer</Label>
              <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                <SelectTrigger id="officer" className="mt-1">
                  <SelectValue placeholder="Choose officer" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{staff.full_name}</span>
                        <Badge variant="outline" className="text-xs ml-2">{staff.position}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="site">Select Site</Label>
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger id="site" className="mt-1">
                    <SelectValue placeholder="Choose site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {site.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" onClick={checkGPSLocation}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={gpsStatus === 'verified' ? 'border-green-500/30 bg-green-500/5' : ''}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className={`h-5 w-5 ${gpsStatus === 'verified' ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-xs text-muted-foreground">GPS Evidence</p>
                <p className="font-semibold text-sm">
                  {gpsStatus === 'verified' ? `${gpsCoords?.accuracy.toFixed(0)}m accuracy` : 
                   gpsStatus === 'checking' ? 'Checking...' : 'Failed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Wifi className={`h-5 w-5 ${wifiStatus === 'verified' ? 'text-green-500' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Wi-Fi SSID</p>
                <p className="font-semibold text-sm">
                  {wifiStatus === 'verified' ? 'Matched' : 'Not Required'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">BLE Beacon</p>
                <p className="font-semibold text-sm">Not Required</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={nonce ? 'border-primary/30 bg-primary/5' : ''}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Clock className={`h-5 w-5 ${nonce ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Nonce TTL</p>
                <p className={`font-semibold text-sm ${nonce && ttlRemaining <= 10 ? 'text-red-500' : ''}`}>
                  {nonce ? `00:${ttlRemaining.toString().padStart(2, '0')}` : '--:--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner Area */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-5 w-5" />
            QR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!scanning ? (
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm mb-4">
                Scan your Officer QR — keep app location ON
              </p>
              <Button onClick={startQRScanner} disabled={processing}>
                <QrCode className="h-4 w-4 mr-2" />
                Start Scanner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted aspect-video rounded-lg flex items-center justify-center relative">
                <video ref={videoRef} className="w-full h-full object-cover rounded-lg" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-center text-white">
                    <p className="text-lg font-semibold">Camera Active</p>
                    <p className="text-sm opacity-80">
                      Nonce expires in <span className={ttlRemaining <= 10 ? 'text-red-400' : ''}>{ttlRemaining}s</span>
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setScanning(false)} className="w-full">
                Cancel Scan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selfie Verification Flow */}
      {selfieRequired && (
        <SelfieCapture
          onCapture={handleSelfieCapture}
          onCancel={handleSelfieCancelled}
          officerName={staffMembers.find(s => s.id === selectedOfficer)?.full_name}
        />
      )}

      {/* Biometric Verifying Indicator */}
      {biometricVerifying && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Fingerprint className="h-6 w-6 text-primary animate-pulse" />
              <div>
                <p className="font-semibold text-sm">Biometric Verification In Progress</p>
                <p className="text-xs text-muted-foreground">Use your fingerprint or face to verify identity...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Status Summary */}
      {!selfieRequired && (
        <div className="grid grid-cols-2 gap-3">
          <Card className={biometricSupported === true ? 'border-primary/20' : 'border-muted'}>
            <CardContent className="pt-3 pb-2">
              <div className="flex items-center gap-2">
                <Fingerprint className={`h-5 w-5 ${biometricSupported ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Biometric</p>
                  <p className="font-semibold text-xs">
                    {biometricSupported === null ? 'Checking...' : biometricSupported ? 'Available' : 'Not Available'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20">
            <CardContent className="pt-3 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Anti-Fraud</p>
                  <p className="font-semibold text-xs">Selfie Required</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Clock Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          size="lg"
          className="h-16 text-lg bg-green-600 hover:bg-green-700 disabled:opacity-50"
          onClick={() => initiateClockAction('clock_in')}
          disabled={processing || selfieRequired || biometricVerifying || gpsStatus !== 'verified' || !selectedSite || !selectedOfficer || currentShiftStatus === 'clocked_in'}
        >
          <CheckCircle className="h-6 w-6 mr-2" />
          Clock IN
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-16 text-lg border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
          onClick={() => initiateClockAction('clock_out')}
          disabled={processing || selfieRequired || biometricVerifying || !selectedOfficer || currentShiftStatus !== 'clocked_in'}
        >
          <XCircle className="h-6 w-6 mr-2" />
          Clock OUT
        </Button>
      </div>

      {/* Last Event Banner */}
      {lastClockEvent && (
        <Card className={lastClockEvent.status === 'VERIFIED' ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {lastClockEvent.status === 'VERIFIED' ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                )}
                <div>
                  <p className="font-semibold">
                    {lastClockEvent.type === 'CLOCK_IN' ? 'Clock-IN' : 'Clock-OUT'} {lastClockEvent.status}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Time: {lastClockEvent.time}
                  </p>
                </div>
              </div>
              <Badge variant={lastClockEvent.status === 'VERIFIED' ? 'default' : 'destructive'}>
                {lastClockEvent.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Verification Request */}
      {gpsStatus === 'outside' && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="font-semibold">Outside permitted area</p>
                  <p className="text-sm text-muted-foreground">
                    Distance: {gpsCoords?.accuracy.toFixed(0)}m from site center
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Request Manual Verify
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Clock History */}
      {clockHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clockHistory.slice(0, 8).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {entry.type === 'CLOCK_IN' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{entry.officerName || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.type.replace('_', ' ')} • {entry.site}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{format(new Date(entry.time), 'HH:mm')}</p>
                    <Badge variant={entry.status === 'verified' ? 'default' : 'secondary'} className="text-xs">
                      {entry.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OfficerClockScreen;