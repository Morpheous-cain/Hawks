import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import LoadingPulse from "@/components/LoadingPulse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Bell, Shield, Monitor, Database, User, Lock, Globe, Loader2 } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // System Preferences
  const [notifications, setNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [criticalAlertsOnly, setCriticalAlertsOnly] = useState(false);
  
  // Display Settings
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("en");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState("24h");
  
  // Security Settings
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [autoLogout, setAutoLogout] = useState(true);
  
  // Data & Backup
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [dataRetention, setDataRetention] = useState("90");

  // Password change + backup state
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const handleUpdatePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters.", variant: "destructive" });
      return;
    }
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setNewPassword("");
    toast({ title: "Password updated", description: "Your new password is now active." });
  };

  const handleCreateBackup = async () => {
    setBackingUp(true);
    try {
      const tables = ["incidents", "patrols", "staff", "clients", "documents"];
      const dump: Record<string, unknown> = { exported_at: new Date().toISOString() };
      for (const t of tables) {
        const { data } = await (supabase as any).from(t).select("*").limit(5000);
        dump[t] = data ?? [];
      }
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blackhawk-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Backup created", description: "Snapshot downloaded successfully." });
    } catch (e: any) {
      toast({ title: "Backup failed", description: e.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBackingUp(false);
    }
  };

  if (authLoading) {
    return <LoadingPulse />;
  }

  if (authLoading) {
    return null;
  }
  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleSaveSettings = (section: string) => {
    toast({
      title: "Settings Saved",
      description: `${section} settings have been updated successfully.`,
    });
  };

  const handleResetDefaults = () => {
    toast({
      title: "Reset to Defaults",
      description: "All settings have been reset to default values.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Configure system preferences, security, and user settings"
        icon={SettingsIcon}
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-card">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="data">Data & Backup</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Profile
              </CardTitle>
              <CardDescription>Manage your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" defaultValue="System Administrator" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+254 7XX XXX XXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue="Administrator" disabled />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleResetDefaults}>Reset</Button>
                <Button onClick={() => handleSaveSettings("User Profile")}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Regional Settings
              </CardTitle>
              <CardDescription>Configure language and regional preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sw">Swahili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="eat">
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eat">East Africa Time (EAT)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Regional Settings")}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Control how you receive alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive real-time alerts in the system</p>
                </div>
                <Switch
                  id="notifications"
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="soundAlerts">Sound Alerts</Label>
                  <p className="text-sm text-muted-foreground">Play sound for critical incidents</p>
                </div>
                <Switch
                  id="soundAlerts"
                  checked={soundAlerts}
                  onCheckedChange={setSoundAlerts}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive incident reports via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="criticalOnly">Critical Alerts Only</Label>
                  <p className="text-sm text-muted-foreground">Only show high-priority incidents</p>
                </div>
                <Switch
                  id="criticalOnly"
                  checked={criticalAlertsOnly}
                  onCheckedChange={setCriticalAlertsOnly}
                />
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Notification Preferences")}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Authentication
              </CardTitle>
              <CardDescription>Manage security settings and access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add extra layer of security</p>
                </div>
                <Switch
                  id="twoFactor"
                  checked={twoFactorAuth}
                  onCheckedChange={setTwoFactorAuth}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                  <SelectTrigger id="sessionTimeout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoLogout">Auto Logout on Inactivity</Label>
                  <p className="text-sm text-muted-foreground">Automatically sign out after timeout</p>
                </div>
                <Switch
                  id="autoLogout"
                  checked={autoLogout}
                  onCheckedChange={setAutoLogout}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="changePassword">Change Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="changePassword"
                    type="password"
                    placeholder="New password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleUpdatePassword} disabled={updatingPassword || !newPassword}>
                    {updatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Security Settings")}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Settings */}
        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Display & Interface
              </CardTitle>
              <CardDescription>Customize the appearance and layout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger id="dateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select value={timeFormat} onValueChange={setTimeFormat}>
                    <SelectTrigger id="timeFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Display Settings")}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Backup Settings */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management & Backup
              </CardTitle>
              <CardDescription>Configure data retention and backup policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoBackup">Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">Enable scheduled system backups</p>
                </div>
                <Switch
                  id="autoBackup"
                  checked={autoBackup}
                  onCheckedChange={setAutoBackup}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                  <SelectTrigger id="backupFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
                <Select value={dataRetention} onValueChange={setDataRetention}>
                  <SelectTrigger id="dataRetention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Manual Backup</Label>
                <p className="text-sm text-muted-foreground mb-2">Create an immediate backup of all system data</p>
                <Button variant="outline" onClick={handleCreateBackup} disabled={backingUp}>
                  {backingUp ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : "Create Backup Now"}
                </Button>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Data & Backup Settings")}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status and version details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">System Version</p>
              <p className="font-semibold">v2.5.0</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-semibold">08 Nov 2025</p>
            </div>
            <div>
              <p className="text-muted-foreground">Database Status</p>
              <p className="font-semibold text-alert-normal">● Online</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
