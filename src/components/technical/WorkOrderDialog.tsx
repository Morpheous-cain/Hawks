import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { OperationalContextFields, emptyOperationalContext, OperationalContextValue } from "@/components/shared/OperationalContextFields";
import { appendContext, uploadContextAttachments } from "@/components/shared/operationalContext";

export const WorkOrderDialog = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ctx, setCtx] = useState<OperationalContextValue>(emptyOperationalContext());
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    work_order_type: "maintenance",
    service_category: "maintenance",
    priority: "medium",
    scheduled_date: "",
    hours_spent: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: inserted, error } = await supabase
        .from("technical_work_orders")
        .insert({
          title: formData.title,
          description: appendContext(formData.description, ctx),
          work_order_type: formData.work_order_type,
          service_category: formData.service_category,
          priority: formData.priority,
          scheduled_date: formData.scheduled_date || null,
          hours_spent: formData.hours_spent ? parseInt(formData.hours_spent) : null,
          requested_by: user?.id,
          status: 'pending',
          workflow_stage: 'initiation',
          work_order_number: '',
        })
        .select('id')
        .single();

      if (error) throw error;
      if (inserted?.id && ctx.attachments.length) {
        await uploadContextAttachments('work-order', inserted.id, ctx.attachments);
      }

      toast({
        title: "Success",
        description: "Work order created successfully",
      });

      setOpen(false);
      setFormData({
        title: "",
        description: "",
        work_order_type: "maintenance",
        service_category: "maintenance",
        priority: "medium",
        scheduled_date: "",
        hours_spent: "",
      });
      
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Work Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Work Order</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new technical work order
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., CCTV Camera Alignment"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the work required"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.work_order_type} onValueChange={(value) => setFormData({ ...formData, work_order_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Scheduled Date</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Estimated Hours</Label>
              <Input
                id="hours"
                type="number"
                value={formData.hours_spent}
                onChange={(e) => setFormData({ ...formData, hours_spent: e.target.value })}
                placeholder="Hours"
                min="1"
              />
            </div>
          </div>

          <OperationalContextFields value={ctx} onChange={setCtx} />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Work Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
