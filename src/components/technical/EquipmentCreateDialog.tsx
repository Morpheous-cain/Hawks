import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OperationalContextFields, emptyOperationalContext, OperationalContextValue } from "@/components/shared/OperationalContextFields";
import { appendContext, uploadContextAttachments } from "@/components/shared/operationalContext";

interface EquipmentCreateDialogProps {
  onSuccess?: () => void;
}

export const EquipmentCreateDialog = ({ onSuccess }: EquipmentCreateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ctx, setCtx] = useState<OperationalContextValue>(emptyOperationalContext());
  const [formData, setFormData] = useState({
    equipment_type: "",
    equipment_category: "",
    model_number: "",
    serial_number: "",
    manufacturer: "",
    location_description: "",
    status: "operational",
    health_score: "100",
    installation_date: "",
    warranty_expiry: "",
    lifecycle_stage: "active",
    notes: "",
  });

  const generateEquipmentId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    return `EQ-${year}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: inserted, error } = await supabase
        .from('technical_equipment')
        .insert([{
          equipment_id: generateEquipmentId(),
          equipment_type: formData.equipment_type,
          equipment_category: formData.equipment_category,
          model_number: formData.model_number || null,
          serial_number: formData.serial_number || null,
          manufacturer: formData.manufacturer || null,
          location_description: formData.location_description,
          status: formData.status,
          health_score: parseInt(formData.health_score) || 100,
          installation_date: formData.installation_date || null,
          warranty_expiry: formData.warranty_expiry || null,
          lifecycle_stage: formData.lifecycle_stage,
          notes: appendContext(formData.notes, ctx),
          created_by: user?.id,
        }])
        .select('id')
        .single();

      if (error) throw error;
      if (inserted?.id && ctx.attachments.length) {
        await uploadContextAttachments('technical-equipment', inserted.id, ctx.attachments);
      }

      toast.success("Equipment registered successfully");
      setOpen(false);
      setFormData({
        equipment_type: "",
        equipment_category: "",
        model_number: "",
        serial_number: "",
        manufacturer: "",
        location_description: "",
        status: "operational",
        health_score: "100",
        installation_date: "",
        warranty_expiry: "",
        lifecycle_stage: "active",
        notes: "",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating equipment:", error);
      toast.error("Failed to register equipment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Register Equipment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Equipment Type *</Label>
              <Select
                value={formData.equipment_type}
                onValueChange={(value) => setFormData({ ...formData, equipment_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cctv">CCTV Camera</SelectItem>
                  <SelectItem value="access_control">Access Control</SelectItem>
                  <SelectItem value="electric_fence">Electric Fence</SelectItem>
                  <SelectItem value="alarm">Alarm System</SelectItem>
                  <SelectItem value="intercom">Intercom</SelectItem>
                  <SelectItem value="barrier">Boom Barrier</SelectItem>
                  <SelectItem value="nvr">NVR/DVR</SelectItem>
                  <SelectItem value="sensor">Sensor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.equipment_category}
                onValueChange={(value) => setFormData({ ...formData, equipment_category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="camera">Camera</SelectItem>
                  <SelectItem value="reader">Reader/Scanner</SelectItem>
                  <SelectItem value="energizer">Energizer</SelectItem>
                  <SelectItem value="panel">Control Panel</SelectItem>
                  <SelectItem value="sensor">Sensor</SelectItem>
                  <SelectItem value="recorder">NVR/DVR</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model Number</Label>
              <Input
                value={formData.model_number}
                onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                placeholder="e.g., DS-2CD2385G1"
              />
            </div>

            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Input
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g., Hikvision, ZKTeco"
              />
            </div>

            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Equipment serial number"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Location *</Label>
              <Input
                value={formData.location_description}
                onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                placeholder="e.g., JKIA Terminal 2 - Gate 7"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="faulty">Faulty</SelectItem>
                  <SelectItem value="decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Health Score (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.health_score}
                onChange={(e) => setFormData({ ...formData, health_score: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Installation Date</Label>
              <Input
                type="date"
                value={formData.installation_date}
                onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Warranty Expiry</Label>
              <Input
                type="date"
                value={formData.warranty_expiry}
                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the equipment..."
              rows={3}
            />
          </div>

          <OperationalContextFields value={ctx} onChange={setCtx} showTime={false} />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register Equipment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
