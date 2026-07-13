import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { OperationalContextFields, emptyOperationalContext, OperationalContextValue } from "@/components/shared/OperationalContextFields";
import { appendContext, uploadContextAttachments } from "@/components/shared/operationalContext";

const lossControlSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  site_id: z.string().min(1, "Site is required"),
  incident_category: z.string().min(1, "Category is required"),
  location: z.string().trim().max(500, "Location too long"),
  financial_value: z.number().min(0, "Amount must be positive").max(10000000, "Amount too large"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000, "Description too long")
});

interface LossControlRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const LossControlRecordDialog = ({ open, onOpenChange, onSuccess }: LossControlRecordDialogProps) => {
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [ctx, setCtx] = useState<OperationalContextValue>(emptyOperationalContext());
  const [formData, setFormData] = useState({
    client_id: "",
    site_id: "",
    incident_category: "",
    location: "",
    financial_value: 0,
    description: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open]);

  useEffect(() => {
    if (formData.client_id) {
      fetchSites(formData.client_id);
    }
  }, [formData.client_id]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, legal_name')
      .eq('status', 'active')
      .order('legal_name');
    
    setClients(data || []);
  };

  const fetchSites = async (clientId: string) => {
    const { data } = await supabase
      .from('sites')
      .select('id, site_name')
      .eq('client_id', clientId)
      .order('site_name');
    
    setSites(data || []);
  };

  const validateForm = () => {
    try {
      lossControlSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const { data: inserted, error } = await supabase
        .from('loss_control_records')
        .insert([{
          record_number: `LC-${new Date().getFullYear()}-${Date.now()}`,
          record_type: 'incident',
          incident_description: appendContext(formData.description, ctx),
          severity: formData.financial_value > 50000 ? 'high' : formData.financial_value > 10000 ? 'medium' : 'low',
          category: formData.incident_category,
          client_id: formData.client_id,
          site_id: formData.site_id,
          location: formData.location,
          financial_value: formData.financial_value,
          officer_id: user.id,
          incident_date: new Date().toISOString(),
          status: 'reported'
        }])
        .select('id')
        .single();

      if (error) throw error;
      if (inserted?.id && ctx.attachments.length) {
        await uploadContextAttachments('loss-control', inserted.id, ctx.attachments);
      }

      toast.success('Loss control record created');
      onSuccess();
      onOpenChange(false);
      setFormData({
        client_id: "",
        site_id: "",
        incident_category: "",
        location: "",
        financial_value: 0,
        description: ""
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error creating record:', error);
      toast.error('Failed to create record');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Loss Control Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value, site_id: ""})}>
                <SelectTrigger className={errors.client_id ? "border-alert-critical" : ""}>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.legal_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && <p className="text-sm text-alert-critical">{errors.client_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Site *</Label>
              <Select value={formData.site_id} onValueChange={(value) => setFormData({...formData, site_id: value})} disabled={!formData.client_id}>
                <SelectTrigger className={errors.site_id ? "border-alert-critical" : ""}>
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.site_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.site_id && <p className="text-sm text-alert-critical">{errors.site_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.incident_category} onValueChange={(value) => setFormData({...formData, incident_category: value})}>
                <SelectTrigger className={errors.incident_category ? "border-alert-critical" : ""}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="shrinkage">Shrinkage</SelectItem>
                  <SelectItem value="fraud">Fraud</SelectItem>
                  <SelectItem value="damage">Property Damage</SelectItem>
                  <SelectItem value="robbery">Robbery</SelectItem>
                  <SelectItem value="burglary">Burglary</SelectItem>
                  <SelectItem value="vandalism">Vandalism</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.incident_category && <p className="text-sm text-alert-critical">{errors.incident_category}</p>}
            </div>

            <div className="space-y-2">
              <Label>Estimated Loss (KES)</Label>
              <Input
                type="number"
                value={formData.financial_value}
                onChange={(e) => setFormData({...formData, financial_value: parseFloat(e.target.value) || 0})}
                className={errors.financial_value ? "border-alert-critical" : ""}
                min="0"
                max="10000000"
              />
              {errors.financial_value && <p className="text-sm text-alert-critical">{errors.financial_value}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Specific location of incident..."
              className={errors.location ? "border-alert-critical" : ""}
              maxLength={500}
            />
            {errors.location && <p className="text-sm text-alert-critical">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description * (10-2000 characters)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Detailed description of the incident..."
              rows={6}
              className={errors.description ? "border-alert-critical" : ""}
              maxLength={2000}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{errors.description && <span className="text-alert-critical">{errors.description}</span>}</span>
              <span>{formData.description.length}/2000</span>
            </div>
          </div>

          <OperationalContextFields value={ctx} onChange={setCtx} />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Record
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
