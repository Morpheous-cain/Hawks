import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  PlusCircle, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Wrench,
  Users,
  Shield,
  Calendar,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ClientPortalServiceRequestsProps {
  clientId?: string;
}

const serviceTypes = [
  { value: 'additional_guards', label: 'Additional Guards', icon: Users },
  { value: 'equipment_repair', label: 'Equipment Repair', icon: Wrench },
  { value: 'security_assessment', label: 'Security Assessment', icon: Shield },
  { value: 'schedule_change', label: 'Schedule Change', icon: Calendar },
  { value: 'general_inquiry', label: 'General Inquiry', icon: AlertTriangle },
];

const ClientPortalServiceRequests = ({ clientId }: ClientPortalServiceRequestsProps) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    description: '',
    priority: 'normal'
  });

  const fetchRequests = useCallback(async () => {
    if (!clientId) return;
    
    try {
      const { data } = await supabase
        .from('communication_tickets')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      setRequests(data || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchRequests();
    }
  }, [clientId, fetchRequests]);

  // Real-time subscription
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('service-requests-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'communication_tickets' },
        () => fetchRequests()
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, fetchRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.subject || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('communication_tickets')
        .insert([{
          client_id: clientId,
          subject: formData.subject,
          message: `[${formData.type}] ${formData.description}`,
          sender_contact: 'client-portal',
          ticket_number: `TKT-${Date.now()}`,
          priority: formData.priority as 'low' | 'normal' | 'high' | 'emergency',
          status: 'new' as const,
          channel: 'web_form' as const
        }]);

      if (error) throw error;

      toast.success('Service request submitted successfully');
      setDialogOpen(false);
      setFormData({ type: '', subject: '', description: '', priority: 'normal' });
      fetchRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'bg-alert-normal text-white';
      case 'open':
        return 'bg-alert-critical text-white';
      case 'in_progress':
      case 'pending':
        return 'bg-alert-caution text-white';
      default:
        return 'bg-muted text-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Live Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-alert-normal animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-sm text-muted-foreground">
            {isLive ? 'Live updates enabled' : 'Connecting...'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" />
          {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Header with New Request Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Service Requests</h2>
          <p className="text-sm text-muted-foreground">Request additional services or report issues</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Service Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Request Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your request"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details about your request..."
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Request Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {serviceTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card 
              key={type.value}
              className="border-border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => {
                setFormData({ ...formData, type: type.value });
                setDialogOpen(true);
              }}
            >
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-2">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">{type.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-alert-critical/10 rounded-lg">
              <Clock className="w-5 h-5 text-alert-critical" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {requests.filter(r => r.status === 'open' || r.status === 'pending').length}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-alert-caution/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-alert-caution" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {requests.filter(r => r.status === 'in_progress').length}
              </p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-alert-normal/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-alert-normal" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {requests.filter(r => r.status === 'resolved' || r.status === 'closed').length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Your Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.length > 0 ? (
            requests.map((request) => (
              <div 
                key={request.id}
                className="p-4 bg-muted/30 rounded-lg border border-border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        #{request.id.slice(0, 8)}
                      </span>
                    </div>
                    <h4 className="font-medium">{request.subject}</h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(request.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {request.message}
                </p>
                {request.response && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Response:</p>
                    <p className="text-sm">{request.response}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <PlusCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No service requests yet</p>
              <p className="text-sm text-muted-foreground">Click "New Request" to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPortalServiceRequests;
