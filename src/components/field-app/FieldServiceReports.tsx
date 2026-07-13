import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Send, Clock, CheckCircle, Wrench } from "lucide-react";
import { format } from "date-fns";

interface ServiceReport {
  id: string;
  work_order_number: string;
  equipment_type: string;
  service_type: string;
  status: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
}

const serviceTypes = [
  { value: "installation", label: "Installation" },
  { value: "repair", label: "Repair" },
  { value: "maintenance", label: "Preventive Maintenance" },
  { value: "inspection", label: "Inspection" },
  { value: "upgrade", label: "Upgrade" },
  { value: "troubleshooting", label: "Troubleshooting" },
];

const equipmentTypes = [
  { value: "cctv", label: "CCTV Camera" },
  { value: "alarm", label: "Alarm System" },
  { value: "access_control", label: "Access Control" },
  { value: "electric_fence", label: "Electric Fence" },
  { value: "intercom", label: "Intercom System" },
  { value: "boom_barrier", label: "Boom Barrier" },
  { value: "other", label: "Other" },
];

const FieldServiceReports = () => {
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [equipmentType, setEquipmentType] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [location, setLocation] = useState("");
  const [findings, setFindings] = useState("");
  const [actionTaken, setActionTaken] = useState("");

  useEffect(() => {
    fetchReports();
    
    const channel = supabase
      .channel('field-work-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technical_work_orders' }, () => {
        fetchReports();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('technical_work_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      const transformedReports: ServiceReport[] = (data || []).map(wo => ({
        id: wo.id,
        work_order_number: wo.work_order_number,
        equipment_type: wo.service_category || '',
        service_type: wo.work_order_type,
        status: wo.status,
        notes: wo.action_taken,
        completed_at: wo.completed_at,
        created_at: wo.created_at
      }));
      
      setReports(transformedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!equipmentType || !serviceType || !location || !findings) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('technical_work_orders').insert({
        work_order_number: `WO-${format(new Date(), 'yyyyMMdd')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        title: `${serviceTypes.find(t => t.value === serviceType)?.label || serviceType} - ${location}`,
        service_category: equipmentType,
        work_order_type: serviceType,
        description: `Location: ${location}\n\nFindings: ${findings}\n\nAction Taken: ${actionTaken}`,
        findings: findings,
        action_taken: actionTaken,
        status: 'completed',
        priority: 'medium',
        completed_at: new Date().toISOString(),
        assigned_to: userData.user?.id,
      });

      if (error) throw error;

      toast.success("Service report submitted");
      
      // Reset form
      setEquipmentType("");
      setServiceType("");
      setLocation("");
      setFindings("");
      setActionTaken("");
      
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error("Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-alert-caution/20 text-alert-caution",
      in_progress: "bg-primary/20 text-primary",
      completed: "bg-alert-normal/20 text-alert-normal",
      closed: "bg-muted text-muted-foreground",
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      {/* Submit Report Form */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Submit Service Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Equipment Type *</Label>
              <Select value={equipmentType} onValueChange={setEquipmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment..." />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service Type *</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service..." />
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
          </div>

          <div className="space-y-2">
            <Label>Location / Client Site *</Label>
            <Input 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter site or client location"
            />
          </div>

          <div className="space-y-2">
            <Label>Findings *</Label>
            <Textarea 
              value={findings} 
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Describe what you found..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Action Taken</Label>
            <Textarea 
              value={actionTaken} 
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="Describe the work performed..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full gap-2" disabled={submitting}>
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-alert-normal mx-auto mb-3" />
                <p className="text-muted-foreground">No reports submitted yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report.id} className="bg-card/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">
                              {report.work_order_number}
                            </span>
                            <Badge className={getStatusBadge(report.status)}>
                              {report.status}
                            </Badge>
                          </div>
                          <p className="font-medium">
                            {equipmentTypes.find(t => t.value === report.equipment_type)?.label || report.equipment_type}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {serviceTypes.find(t => t.value === report.service_type)?.label || report.service_type}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldServiceReports;
