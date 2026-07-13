import { useState } from "react";
import { Settings, MapPin, Clock, Shield, Wifi, Radio, Camera, AlertTriangle, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { modeStateColors } from "@/lib/colors";

interface ClockModeConfig {
  // Mode State
  modeState: 'enabled' | 'offline' | 'maintenance' | 'demo';
  
  // Geofence Settings
  geofenceRadius: number;
  gpsAccuracyMax: number;
  
  // Nonce Settings
  nonceTTL: number;
  
  // Evidence Settings
  evidenceThreshold: number;
  requireWifi: boolean;
  requireBeacon: boolean;
  requireSelfie: boolean;
  requireDeviceAttestation: boolean;
  
  // Offline Settings
  offlineAllowanceWindow: number;
  maxUnsyncedEvents: number;
  
  // Time Settings
  graceperiodMinutes: number;
  autoCloseHours: number;
  
  // Payroll Settings
  payrollPeriod: 'weekly' | 'biweekly' | 'monthly';
  overtimeMultiplier: number;
  nightDifferentialStart: number;
  nightDifferentialEnd: number;
}

const defaultConfig: ClockModeConfig = {
  modeState: 'enabled',
  geofenceRadius: 25,
  gpsAccuracyMax: 30,
  nonceTTL: 30,
  evidenceThreshold: 2,
  requireWifi: false,
  requireBeacon: false,
  requireSelfie: false,
  requireDeviceAttestation: false,
  offlineAllowanceWindow: 60,
  maxUnsyncedEvents: 10,
  graceperiodMinutes: 15,
  autoCloseHours: 12,
  payrollPeriod: 'monthly',
  overtimeMultiplier: 1.5,
  nightDifferentialStart: 22,
  nightDifferentialEnd: 6
};

const ClockModeSettings = () => {
  const [config, setConfig] = useState<ClockModeConfig>(defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);

  const updateConfig = <K extends keyof ClockModeConfig>(key: K, value: ClockModeConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    // In production, save to database
    toast.success("Settings saved successfully");
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Officer-QR Clock Mode Settings
          </h2>
          <p className="text-muted-foreground">Configure geofence, evidence, and payroll settings</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mode Status:</span>
            <Badge className={modeStateColors[config.modeState]}>
              {config.modeState.toUpperCase()}
            </Badge>
          </div>
          <Button onClick={saveSettings} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="geofence">
        <TabsList>
          <TabsTrigger value="geofence">Geofence & GPS</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Rules</TabsTrigger>
          <TabsTrigger value="offline">Offline & Sync</TabsTrigger>
          <TabsTrigger value="payroll">Payroll Rules</TabsTrigger>
          <TabsTrigger value="mode">Mode Control</TabsTrigger>
        </TabsList>

        {/* Geofence Settings */}
        <TabsContent value="geofence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geofence Configuration
              </CardTitle>
              <CardDescription>
                Define the acceptable distance from site center for clock-in/out
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Geofence Radius: {config.geofenceRadius}m</Label>
                <Slider
                  value={[config.geofenceRadius]}
                  onValueChange={([v]) => updateConfig('geofenceRadius', v)}
                  min={10}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Officers must be within this distance from site center
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max GPS Accuracy: {config.gpsAccuracyMax}m</Label>
                <Slider
                  value={[config.gpsAccuracyMax]}
                  onValueChange={([v]) => updateConfig('gpsAccuracyMax', v)}
                  min={10}
                  max={50}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  GPS readings with accuracy worse than this will trigger fallback checks
                </p>
              </div>

              <div className="space-y-2">
                <Label>Nonce TTL: {config.nonceTTL} seconds</Label>
                <Slider
                  value={[config.nonceTTL]}
                  onValueChange={([v]) => updateConfig('nonceTTL', v)}
                  min={15}
                  max={60}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Time window for QR scan after nonce issuance
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Settings */}
        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Evidence Requirements
              </CardTitle>
              <CardDescription>
                Configure multi-evidence acceptance rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Required Evidence Count: {config.evidenceThreshold}</Label>
                <Slider
                  value={[config.evidenceThreshold]}
                  onValueChange={([v]) => updateConfig('evidenceThreshold', v)}
                  min={1}
                  max={4}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum number of evidence types required (e.g., GPS + Wi-Fi = 2)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    <span>Require Wi-Fi SSID</span>
                  </div>
                  <Switch
                    checked={config.requireWifi}
                    onCheckedChange={(v) => updateConfig('requireWifi', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4" />
                    <span>Require BLE Beacon</span>
                  </div>
                  <Switch
                    checked={config.requireBeacon}
                    onCheckedChange={(v) => updateConfig('requireBeacon', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <span>Require Selfie/Liveness</span>
                  </div>
                  <Switch
                    checked={config.requireSelfie}
                    onCheckedChange={(v) => updateConfig('requireSelfie', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Device Attestation</span>
                  </div>
                  <Switch
                    checked={config.requireDeviceAttestation}
                    onCheckedChange={(v) => updateConfig('requireDeviceAttestation', v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offline Settings */}
        <TabsContent value="offline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Offline Mode & Sync
              </CardTitle>
              <CardDescription>
                Configure offline check-in allowances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Offline Allowance Window: {config.offlineAllowanceWindow} minutes</Label>
                <Slider
                  value={[config.offlineAllowanceWindow]}
                  onValueChange={([v]) => updateConfig('offlineAllowanceWindow', v)}
                  min={15}
                  max={120}
                  step={15}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum time events can remain offline before requiring manual verification
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max Unsynced Events: {config.maxUnsyncedEvents}</Label>
                <Slider
                  value={[config.maxUnsyncedEvents]}
                  onValueChange={([v]) => updateConfig('maxUnsyncedEvents', v)}
                  min={5}
                  max={50}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Grace Period for Lateness: {config.graceperiodMinutes} minutes</Label>
                <Slider
                  value={[config.graceperiodMinutes]}
                  onValueChange={([v]) => updateConfig('graceperiodMinutes', v)}
                  min={0}
                  max={30}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Auto-Close Missing OUT: {config.autoCloseHours} hours</Label>
                <Slider
                  value={[config.autoCloseHours]}
                  onValueChange={([v]) => updateConfig('autoCloseHours', v)}
                  min={8}
                  max={24}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Automatically close shifts after this duration if no clock-out recorded
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Settings */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Payroll Configuration
              </CardTitle>
              <CardDescription>
                Configure payroll periods and rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payroll Period</Label>
                  <Select
                    value={config.payrollPeriod}
                    onValueChange={(v) => updateConfig('payrollPeriod', v as 'weekly' | 'biweekly' | 'monthly')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Overtime Multiplier</Label>
                  <Input
                    type="number"
                    value={config.overtimeMultiplier}
                    onChange={(e) => updateConfig('overtimeMultiplier', parseFloat(e.target.value) || 1.5)}
                    step={0.25}
                    min={1}
                    max={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Night Differential Start (24h)</Label>
                  <Input
                    type="number"
                    value={config.nightDifferentialStart}
                    onChange={(e) => updateConfig('nightDifferentialStart', parseInt(e.target.value) || 22)}
                    min={18}
                    max={23}
                  />
                </div>
                <div>
                  <Label>Night Differential End (24h)</Label>
                  <Input
                    type="number"
                    value={config.nightDifferentialEnd}
                    onChange={(e) => updateConfig('nightDifferentialEnd', parseInt(e.target.value) || 6)}
                    min={4}
                    max={8}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mode Control */}
        <TabsContent value="mode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mode State Control</CardTitle>
              <CardDescription>
                Switch between operational modes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {(['enabled', 'offline', 'maintenance', 'demo'] as const).map((mode) => (
                  <Card
                    key={mode}
                    className={`cursor-pointer transition-all ${
                      config.modeState === mode ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'
                    }`}
                    onClick={() => updateConfig('modeState', mode)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${modeStateColors[mode]}`} />
                        <div>
                          <p className="font-semibold capitalize">{mode}</p>
                          <p className="text-xs text-muted-foreground">
                            {mode === 'enabled' && 'Normal operation'}
                            {mode === 'offline' && 'Server unreachable, limited offline'}
                            {mode === 'maintenance' && 'Manual mode only'}
                            {mode === 'demo' && 'Sandbox mode for training'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClockModeSettings;
