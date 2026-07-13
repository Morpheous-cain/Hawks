import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CourierRiderFormProps {
  onSuccess?: () => void;
}

const CourierRiderForm = ({ onSuccess }: CourierRiderFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    riderName: "",
    riderPhone: "",
    riderId: "",
    vehicleType: "",
    vehicleReg: "",
    zone: "",
    status: "active",
  });

  const generateRiderId = () => {
    const num = Math.floor(Math.random() * 900) + 100;
    return `R-${num}`;
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

      const { error } = await (supabase as any)
        .from('courier_riders')
        .insert([{
          rider_id: formData.riderId || generateRiderId(),
          rider_name: formData.riderName,
          phone: formData.riderPhone,
          vehicle_type: formData.vehicleType,
          vehicle_registration: formData.vehicleReg || null,
          zone: formData.zone || null,
          status: formData.status,
          created_by: user.id
        }]);

      if (error) throw error;

      toast.success(`${formData.riderName} has been added successfully`);
      setFormData({
        riderName: "",
        riderPhone: "",
        riderId: "",
        vehicleType: "",
        vehicleReg: "",
        zone: "",
        status: "active",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding rider:', error);
      toast.error('Failed to add rider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bike className="w-5 h-5" />
          Add New Rider
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="riderName">Rider Name *</Label>
              <Input
                id="riderName"
                value={formData.riderName}
                onChange={(e) => setFormData({ ...formData, riderName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="riderPhone">Phone Number *</Label>
              <Input
                id="riderPhone"
                type="tel"
                value={formData.riderPhone}
                onChange={(e) => setFormData({ ...formData, riderPhone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="riderId">Rider ID</Label>
              <Input
                id="riderId"
                value={formData.riderId}
                onChange={(e) => setFormData({ ...formData, riderId: e.target.value })}
                placeholder="Auto-generated if empty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type *</Label>
              <Select
                value={formData.vehicleType}
                onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleReg">Vehicle Registration</Label>
              <Input
                id="vehicleReg"
                value={formData.vehicleReg}
                onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone">Operating Zone</Label>
              <Select
                value={formData.zone}
                onValueChange={(value) => setFormData({ ...formData, zone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nairobi-cbd">Nairobi CBD</SelectItem>
                  <SelectItem value="westlands">Westlands</SelectItem>
                  <SelectItem value="eastlands">Eastlands</SelectItem>
                  <SelectItem value="south">South C/B</SelectItem>
                  <SelectItem value="kilimani">Kilimani</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Rider"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourierRiderForm;
