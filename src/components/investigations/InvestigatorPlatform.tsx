import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import InvestigationReportForm from '@/components/InvestigationReportForm';
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Upload,
  Phone,
  Users,
  Shield,
  Camera,
  Folder,
  MessageSquare,
  Calendar,
  ClipboardList,
  Eye,
  Lock,
  Send,
  Scale,
  Briefcase,
  Plus,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getPriorityColor, getStatusColor, severityColors, statusColors } from '@/lib/colors';

interface InvestigationCase {
  id: string;
  incident_number: string;
  title: string;
  description: string;
  incident_type: string;
  severity: string;
  status: string;
  location: string;
  client_id: string;
  site_id: string;
  assigned_to: string;
  occurred_at: string;
  sla_deadline: string;
  created_at: string;
  clients?: { legal_name: string };
  sites?: { site_name: string };
  staff?: { full_name: string };
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
}

const InvestigatorPlatform = () => {
  const [activeTab, setActiveTab] = useState('cases');
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [caseNotes, setCaseNotes] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    incident_type: 'Investigation',
    severity: 'medium',
    location: ''
  });

  useEffect(() => {
    fetchData();
    subscribeToUpdates();
  }, []);

  const fetchData = async () => {
    try {
      const [casesRes, tasksRes] = await Promise.all([
        supabase
          .from('incidents')
          .select(`
            *,
            clients(legal_name),
            sites(site_name),
            staff:assigned_to(full_name)
          `)
          .in('incident_type', ['Investigation', 'Security Breach', 'Theft', 'Misconduct', 'Policy Breach'])
          .order('created_at', { ascending: false }),
        supabase
          .from('tasks')
          .select(`*`)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (casesRes.error) throw casesRes.error;
      setCases(casesRes.data || []);
      
      if (!tasksRes.error && tasksRes.data) {
        setTasks(tasksRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load investigation data');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('investigations-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreateCase = async () => {
    if (!newCase.title || !newCase.location) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('incidents')
        .insert([{
          incident_number: `INV-${Date.now()}`,
          title: newCase.title,
          description: newCase.description,
          incident_type: newCase.incident_type,
          severity: newCase.severity,
          location: newCase.location,
          status: 'open',
          occurred_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      toast.success('Investigation case created');
      setCreateDialogOpen(false);
      setNewCase({ title: '', description: '', incident_type: 'Investigation', severity: 'medium', location: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error creating case:', error);
      toast.error('Failed to create case');
    }
  };

  const handleUpdateStatus = async (caseId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('incidents')
        .update(updates)
        .eq('id', caseId);

      if (error) throw error;
      toast.success(`Case status updated to ${newStatus}`);
      fetchData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAddNotes = async (caseId: string) => {
    if (!caseNotes.trim()) {
      toast.error('Please enter notes');
      return;
    }

    try {
      const caseToUpdate = cases.find(c => c.id === caseId);
      const existingDesc = caseToUpdate?.description || '';
      const timestamp = new Date().toLocaleString();
      const updatedDesc = `${existingDesc}\n\n[${timestamp}] ${caseNotes}`;

      const { error } = await supabase
        .from('incidents')
        .update({ description: updatedDesc })
        .eq('id', caseId);

      if (error) throw error;
      toast.success('Notes added');
      setCaseNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error adding notes:', error);
      toast.error('Failed to add notes');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Task completed');
      fetchData();
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  // Map severity to priority for color lookup
  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-l-alert-critical';
      case 'high': return 'border-l-alert-caution';
      case 'medium': return 'border-l-primary';
      case 'low':
      default: return 'border-l-alert-normal';
    }
  };

  const getTimeRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 0) return 'Overdue';
    if (hours < 24) return `${hours}h remaining`;
    return `${Math.floor(hours / 24)}d remaining`;
  };

  const activeCases = cases.filter(c => c.status !== 'resolved');
  const criticalCases = cases.filter(c => c.severity === 'critical' && c.status !== 'resolved');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Investigator Header */}
      <Card className="bg-card/50 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Investigations Unit</h3>
                <p className="text-sm text-muted-foreground">Case Management Platform</p>
              </div>
            </div>
            <>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </Button>
              <InvestigationReportForm 
                open={createDialogOpen} 
                onOpenChange={(open) => {
                  setCreateDialogOpen(open);
                  if (!open) fetchData();
                }} 
              />
            </>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className={`${statusColors.in_progress.bg} ${statusColors.in_progress.border}`}>
          <CardContent className="p-3 text-center">
            <Folder className={`h-5 w-5 mx-auto ${statusColors.in_progress.text} mb-1`} />
            <p className={`text-2xl font-bold ${statusColors.in_progress.text}`}>{activeCases.length}</p>
            <p className="text-xs text-muted-foreground">Active Cases</p>
          </CardContent>
        </Card>
        <Card className={`${statusColors.critical.bg} ${statusColors.critical.border}`}>
          <CardContent className="p-3 text-center">
            <AlertTriangle className={`h-5 w-5 mx-auto ${statusColors.critical.text} mb-1`} />
            <p className={`text-2xl font-bold ${statusColors.critical.text}`}>{criticalCases.length}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card className={`${statusColors.pending.bg} ${statusColors.pending.border}`}>
          <CardContent className="p-3 text-center">
            <ClipboardList className={`h-5 w-5 mx-auto ${statusColors.pending.text} mb-1`} />
            <p className={`text-2xl font-bold ${statusColors.pending.text}`}>{pendingTasks.length}</p>
            <p className="text-xs text-muted-foreground">Pending Tasks</p>
          </CardContent>
        </Card>
        <Card className={`${statusColors.resolved.bg} ${statusColors.resolved.border}`}>
          <CardContent className="p-3 text-center">
            <CheckCircle className={`h-5 w-5 mx-auto ${statusColors.resolved.text} mb-1`} />
            <p className={`text-2xl font-bold ${statusColors.resolved.text}`}>{cases.filter(c => c.status === 'resolved').length}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cases">My Cases</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="comms">Comms</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">
              {cases.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No investigation cases found</p>
                  <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Case
                  </Button>
                </Card>
              ) : (
                cases.map((case_) => {
                  const priorityColors = getPriorityColor(case_.severity);
                  const statusColorSet = getStatusColor(case_.status);
                  
                  return (
                    <Card key={case_.id} className={`border-l-4 ${getSeverityBorderColor(case_.severity)}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base">{case_.incident_number}</CardTitle>
                              <Badge className={`${priorityColors.bg} ${priorityColors.text} ${priorityColors.border}`}>
                                {case_.severity?.toUpperCase()}
                              </Badge>
                              <Badge className={`${statusColorSet.bg} ${statusColorSet.text} ${statusColorSet.border}`}>
                                {case_.status?.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mt-1">{case_.title}</p>
                          </div>
                          {case_.sla_deadline && (
                            <Badge variant="outline" className={
                              getTimeRemaining(case_.sla_deadline) === 'Overdue' 
                                ? 'border-alert-critical text-alert-critical' 
                                : 'border-alert-caution text-alert-caution'
                            }>
                              <Clock className="h-3 w-3 mr-1" />
                              {getTimeRemaining(case_.sla_deadline)}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{case_.clients?.legal_name || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{case_.incident_type}</span>
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <span>{case_.location}</span>
                          </div>
                        </div>

                        {case_.description && (
                          <div className="p-3 bg-muted/30 rounded border border-border">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{case_.description}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 flex-wrap">
                          {case_.status === 'open' && (
                            <Button size="sm" onClick={() => handleUpdateStatus(case_.id, 'in_progress')}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Start Investigation
                            </Button>
                          )}
                          {case_.status === 'in_progress' && (
                            <Button size="sm" onClick={() => handleUpdateStatus(case_.id, 'resolved')}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark Resolved
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            <Upload className="h-4 w-4 mr-1" />
                            Add Evidence
                          </Button>
                        </div>

                        {/* Quick Notes */}
                        {case_.status !== 'resolved' && (
                          <div className="space-y-2 pt-2 border-t">
                            <Textarea
                              placeholder="Add case notes or findings..."
                              value={caseNotes}
                              onChange={(e) => setCaseNotes(e.target.value)}
                              className="h-16"
                            />
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handleAddNotes(case_.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Add Notes
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No tasks found</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => {
                    const taskStatusColors = getStatusColor(task.status);
                    const taskPriorityColors = getPriorityColor(task.priority);
                    
                    return (
                      <div 
                        key={task.id}
                        className="p-3 border rounded-lg bg-card/50 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{task.title}</p>
                            <Badge className={`${taskPriorityColors.bg} ${taskPriorityColors.text} ${taskPriorityColors.border}`}>
                              {task.priority}
                            </Badge>
                            <Badge className={`${taskStatusColors.bg} ${taskStatusColors.text} ${taskStatusColors.border}`}>
                              {task.status}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                          )}
                        </div>
                        {task.status !== 'completed' && (
                          <Button size="sm" variant="ghost" onClick={() => handleCompleteTask(task.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Camera className="h-6 w-6" />
              <span className="text-xs">Capture Evidence</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span className="text-xs">Interview Witness</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-xs">Submit Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Lock className="h-6 w-6" />
              <span className="text-xs">Secure Evidence</span>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="comms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Communications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Phone className="h-4 w-4" />
                  Call Control Room
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Scale className="h-4 w-4" />
                  Request Legal Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvestigatorPlatform;
