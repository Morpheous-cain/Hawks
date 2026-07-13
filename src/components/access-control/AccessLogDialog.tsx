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

interface AccessLogDialogProps {
  onSuccess?: () => void;
}

export const AccessLogDialog = ({ onSuccess }: AccessLogDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    visitor_name: "",
    visitor_id: "",
    visitor_type: "visitor",
    access_point: "",
    client_id: "",
    site_id: "",
    purpose: "",
    vehicle_reg: "",
    badge_number: "",
    host_name: "",
    notes: "",
  });

  useEffect(() => {
    if (open) fetchClients();
  }, [open]);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, legal_name");
    setClients(data || []);
  };

  const fetchSites = async (clientId: string) => {
    const { data } = await supabase.from("sites").select("id, site_name").eq("client_id", clientId);
    setSites(data || []);
  };

  const handleClientChange = (clientId: string) => {
    setFormData({ ...formData, client_id: clientId, site_id: "" });
    fetchSites(clientId);
  };

  const generateLogId = () => {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ACC-${dateStr}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await (supabase as any)
        .from('access_logs')
        .insert([{
          log_id: generateLogId(),
          visitor_name: formData.visitor_name,
          visitor_id_number: formData.visitor_id,
          visitor_type: formData.visitor_type,
          access_point: formData.access_point,
          client_id: formData.client_id || null,
          site_id: formData.site_id || null,
          purpose: formData.purpose,
          vehicle_registration: formData.vehicle_reg || null,
          badge_number: formData.badge_number || null,
          host_name: formData.host_name || null,
          notes: formData.notes || null,
          check_in_time: new Date().toISOString(),
          recorded_by: user?.id,
          status: 'checked_in',
        }]);

      if (error) throw error;

      toast.success("Access log created successfully");
      setOpen(false);
      setFormData({
        visitor_name: "", visitor_id: "", visitor_type: "visitor", access_point: "",
        client_id: "", site_id: "", purpose: "", vehicle_reg: "", badge_number: "",
        host_name: "", notes: "",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating access log:", error);
      toast.error("Failed to create access log");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" />Log Entry</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log New Access Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visitor Name *</Label>
              <Input value={formData.visitor_name} onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })} placeholder="Full name" required />
            </div>
            <div className="space-y-2">
              <Label>ID Number *</Label>
              <Input value={formData.visitor_id} onChange={(e) => setFormData({ ...formData, visitor_id: e.target.value })} placeholder="ID/Passport" required />
            </div>
            <div className="space-y-2">
              <Label>Visitor Type</Label>
              <Select value={formData.visitor_type} onValueChange={(value) => setFormData({ ...formData, visitor_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitor">Visitor</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Access Point *</Label>
              <Input value={formData.access_point} onChange={(e) => setFormData({ ...formData, access_point: e.target.value })} placeholder="e.g., Main Gate" required />
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={formData.client_id} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (<SelectItem key={client.id} value={client.id}>{client.legal_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Site</Label>
              <Select value={formData.site_id} onValueChange={(value) => setFormData({ ...formData, site_id: value })} disabled={!formData.client_id}>
                <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (<SelectItem key={site.id} value={site.id}>{site.site_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Purpose of Visit *</Label>
              <Input value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} placeholder="Reason for visit" required />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Registration</Label>
              <Input value={formData.vehicle_reg} onChange={(e) => setFormData({ ...formData, vehicle_reg: e.target.value })} placeholder="e.g., KAA 123A" />
            </div>
            <div className="space-y-2">
              <Label>Badge Number</Label>
              <Input value={formData.badge_number} onChange={(e) => setFormData({ ...formData, badge_number: e.target.value })} placeholder="Visitor badge" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Host Name</Label>
              <Input value={formData.host_name} onChange={(e) => setFormData({ ...formData, host_name: e.target.value })} placeholder="Person being visited" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Logging..." : "Log Entry"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
