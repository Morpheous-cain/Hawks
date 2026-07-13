import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OperationalContextFields, emptyOperationalContext, OperationalContextValue } from "@/components/shared/OperationalContextFields";
import { appendContext, uploadContextAttachments } from "@/components/shared/operationalContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const RequestBackupDialog = ({ open, onOpenChange, onSuccess }: Props) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [ctx, setCtx] = useState<OperationalContextValue>(emptyOperationalContext());
  const [formData, setFormData] = useState({
    vehicle_id: "",
    location: "",
    reason: "",
    units_needed: "1",
    priority: "high",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      supabase.from("vehicles").select("id, vehicle_id, status").order("vehicle_id").then(({ data }) => {
        setVehicles(data || []);
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.location.trim() || !formData.reason.trim()) {
      toast.error("Vehicle, location and reason are required");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const message = appendContext(`BACKUP REQUEST: ${formData.units_needed} unit(s) needed at ${formData.location}. Reason: ${formData.reason}.${formData.notes ? ` Notes: ${formData.notes}` : ""}`, ctx);
      const { data: created, error } = await supabase.from("mdt_messages").insert([{
        vehicle_id: formData.vehicle_id,
        sent_by: user.id,
        message_type: "backup_request",
        priority: formData.priority,
        message,
      }] as any).select("id").single();
      if (error) throw error;
      if (created && ctx.attachments.length > 0) {
        await uploadContextAttachments("backup-requests", (created as any).id, ctx.attachments);
      }
      toast.success("Backup request dispatched");
      setFormData({ vehicle_id: "", location: "", reason: "", units_needed: "1", priority: "high", notes: "" });
      setCtx(emptyOperationalContext());
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to request backup");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Backup</DialogTitle>
          <DialogDescription>Dispatch backup units to a location with priority and context.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Send To Vehicle *</Label>
              <Select value={formData.vehicle_id} onValueChange={(v) => setFormData({ ...formData, vehicle_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.vehicle_id} ({v.status})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Units Needed</Label>
              <Input type="number" min={1} max={20} value={formData.units_needed} onChange={(e) => setFormData({ ...formData, units_needed: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Location *</Label>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Site / address / coordinates" required />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Reason *</Label>
              <Input value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g. Active intrusion, officer down" required />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} placeholder="Tactical info, threat type, equipment needed..." />
          </div>
          <OperationalContextFields value={ctx} onChange={setCtx} title="Backup Context" />
          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Dispatching..." : "Dispatch Backup"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
