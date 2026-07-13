import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { OperationalContextFields, emptyOperationalContext, OperationalContextValue } from "@/components/shared/OperationalContextFields";
import { appendContext, uploadContextAttachments } from "@/components/shared/operationalContext";

interface EscortCreateDialogProps {
  onSuccess?: () => void;
}

export const EscortCreateDialog = ({ onSuccess }: EscortCreateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [ctx, setCtx] = useState<OperationalContextValue>(emptyOperationalContext());
  const [formData, setFormData] = useState({
    client_name: "",
    route_start: "",
    route_end: "",
    vehicles_count: "3",
    officers_count: "6",
    priority: "normal",
    status: "scheduled",
    scheduled_time: "",
    lead_officer_id: "",
    notes: ""
  });

  useEffect(() => {
    if (open) {
      fetchStaff();
    }
  }, [open]);

  const fetchStaff = async () => {
    const { data } = await supabase
      .from('staff')
      .select('id, first_name, last_name, rank')
      .eq('status', 'active')
      .order('last_name');
    setStaff(data || []);
  };

  const generateEscortId = () => {
    const year = new Date().getFullYear();
    const num = Math.floor(Math.random() * 900) + 100;
    return `ESC-${year}-${num}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        setLoading(false);
        return;
      }

      const leadOfficer = staff.find(s => s.id === formData.lead_officer_id);

      const { data: inserted, error } = await (supabase as any)
        .from('escort_missions')
        .insert([{
          escort_id: generateEscortId(),
          client_name: formData.client_name,
          route_start: formData.route_start,
          route_end: formData.route_end,
          vehicles_count: parseInt(formData.vehicles_count),
          officers_count: parseInt(formData.officers_count),
          priority: formData.priority,
          status: formData.status,
          scheduled_time: formData.scheduled_time || null,
          lead_officer_id: formData.lead_officer_id || null,
          lead_officer_name: leadOfficer ? `${leadOfficer.rank || ''} ${leadOfficer.first_name} ${leadOfficer.last_name}`.trim() : null,
          notes: appendContext(formData.notes, ctx),
          created_by: user.id
        }])
        .select('id')
        .single();

      if (error) throw error;
      if (inserted?.id && ctx.attachments.length) {
        await uploadContextAttachments('escort', inserted.id, ctx.attachments);
      }

      toast.success('Escort mission created successfully');
      setOpen(false);
      setFormData({
        client_name: "",
        route_start: "",
        route_end: "",
        vehicles_count: "3",
        officers_count: "6",
        priority: "normal",
        status: "scheduled",
        scheduled_time: "",
        lead_officer_id: "",
        notes: ""
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating escort mission:', error);
      toast.error('Failed to create escort mission');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Escort Mission
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Escort Mission</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Client/VIP Name *</Label>
            <Input
              value={formData.client_name}
              onChange={(e) => setFormData({...formData, client_name: e.target.value})}
              placeholder="e.g., Hon. Cabinet Secretary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Route Start *</Label>
              <Input
                value={formData.route_start}
                onChange={(e) => setFormData({...formData, route_start: e.target.value})}
                placeholder="e.g., State House"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Route End *</Label>
              <Input
                value={formData.route_end}
                onChange={(e) => setFormData({...formData, route_end: e.target.value})}
                placeholder="e.g., JKIA Terminal 3"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Number of Vehicles</Label>
              <Select value={formData.vehicles_count} onValueChange={(value) => setFormData({...formData, vehicles_count: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of Officers</Label>
              <Select value={formData.officers_count} onValueChange={(value) => setFormData({...formData, officers_count: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2,4,6,8,10,12,15,20].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="caution">Caution</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="standby">Standby</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Scheduled Time</Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Lead Officer</Label>
              <Select value={formData.lead_officer_id} onValueChange={(value) => setFormData({...formData, lead_officer_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead officer" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.rank ? `${s.rank} ` : ''}{s.first_name} {s.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Special instructions or requirements"
              rows={3}
            />
          </div>

          <OperationalContextFields value={ctx} onChange={setCtx} />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Mission"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
