import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Zap, AlertTriangle, Radio, Camera, Shield, Bell, 
  Users, FileText, Send, Siren
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CrossModuleQuickActions = () => {
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState<string>('');
  const [emergencyLocation, setEmergencyLocation] = useState('');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [selectedActions, setSelectedActions] = useState({
    createIncident: true,
    dispatchUnit: true,
    notifyClient: false,
    triggerBodyCam: false,
    alertPatrols: false,
    logToOB: true
  });

  const handleEmergencyResponse = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const actions: string[] = [];

      // Create incident
      if (selectedActions.createIncident) {
        const incidentNumber = `INC-${Date.now()}`;
        await supabase.from('incidents').insert([{
          incident_number: incidentNumber,
          incident_type: emergencyType,
          title: `Emergency: ${emergencyType}`,
          location: emergencyLocation,
          description: emergencyDescription,
          severity: 'critical',
          status: 'open',
          occurred_at: new Date().toISOString(),
          reported_by: user.id
        }]);
        actions.push('Incident created');
      }

      // Log to audit trail
      await supabase.from('audit_trail').insert({
        user_id: user.id,
        action: 'EMERGENCY_RESPONSE',
        module: 'control_room',
        changes: {
          type: emergencyType,
          location: emergencyLocation,
          actions: Object.entries(selectedActions).filter(([_, v]) => v).map(([k]) => k)
        }
      });

      // Log to DOB
      if (selectedActions.logToOB) {
        await supabase.from('dob_entries').insert({
          entry_type: 'Emergency Response',
          description: `Emergency: ${emergencyType} at ${emergencyLocation}. ${emergencyDescription}`,
          site_name: emergencyLocation,
          recorded_by: user.id
        });
        actions.push('DOB entry created');
      }

      toast.success(`Emergency response initiated: ${actions.join(', ')}`);
      setEmergencyDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error initiating emergency response:', error);
      toast.error('Failed to initiate emergency response');
    }
  };

  const resetForm = () => {
    setEmergencyType('');
    setEmergencyLocation('');
    setEmergencyDescription('');
    setSelectedActions({
      createIncident: true,
      dispatchUnit: true,
      notifyClient: false,
      triggerBodyCam: false,
      alertPatrols: false,
      logToOB: true
    });
  };

  const handleMassAlert = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('You must be logged in'); return; }

      await supabase.from('audit_trail').insert({
        user_id: user.id,
        action: 'MASS_ALERT',
        module: 'control_room',
        changes: { alert_type: 'mass_alert', timestamp: new Date().toISOString() }
      });
      await supabase.from('dob_entries').insert({
        entry_type: 'Mass Alert',
        description: 'Mass alert sent to all field units by control room operator.',
        site_name: 'All Sites',
        recorded_by: user.id
      });
      toast.success('Mass alert sent to all field units');
    } catch (error) {
      console.error('Mass alert error:', error);
      toast.error('Failed to send mass alert');
    }
  };

  const handleSiteLockdown = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('You must be logged in'); return; }

      await supabase.from('incidents').insert([{
        incident_number: `INC-LOCK-${Date.now()}`,
        incident_type: 'Site Lockdown',
        title: 'Site Lockdown Initiated',
        location: 'All Sites',
        description: 'Site lockdown protocol initiated from control room.',
        severity: 'critical',
        status: 'open',
        occurred_at: new Date().toISOString(),
        reported_by: user.id
      }]);
      await supabase.from('audit_trail').insert({
        user_id: user.id,
        action: 'SITE_LOCKDOWN',
        module: 'control_room',
        changes: { protocol: 'lockdown', timestamp: new Date().toISOString() }
      });
      toast.success('Site lockdown protocol initiated');
    } catch (error) {
      console.error('Site lockdown error:', error);
      toast.error('Failed to initiate lockdown');
    }
  };

  const handleAllHandsDispatch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('You must be logged in'); return; }

      await supabase.from('audit_trail').insert({
        user_id: user.id,
        action: 'ALL_HANDS_DISPATCH',
        module: 'control_room',
        changes: { dispatch_type: 'all_hands', timestamp: new Date().toISOString() }
      });
      await supabase.from('dob_entries').insert({
        entry_type: 'All-Hands Dispatch',
        description: 'All available units deployed by control room.',
        site_name: 'All Sites',
        recorded_by: user.id
      });
      toast.success('All available units deployed');
    } catch (error) {
      console.error('All-hands dispatch error:', error);
      toast.error('Failed to deploy units');
    }
  };

  const quickActions = [
    {
      label: 'Emergency Response',
      description: 'Multi-module emergency action',
      icon: Siren,
      color: 'bg-alert-critical hover:bg-alert-critical/90',
      action: () => setEmergencyDialogOpen(true)
    },
    {
      label: 'Mass Alert',
      description: 'Alert all field units',
      icon: Bell,
      color: 'bg-alert-caution hover:bg-alert-caution/90',
      action: handleMassAlert
    },
    {
      label: 'Site Lockdown',
      description: 'Initiate site lockdown protocol',
      icon: Shield,
      color: 'bg-primary hover:bg-primary/90',
      action: handleSiteLockdown
    },
    {
      label: 'All-Hands Dispatch',
      description: 'Deploy all available units',
      icon: Radio,
      color: 'bg-alert-normal hover:bg-alert-normal/90',
      action: handleAllHandsDispatch
    }
  ];

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-5 h-5 text-primary" />
            Cross-Module Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`w-full justify-start gap-3 ${action.color}`}
            >
              <action.icon className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium">{action.label}</p>
                <p className="text-xs opacity-80">{action.description}</p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="w-5 h-5 text-alert-critical" />
              Emergency Response Protocol
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Emergency Type</Label>
              <Select value={emergencyType} onValueChange={setEmergencyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select emergency type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Armed Robbery">Armed Robbery</SelectItem>
                  <SelectItem value="Fire">Fire</SelectItem>
                  <SelectItem value="Medical Emergency">Medical Emergency</SelectItem>
                  <SelectItem value="Intrusion">Intrusion</SelectItem>
                  <SelectItem value="Assault">Assault</SelectItem>
                  <SelectItem value="Civil Unrest">Civil Unrest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={emergencyLocation}
                onChange={(e) => setEmergencyLocation(e.target.value)}
                placeholder="Enter location or site name"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={emergencyDescription}
                onChange={(e) => setEmergencyDescription(e.target.value)}
                placeholder="Brief description of the emergency"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Actions to Trigger</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedActions).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      checked={value}
                      onCheckedChange={(checked) => 
                        setSelectedActions(prev => ({ ...prev, [key]: checked === true }))
                      }
                    />
                    <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmergencyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEmergencyResponse} 
              className="bg-alert-critical hover:bg-alert-critical/90"
              disabled={!emergencyType || !emergencyLocation}
            >
              <Send className="w-4 h-4 mr-2" />
              Initiate Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CrossModuleQuickActions;
