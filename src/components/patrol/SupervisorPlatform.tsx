import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, MapPin, Clock, CheckCircle, AlertTriangle, 
  MessageSquare, Navigation, Phone, Radio, Users,
  ClipboardCheck, Eye, Shield, Bell, Send, RefreshCw,
  Camera, FileText, Flag, Target, Zap, Calendar, QrCode, CreditCard, Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import QRScanner from '@/components/QRScanner';
import PatrolCheckpointFeed from '@/components/PatrolCheckpointFeed';
import SupervisorPatrolMap from '@/components/patrol/SupervisorPatrolMap';
import PatrolEntryForm from '@/components/PatrolEntryForm';
import DailyOfficerInspection from '@/components/patrol/DailyOfficerInspection';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface Instruction {
  id: string;
  type: 'patrol' | 'inspection' | 'incident' | 'welfare' | 'urgent' | 'routine';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location: string;
  assignedAt: string;
  dueBy: string;
  status: 'pending' | 'acknowledged' | 'in_progress' | 'completed';
  dispatcherId: string;
  dispatcherName: string;
  attachments?: string[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'on_duty' | 'off_duty' | 'on_break' | 'emergency';
  currentLocation: string;
  lastCheckIn: string;
  assignedSite: string;
}

interface SupervisorInfo {
  id: string;
  name: string;
  role: string;
  zone: string;
  shift: string;
  teamSize: number;
}

// Demo roster — supervisors a manager can pick from to inspect their cockpit
const supervisorRoster: SupervisorInfo[] = [
  { id: 'SUP-001', name: 'James Mwangi',   role: 'Site Supervisor',     zone: 'Nairobi CBD Zone',     shift: 'Day Shift (06:00 - 18:00)',   teamSize: 8 },
  { id: 'SUP-002', name: 'Esther Wairimu', role: 'Area Supervisor',     zone: 'Westlands & Parklands', shift: 'Day Shift (06:00 - 18:00)',  teamSize: 12 },
  { id: 'SUP-003', name: 'Brian Otieno',   role: 'Night Supervisor',    zone: 'Industrial Area',      shift: 'Night Shift (18:00 - 06:00)', teamSize: 10 },
  { id: 'SUP-004', name: 'Faith Njoki',    role: 'Mobile QRF Supervisor', zone: 'Nairobi Metro',      shift: 'Rotating 12hr',               teamSize: 6 },
  { id: 'SUP-005', name: 'Kevin Kiprop',   role: 'Patrol Supervisor',   zone: 'Karen & Langata',      shift: 'Day Shift (06:00 - 18:00)',   teamSize: 9 },
  { id: 'SUP-006', name: 'Linda Achieng',  role: 'Retail Site Supervisor', zone: 'Eastleigh & South B', shift: 'Night Shift (18:00 - 06:00)', teamSize: 7 },
];
const demoSupervisorInfo: SupervisorInfo = supervisorRoster[0];

const demoInstructions: Instruction[] = [
  {
    id: 'INS-001',
    type: 'urgent',
    priority: 'critical',
    title: 'Respond to Alarm Activation - KCB Towers',
    description: 'Silent alarm triggered at main entrance. Verify situation and report immediately. Police notified.',
    location: 'KCB Towers, Kencom House, Nairobi CBD',
    assignedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    dueBy: new Date(Date.now() + 10 * 60000).toISOString(),
    status: 'pending',
    dispatcherId: 'DISP-001',
    dispatcherName: 'Control Room'
  },
  {
    id: 'INS-002',
    type: 'inspection',
    priority: 'high',
    title: 'Conduct Guard Welfare Check - All Sites',
    description: 'Perform welfare checks on all guards in your zone. Ensure they have water, food, and are alert. Report any concerns.',
    location: 'All assigned sites in CBD Zone',
    assignedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    dueBy: new Date(Date.now() + 120 * 60000).toISOString(),
    status: 'in_progress',
    dispatcherId: 'DISP-002',
    dispatcherName: 'Operations Manager'
  },
  {
    id: 'INS-003',
    type: 'patrol',
    priority: 'medium',
    title: 'Verify Checkpoint Compliance - Nation Centre',
    description: 'Guard at Nation Centre missed 2 checkpoints. Investigate reason and ensure patrol route is being followed.',
    location: 'Nation Centre, Kimathi Street',
    assignedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    dueBy: new Date(Date.now() + 60 * 60000).toISOString(),
    status: 'acknowledged',
    dispatcherId: 'DISP-001',
    dispatcherName: 'Control Room'
  },
  {
    id: 'INS-004',
    type: 'incident',
    priority: 'high',
    title: 'Incident Report Required - Suspicious Person',
    description: 'Client reported suspicious person loitering near parking entrance. Guard detained individual. Supervisor required for documentation.',
    location: 'Lonrho House, Standard Street',
    assignedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    dueBy: new Date(Date.now() + 30 * 60000).toISOString(),
    status: 'pending',
    dispatcherId: 'DISP-003',
    dispatcherName: 'Incident Desk'
  },
  {
    id: 'INS-005',
    type: 'routine',
    priority: 'low',
    title: 'Collect Daily Reports from Sites',
    description: 'End of shift report collection. Gather DOB entries and incident reports from all assigned sites.',
    location: 'Multiple Sites',
    assignedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    dueBy: new Date(Date.now() + 180 * 60000).toISOString(),
    status: 'pending',
    dispatcherId: 'DISP-002',
    dispatcherName: 'Operations Manager'
  },
  {
    id: 'INS-006',
    type: 'welfare',
    priority: 'medium',
    title: 'Guard Replacement - Anniversary Towers',
    description: 'Guard Peter Ochieng reported sick. Arrange replacement from reserve pool or redistribute coverage.',
    location: 'Anniversary Towers, University Way',
    assignedAt: new Date(Date.now() - 90 * 60000).toISOString(),
    dueBy: new Date(Date.now() + 60 * 60000).toISOString(),
    status: 'completed',
    dispatcherId: 'DISP-001',
    dispatcherName: 'Control Room'
  }
];

const demoTeamMembers: TeamMember[] = [
  { id: 'G001', name: 'Peter Ochieng', role: 'Security Guard', status: 'on_duty', currentLocation: 'KCB Towers - Main Gate', lastCheckIn: '10 min ago', assignedSite: 'KCB Towers' },
  { id: 'G002', name: 'Mary Wanjiku', role: 'Security Guard', status: 'on_duty', currentLocation: 'Nation Centre - Lobby', lastCheckIn: '5 min ago', assignedSite: 'Nation Centre' },
  { id: 'G003', name: 'John Kamau', role: 'Security Guard', status: 'on_break', currentLocation: 'Lonrho House - Break Room', lastCheckIn: '25 min ago', assignedSite: 'Lonrho House' },
  { id: 'G004', name: 'Grace Akinyi', role: 'Security Guard', status: 'on_duty', currentLocation: 'Anniversary Towers - Parking', lastCheckIn: '3 min ago', assignedSite: 'Anniversary Towers' },
  { id: 'G005', name: 'David Mutua', role: 'Security Guard', status: 'on_duty', currentLocation: 'Kimathi House - Reception', lastCheckIn: '8 min ago', assignedSite: 'Kimathi House' },
  { id: 'G006', name: 'Sarah Njeri', role: 'Security Guard', status: 'emergency', currentLocation: 'Stanley Hotel - Entrance', lastCheckIn: '1 min ago', assignedSite: 'Stanley Hotel' },
  { id: 'G007', name: 'Michael Otieno', role: 'Patrol Officer', status: 'on_duty', currentLocation: 'Mobile Patrol - CBD Route', lastCheckIn: '12 min ago', assignedSite: 'Mobile' },
  { id: 'G008', name: 'Lucy Wairimu', role: 'Security Guard', status: 'off_duty', currentLocation: 'Off Duty', lastCheckIn: '6 hrs ago', assignedSite: 'KICC' }
];

// Checkpoints Section Component - handles QR/RFID scanning
const CheckpointsSection = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showRFIDInput, setShowRFIDInput] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string | null>(null);
  const [rfidCardNumber, setRfidCardNumber] = useState("");

  const handleScanSuccess = (checkpointId: string) => {
    setShowScanner(false);
    setShowRFIDInput(false);
    setSelectedCheckpointId(checkpointId);
    setShowEntryForm(true);
  };

  const handleEntryFormSuccess = () => {
    setShowEntryForm(false);
    setSelectedCheckpointId(null);
    toast({
      title: "Success",
      description: "Patrol entry submitted successfully!",
    });
  };

  const handleRFIDScan = async () => {
    if (!rfidCardNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter RFID card number",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, full_name')
        .eq('rfid_card_number', rfidCardNumber.trim())
        .maybeSingle();

      if (staffError || !staff) {
        toast({
          title: "Error",
          description: "Invalid RFID card number",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "RFID Verified",
        description: `Card verified for ${staff.full_name}`,
      });
      setShowRFIDInput(false);
      setRfidCardNumber("");
      setShowEntryForm(true);
    } catch (err) {
      console.error('RFID verification error:', err);
      toast({
        title: "Error",
        description: "Failed to verify RFID card",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold">Checkpoint Verification</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => {
              setShowScanner(true);
              setShowRFIDInput(false);
            }}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Scan QR
          </Button>
          <Button 
            variant="default"
            size="sm"
            onClick={() => {
              setShowRFIDInput(true);
              setShowScanner(false);
            }}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            RFID Card
          </Button>
        </div>
      </div>

      {/* QR Scanner */}
      {showScanner && (
        <div className="mb-6">
          <QRScanner
            patrolId=""
            onScanSuccess={handleScanSuccess}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {/* RFID Input */}
      {showRFIDInput && (
        <Card className="mb-6 border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="w-5 h-5" />
                RFID Card Scanner
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowRFIDInput(false);
                  setRfidCardNumber("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rfid">Scan or Enter RFID Card Number</Label>
              <Input
                id="rfid"
                value={rfidCardNumber}
                onChange={(e) => setRfidCardNumber(e.target.value)}
                placeholder="Tap card on reader or enter number manually"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleRFIDScan();
                  }
                }}
                autoFocus
                className="mt-1"
              />
            </div>
            <Button onClick={handleRFIDScan} className="w-full">
              Verify RFID Card
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Patrol Entry Form */}
      {showEntryForm && (
        <PatrolEntryForm
          patrolId=""
          checkpointId={selectedCheckpointId || undefined}
          onSuccess={handleEntryFormSuccess}
          onCancel={() => {
            setShowEntryForm(false);
            setSelectedCheckpointId(null);
          }}
        />
      )}

      {/* Checkpoint Feed */}
      <PatrolCheckpointFeed />
    </div>
  );
};

export const SupervisorPlatform = () => {
  const [supervisorInfo, setSupervisorInfo] = useState<SupervisorInfo>(demoSupervisorInfo);
  const [instructions, setInstructions] = useState<Instruction[]>(demoInstructions);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(demoTeamMembers);
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null);
  const [responseNote, setResponseNote] = useState('');
  const [activeTab, setActiveTab] = useState('instructions');

  // Quick-action dialog state — drives every Quick Actions button + header actions
  type QuickAction =
    | 'radio' | 'callControl' | 'inspection' | 'welfare' | 'incident'
    | 'flag' | 'radioControl' | 'backup' | 'shiftReport' | 'submitReport';
  const [quickAction, setQuickAction] = useState<QuickAction | null>(null);
  const [quickNote, setQuickNote] = useState('');
  const [contactMember, setContactMember] = useState<{ m: TeamMember; mode: 'call' | 'msg' } | null>(null);
  const [contactNote, setContactNote] = useState('');

  useEffect(() => {
    // Subscribe to real-time instruction updates
    const channel = supabase
      .channel('supervisor-instructions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_requests' }, () => {
        toast({
          title: "New Instruction",
          description: "You have received a new dispatch instruction",
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /** Pull-to-refresh stub — re-fetches dispatch instructions in a real backend wiring */
  const handleRefreshInstructions = () => {
    toast({ title: 'Refreshed', description: 'Dispatch queue is up to date.' });
  };

  /** Open the OS map / dialer in a new tab for the selected instruction */
  const handleNavigate = () => {
    if (!selectedInstruction) return;
    const q = encodeURIComponent(selectedInstruction.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener');
    toast({ title: 'Opening navigation', description: selectedInstruction.location });
  };

  /** Capture-evidence stub: opens device camera in supporting browsers */
  const handleCaptureEvidence = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    (input as HTMLInputElement & { capture?: string }).capture = 'environment';
    input.onchange = () =>
      toast({ title: 'Evidence attached', description: 'Photo queued with this instruction.' });
    input.click();
  };

  /** Submit a quick-action dialog — single funnel for all 6 quick actions */
  const submitQuickAction = () => {
    if (!quickAction) return;
    const labels: Record<QuickAction, string> = {
      radio: 'Radio check sent', callControl: 'Control Room called',
      inspection: 'Inspection logged', welfare: 'Welfare check recorded',
      incident: 'Incident reported', flag: 'Issue flagged to Ops',
      radioControl: 'Radio override sent', backup: 'Backup requested — QRF notified',
      shiftReport: 'Shift report generated', submitReport: 'Report submitted to Control',
    };
    toast({
      title: labels[quickAction],
      description: quickNote.trim() || 'No additional notes.',
      variant: quickAction === 'backup' || quickAction === 'incident' ? 'destructive' : 'default',
    });
    setQuickAction(null);
    setQuickNote('');
  };

  /** Contact a team member (call / message) */
  const submitContact = () => {
    if (!contactMember) return;
    if (contactMember.mode === 'call') {
      toast({ title: `Calling ${contactMember.m.name}`, description: `Site: ${contactMember.m.assignedSite}` });
    } else {
      if (!contactNote.trim()) {
        toast({ title: 'Message empty', description: 'Type a message before sending.', variant: 'destructive' });
        return;
      }
      toast({ title: `Message sent to ${contactMember.m.name}`, description: contactNote });
    }
    setContactMember(null);
    setContactNote('');
  };


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <Zap className="h-4 w-4" />;
      case 'patrol': return <Navigation className="h-4 w-4" />;
      case 'inspection': return <ClipboardCheck className="h-4 w-4" />;
      case 'incident': return <AlertTriangle className="h-4 w-4" />;
      case 'welfare': return <Users className="h-4 w-4" />;
      case 'routine': return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'acknowledged': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-primary/20 text-primary border-primary/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getMemberStatusColor = (status: string) => {
    switch (status) {
      case 'on_duty': return 'bg-green-500';
      case 'off_duty': return 'bg-muted';
      case 'on_break': return 'bg-amber-500';
      case 'emergency': return 'bg-destructive animate-pulse';
      default: return 'bg-muted';
    }
  };

  const handleAcknowledge = (instruction: Instruction) => {
    setInstructions(prev => prev.map(ins => 
      ins.id === instruction.id ? { ...ins, status: 'acknowledged' } : ins
    ));
    toast({
      title: "Instruction Acknowledged",
      description: `You have acknowledged: ${instruction.title}`,
    });
  };

  const handleStartTask = (instruction: Instruction) => {
    setInstructions(prev => prev.map(ins => 
      ins.id === instruction.id ? { ...ins, status: 'in_progress' } : ins
    ));
    toast({
      title: "Task Started",
      description: "Status updated to In Progress",
    });
  };

  const handleComplete = (instruction: Instruction) => {
    setInstructions(prev => prev.map(ins => 
      ins.id === instruction.id ? { ...ins, status: 'completed' } : ins
    ));
    setSelectedInstruction(null);
    setResponseNote('');
    toast({
      title: "Task Completed",
      description: "Instruction marked as completed",
    });
  };

  const handleSendResponse = () => {
    if (!selectedInstruction || !responseNote.trim()) return;
    toast({
      title: "Response Sent",
      description: "Your update has been sent to Control Room",
    });
    setResponseNote('');
  };

  const pendingCount = instructions.filter(i => i.status === 'pending').length;
  const criticalCount = instructions.filter(i => i.priority === 'critical' && i.status !== 'completed').length;
  const activeTeam = teamMembers.filter(m => m.status === 'on_duty' || m.status === 'on_break').length;
  const activeLabel = {
    instructions: 'Instructions',
    inspections: 'Daily Inspections',
    checkpoints: 'Checkpoints',
    livemap: 'Live Map',
    team: 'My Team',
    actions: 'Quick Actions',
    reports: 'Reports',
  }[activeTab] ?? 'Instructions';

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 overflow-x-hidden">
      {/* Supervisor Profile Switcher */}
      <Card className="border-primary/20">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-primary" />
            Viewing supervisor profile
          </div>
          <Select
            value={supervisorInfo.id}
            onValueChange={(id) => {
              const next = supervisorRoster.find((s) => s.id === id);
              if (next) setSupervisorInfo(next);
            }}
          >
            <SelectTrigger className="w-full sm:w-[320px]">
              <SelectValue placeholder="Select a supervisor" />
            </SelectTrigger>
            <SelectContent>
              {supervisorRoster.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — {s.role} · {s.zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Supervisor Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Avatar className="h-14 w-14 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {supervisorInfo.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="break-words text-lg font-bold sm:text-xl">{supervisorInfo.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>{supervisorInfo.role}</span>
                  <span>•</span>
                  <span>{supervisorInfo.zone}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{supervisorInfo.shift}</span>
                  <span>•</span>
                  <Users className="h-3 w-3" />
                  <span>{supervisorInfo.teamSize} Team Members</span>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setQuickAction('radio')}>
                <Radio className="h-4 w-4 mr-2" />
                Radio
              </Button>
              <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setQuickAction('callControl')}>
                <Phone className="h-4 w-4 mr-2" />
                Call Control
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <Card className={pendingCount > 0 ? 'border-amber-500/50 bg-amber-500/10' : ''}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">Pending Tasks</div>
          </CardContent>
        </Card>
        <Card className={criticalCount > 0 ? 'border-destructive/50 bg-destructive/10 animate-pulse' : ''}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{activeTeam}</div>
            <div className="text-xs text-muted-foreground">Active Team</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{instructions.filter(i => i.status === 'completed').length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="lg:hidden">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full bg-muted/50">
              <div className="flex min-w-0 items-center gap-2">
                <SelectValue>{activeLabel}</SelectValue>
                {activeTab === 'instructions' && pendingCount > 0 && (
                  <Badge className="ml-auto h-5 px-1.5 bg-destructive text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instructions">Instructions</SelectItem>
              <SelectItem value="inspections">Daily Inspections</SelectItem>
              <SelectItem value="checkpoints">Checkpoints</SelectItem>
              <SelectItem value="livemap">Live Map</SelectItem>
              <SelectItem value="team">My Team</SelectItem>
              <SelectItem value="actions">Quick Actions</SelectItem>
              <SelectItem value="reports">Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden lg:block -mx-1 overflow-x-auto pb-1">
          <TabsList className="inline-flex w-max min-w-full gap-1">
            <TabsTrigger value="instructions" className="relative whitespace-nowrap">
              <Bell className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Instructions</span>
              <span className="sm:hidden">Tasks</span>
              {pendingCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inspections" className="whitespace-nowrap">
              <ClipboardCheck className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Daily Inspections</span>
              <span className="sm:hidden">Inspect</span>
            </TabsTrigger>
            <TabsTrigger value="checkpoints" className="whitespace-nowrap">
              <MapPin className="h-4 w-4 mr-1.5 sm:mr-2" />
              Checkpoints
            </TabsTrigger>
            <TabsTrigger value="livemap" className="whitespace-nowrap">
              <Activity className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Live Map</span>
              <span className="sm:hidden">Map</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="whitespace-nowrap">
              <Users className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">My Team</span>
              <span className="sm:hidden">Team</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="whitespace-nowrap">
              <Target className="h-4 w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Quick Actions</span>
              <span className="sm:hidden">Actions</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="whitespace-nowrap">
              <FileText className="h-4 w-4 mr-1.5 sm:mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Instructions Tab */}
        <TabsContent value="instructions" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Instructions List */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Dispatch Instructions</CardTitle>
                  <Button variant="ghost" size="sm" onClick={handleRefreshInstructions} aria-label="Refresh instructions">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {instructions
                      .sort((a, b) => {
                        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                        const statusOrder = { pending: 0, acknowledged: 1, in_progress: 2, completed: 3 };
                        if (statusOrder[a.status] !== statusOrder[b.status]) {
                          return statusOrder[a.status] - statusOrder[b.status];
                        }
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                      })
                      .map((instruction) => (
                        <Card 
                          key={instruction.id}
                          className={`cursor-pointer transition-all hover:border-primary/50 ${
                            selectedInstruction?.id === instruction.id ? 'border-primary ring-1 ring-primary' : ''
                          } ${instruction.priority === 'critical' && instruction.status !== 'completed' ? 'border-destructive/50 animate-pulse' : ''}`}
                          onClick={() => setSelectedInstruction(instruction)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2 min-w-0">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div className={`p-1.5 rounded shrink-0 ${getPriorityColor(instruction.priority)}`}>
                                  {getTypeIcon(instruction.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm truncate">{instruction.title}</div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{instruction.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={`text-xs ${getStatusColor(instruction.status)}`}>
                                      {instruction.status.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      From: {instruction.dispatcherName}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Instruction Detail */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Instruction Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedInstruction ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(selectedInstruction.priority)}>
                          {selectedInstruction.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{selectedInstruction.type}</Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{selectedInstruction.title}</h3>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">{selectedInstruction.description}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <div className="text-muted-foreground text-xs">Location</div>
                        <div className="mt-1 flex items-start gap-1">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="min-w-0 break-words">{selectedInstruction.location}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Due By</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-4 w-4 text-amber-500" />
                          {new Date(selectedInstruction.dueBy).toLocaleTimeString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Assigned At</div>
                        <div className="mt-1">{new Date(selectedInstruction.assignedAt).toLocaleTimeString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">From</div>
                        <div className="mt-1">{selectedInstruction.dispatcherName}</div>
                      </div>
                    </div>

                    {/* Response Area */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Add notes or response..."
                        value={responseNote}
                        onChange={(e) => setResponseNote(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={handleSendResponse}
                          disabled={!responseNote.trim()}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Update
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCaptureEvidence} aria-label="Attach photo">
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {selectedInstruction.status === 'pending' && (
                        <Button 
                          className="flex-1"
                          onClick={() => handleAcknowledge(selectedInstruction)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Acknowledge
                        </Button>
                      )}
                      {selectedInstruction.status === 'acknowledged' && (
                        <Button 
                          className="flex-1"
                          onClick={() => handleStartTask(selectedInstruction)}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Start Task
                        </Button>
                      )}
                      {selectedInstruction.status === 'in_progress' && (
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleComplete(selectedInstruction)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleNavigate}>
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Select an instruction to view details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Daily Inspections Tab — supervisor's day-to-day officer check */}
        <TabsContent value="inspections" className="mt-4">
          <DailyOfficerInspection
            supervisorName={supervisorInfo.name}
            officers={teamMembers.map(m => ({
              id: m.id, name: m.name, assignedSite: m.assignedSite, role: m.role,
            }))}
          />
        </TabsContent>

        {/* Checkpoints Tab */}
        <TabsContent value="checkpoints" className="mt-4">
          <CheckpointsSection />
        </TabsContent>

        {/* Live Map Tab */}
        <TabsContent value="livemap" className="mt-4">
          <SupervisorPatrolMap />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>Team Members ({teamMembers.length})</CardTitle>
                  <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="bg-green-500/20">
                    On Duty: {teamMembers.filter(m => m.status === 'on_duty').length}
                  </Badge>
                  <Badge variant="outline" className="bg-amber-500/20">
                    On Break: {teamMembers.filter(m => m.status === 'on_break').length}
                  </Badge>
                  <Badge variant="outline" className="bg-destructive/20">
                    Emergency: {teamMembers.filter(m => m.status === 'emergency').length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teamMembers.map((member) => (
                  <Card key={member.id} className={member.status === 'emergency' ? 'border-destructive animate-pulse' : ''}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${getMemberStatusColor(member.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.role}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{member.currentLocation}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setContactMember({ m: member, mode: 'call' })} aria-label={`Call ${member.name}`}>
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setContactMember({ m: member, mode: 'msg' })} aria-label={`Message ${member.name}`}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs">
                        <span className="text-muted-foreground">Last check-in: {member.lastCheckIn}</span>
                        <Badge variant="outline" className="capitalize">{member.status.replace('_', ' ')}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="actions" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setActiveTab('inspections')}>
              <ClipboardCheck className="h-6 w-6" />
              <span>Start Inspection</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setQuickAction('welfare')}>
              <Users className="h-6 w-6" />
              <span>Welfare Check</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setQuickAction('incident')}>
              <AlertTriangle className="h-6 w-6" />
              <span>Report Incident</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setQuickAction('flag')}>
              <Flag className="h-6 w-6" />
              <span>Flag Issue</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setQuickAction('radioControl')}>
              <Radio className="h-6 w-6" />
              <span>Radio Control</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setQuickAction('backup')}
            >
              <Zap className="h-6 w-6" />
              <span>Request Backup</span>
            </Button>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{instructions.filter(i => i.status === 'completed').length}</div>
                  <div className="text-xs text-muted-foreground">Tasks Completed</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-xs text-muted-foreground">Checkpoints Verified</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-xs text-muted-foreground">Welfare Checks</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">2</div>
                  <div className="text-xs text-muted-foreground">Incidents Handled</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={() => setQuickAction('shiftReport')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Shift Report
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setQuickAction('submitReport')}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit to Control
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick action dialog — single funnel reused by 8 buttons */}
      <Dialog open={!!quickAction} onOpenChange={(o) => { if (!o) { setQuickAction(null); setQuickNote(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {quickAction === 'callControl' ? 'Call Control Room'
                : quickAction === 'shiftReport' ? 'Generate Shift Report'
                : quickAction === 'submitReport' ? 'Submit Report to Control'
                : quickAction === 'radioControl' ? 'Radio Override'
                : quickAction === 'backup' ? 'Request Backup (QRF)'
                : quickAction ?? ''}
            </DialogTitle>
            <DialogDescription>
              Add a short note. This will be logged against {supervisorInfo.name}'s shift.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            placeholder="Details, location, urgency…"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickAction(null)}>Cancel</Button>
            <Button onClick={submitQuickAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Per-member contact dialog */}
      <Dialog open={!!contactMember} onOpenChange={(o) => { if (!o) { setContactMember(null); setContactNote(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {contactMember?.mode === 'call' ? `Call ${contactMember?.m.name}` : `Message ${contactMember?.m.name}`}
            </DialogTitle>
            <DialogDescription>
              {contactMember?.m.role} · {contactMember?.m.assignedSite}
            </DialogDescription>
          </DialogHeader>
          {contactMember?.mode === 'msg' && (
            <Textarea
              autoFocus
              placeholder="Type your message…"
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
              className="min-h-[100px]"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactMember(null)}>Cancel</Button>
            <Button onClick={submitContact}>
              {contactMember?.mode === 'call' ? 'Place Call' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupervisorPlatform;
