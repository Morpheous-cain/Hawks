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

const dobEntrySchema = z.object({
  entry_type: z.string().min(1, "Entry type is required"),
  site_name: z.string().trim().min(1, "Site name is required").max(200, "Site name too long"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000, "Description too long")
});

interface DOBEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const DOBEntryDialog = ({ open, onOpenChange, onSuccess }: DOBEntryDialogProps) => {
  const [sites, setSites] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    entry_type: "",
    site_name: "",
    description: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ctx, setCtx] = useState<OperationalContextValue>(emptyOperationalContext());

  useEffect(() => {
    if (open) {
      fetchSites();
    }
  }, [open]);

  const fetchSites = async () => {
    const { data } = await supabase
      .from('sites')
      .select('site_name')
      .order('site_name');
    
    setSites(data || []);
  };

  const validateForm = () => {
    try {
      dobEntrySchema.parse(formData);
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

      const { data: created, error } = await supabase
        .from('dob_entries')
        .insert([{
          ...formData,
          description: appendContext(formData.description, ctx),
          recorded_by: user.id,
          entry_time: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (error) throw error;
      if (created && ctx.attachments.length > 0) {
        await uploadContextAttachments('dob', (created as any).id, ctx.attachments);
      }

      toast.success('DOB entry created successfully');
      onSuccess();
      onOpenChange(false);
      setFormData({ entry_type: "", site_name: "", description: "" });
      setCtx(emptyOperationalContext());
      setErrors({});
    } catch (error: any) {
      console.error('Error creating DOB entry:', error);
      toast.error('Failed to create DOB entry');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create DOB Entry</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Entry Type *</Label>
            <Select value={formData.entry_type} onValueChange={(value) => setFormData({...formData, entry_type: value})}>
              <SelectTrigger className={errors.entry_type ? "border-alert-critical" : ""}>
                <SelectValue placeholder="Select entry type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="observation">Observation</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="visitor">Visitor Log</SelectItem>
                <SelectItem value="handover">Shift Handover</SelectItem>
                <SelectItem value="alarm">Alarm Activation</SelectItem>
                <SelectItem value="patrol">Patrol Report</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.entry_type && <p className="text-sm text-alert-critical">{errors.entry_type}</p>}
          </div>

          <div className="space-y-2">
            <Label>Site *</Label>
            <Select value={formData.site_name} onValueChange={(value) => setFormData({...formData, site_name: value})}>
              <SelectTrigger className={errors.site_name ? "border-alert-critical" : ""}>
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.site_name} value={site.site_name}>
                    {site.site_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.site_name && <p className="text-sm text-alert-critical">{errors.site_name}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description * (10-2000 characters)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Detailed description of the entry..."
              rows={6}
              className={errors.description ? "border-alert-critical" : ""}
              maxLength={2000}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{errors.description && <span className="text-alert-critical">{errors.description}</span>}</span>
              <span>{formData.description.length}/2000</span>
            </div>
          </div>

          <OperationalContextFields value={ctx} onChange={setCtx} title="OB Context" />
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
