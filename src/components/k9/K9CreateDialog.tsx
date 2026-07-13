import { useState, useEffect } from "react";
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

interface K9CreateDialogProps {
  onSuccess?: () => void;
}

export const K9CreateDialog = ({ onSuccess }: K9CreateDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [ctx, setCtx] = useState<OperationalContextValue>(emptyOperationalContext());
  const [formData, setFormData] = useState({
    name: "",
    breed: "",
    date_of_birth: "",
    specialty: "",
    handler_id: "",
    status: "available",
    health_status: "excellent",
    microchip_id: "",
    certification_date: "",
    current_location: "",
    notes: "",
  });

  useEffect(() => {
    if (open) fetchStaff();
  }, [open]);

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("id, full_name").eq("status", "active");
    setStaff(data || []);
  };

  const generateK9Id = () => {
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `K9-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: inserted, error } = await (supabase as any)
        .from('k9_units')
        .insert([{
          k9_id: generateK9Id(),
          name: formData.name,
          breed: formData.breed,
          date_of_birth: formData.date_of_birth || null,
          specialty: formData.specialty,
          handler_id: formData.handler_id || null,
          status: formData.status,
          health_status: formData.health_status,
          microchip_id: formData.microchip_id || null,
          certification_date: formData.certification_date || null,
          current_location: formData.current_location || null,
          notes: appendContext(formData.notes, ctx),
          created_by: user?.id,
        }])
        .select('id')
        .single();

      if (error) throw error;
      if (inserted?.id && ctx.attachments.length) {
        await uploadContextAttachments('k9', inserted.id, ctx.attachments);
      }

      toast.success("K9 unit registered successfully");
      setOpen(false);
      setFormData({
        name: "", breed: "", date_of_birth: "", specialty: "", handler_id: "",
        status: "available", health_status: "excellent", microchip_id: "",
        certification_date: "", current_location: "", notes: "",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating K9 unit:", error);
      toast.error("Failed to register K9 unit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" />Add K9 Unit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New K9 Unit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Rex" required />
            </div>
            <div className="space-y-2">
              <Label>Breed *</Label>
              <Select value={formData.breed} onValueChange={(value) => setFormData({ ...formData, breed: value })} required>
                <SelectTrigger><SelectValue placeholder="Select breed" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="German Shepherd">German Shepherd</SelectItem>
                  <SelectItem value="Belgian Malinois">Belgian Malinois</SelectItem>
                  <SelectItem value="Labrador Retriever">Labrador Retriever</SelectItem>
                  <SelectItem value="Dutch Shepherd">Dutch Shepherd</SelectItem>
                  <SelectItem value="Rottweiler">Rottweiler</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Specialty *</Label>
              <Select value={formData.specialty} onValueChange={(value) => setFormData({ ...formData, specialty: value })} required>
                <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Explosives Detection">Explosives Detection</SelectItem>
                  <SelectItem value="Narcotics Detection">Narcotics Detection</SelectItem>
                  <SelectItem value="Search & Rescue">Search & Rescue</SelectItem>
                  <SelectItem value="Patrol & Protection">Patrol & Protection</SelectItem>
                  <SelectItem value="Tracking">Tracking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Handler</Label>
              <Select value={formData.handler_id} onValueChange={(value) => setFormData({ ...formData, handler_id: value })}>
                <SelectTrigger><SelectValue placeholder="Assign handler" /></SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (<SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="deployed">Deployed</SelectItem>
                  <SelectItem value="rest">Rest</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Health Status</Label>
              <Select value={formData.health_status} onValueChange={(value) => setFormData({ ...formData, health_status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Microchip ID</Label>
              <Input value={formData.microchip_id} onChange={(e) => setFormData({ ...formData, microchip_id: e.target.value })} placeholder="Microchip number" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Current Location</Label>
              <Input value={formData.current_location} onChange={(e) => setFormData({ ...formData, current_location: e.target.value })} placeholder="e.g., HQ Kennel" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
          </div>
          <OperationalContextFields value={ctx} onChange={setCtx} showTime={false} />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Registering..." : "Register K9 Unit"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
