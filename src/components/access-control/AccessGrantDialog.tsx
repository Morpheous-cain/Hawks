import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { OperationalContextFields, emptyOperationalContext, OperationalContextValue } from "@/components/shared/OperationalContextFields";
import { uploadContextAttachments } from "@/components/shared/operationalContext";

const accessSchema = z.object({
  person_name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  id_number: z.string().trim().min(5, "ID number required").max(20, "ID number too long"),
  access_level: z.string().min(1, "Access level is required"),
  site_id: z.string().min(1, "Site is required"),
  valid_until: z.date().min(new Date(), "Date must be in the future")
});

interface AccessGrantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AccessGrantDialog = ({ open, onOpenChange, onSuccess }: AccessGrantDialogProps) => {
  const [sites, setSites] = useState<any[]>([]);
  const [ctx, setCtx] = useState<OperationalContextValue>(emptyOperationalContext());
  const [formData, setFormData] = useState({
    person_name: "",
    id_number: "",
    access_level: "",
    site_id: "",
    valid_until: new Date()
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchSites();
    }
  }, [open]);

  const fetchSites = async () => {
    const { data } = await supabase
      .from('sites')
      .select('id, site_name, client_id, clients(legal_name)')
      .order('site_name');
    
    setSites(data || []);
  };

  const validateForm = () => {
    try {
      accessSchema.parse(formData);
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

      const accessCardNumber = `AC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create a simple access log record instead since access_cards table doesn't exist
      const { data: inserted, error } = await supabase
        .from('audit_trail')
        .insert([{
          module: 'access_control',
          action: 'grant_access',
          record_id: formData.site_id,
          user_id: user.id,
          changes: {
            person_name: formData.person_name,
            id_number: formData.id_number,
            access_level: formData.access_level,
            site_id: formData.site_id,
            valid_until: formData.valid_until.toISOString().split('T')[0],
            access_card_number: accessCardNumber,
            geo: ctx.geo,
            tags: ctx.tags,
            witnesses: ctx.witnesses,
            voice_note: ctx.voiceNote || null,
          }
        }])
        .select('id')
        .single();

      if (error) throw error;
      if (inserted?.id && ctx.attachments.length) {
        await uploadContextAttachments('access-control', inserted.id, ctx.attachments);
      }

      toast.success('Access granted successfully');
      onSuccess();
      onOpenChange(false);
      setFormData({
        person_name: "",
        id_number: "",
        access_level: "",
        site_id: "",
        valid_until: new Date()
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error granting access:', error);
      toast.error('Failed to grant access');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Grant Access</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Person Name *</Label>
              <Input
                value={formData.person_name}
                onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                placeholder="John Doe"
                className={errors.person_name ? "border-alert-critical" : ""}
                maxLength={100}
              />
              {errors.person_name && <p className="text-sm text-alert-critical">{errors.person_name}</p>}
            </div>

            <div className="space-y-2">
              <Label>ID Number *</Label>
              <Input
                value={formData.id_number}
                onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                placeholder="12345678"
                className={errors.id_number ? "border-alert-critical" : ""}
                maxLength={20}
              />
              {errors.id_number && <p className="text-sm text-alert-critical">{errors.id_number}</p>}
            </div>

            <div className="space-y-2">
              <Label>Access Level *</Label>
              <Select value={formData.access_level} onValueChange={(value) => setFormData({...formData, access_level: value})}>
                <SelectTrigger className={errors.access_level ? "border-alert-critical" : ""}>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitor">Visitor</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="emergency">Emergency Services</SelectItem>
                </SelectContent>
              </Select>
              {errors.access_level && <p className="text-sm text-alert-critical">{errors.access_level}</p>}
            </div>

            <div className="space-y-2">
              <Label>Site *</Label>
              <Select value={formData.site_id} onValueChange={(value) => setFormData({...formData, site_id: value})}>
                <SelectTrigger className={errors.site_id ? "border-alert-critical" : ""}>
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.site_name} ({site.clients?.legal_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.site_id && <p className="text-sm text-alert-critical">{errors.site_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Valid Until *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${errors.valid_until ? "border-alert-critical" : ""}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.valid_until, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.valid_until}
                    onSelect={(date) => date && setFormData({...formData, valid_until: date})}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.valid_until && <p className="text-sm text-alert-critical">{errors.valid_until}</p>}
            </div>
          </div>

          <OperationalContextFields value={ctx} onChange={setCtx} showTime={false} />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Grant Access
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
