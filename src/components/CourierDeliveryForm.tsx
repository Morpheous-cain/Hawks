import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CourierDeliveryFormProps {
  onSuccess?: () => void;
}

const CourierDeliveryForm = ({ onSuccess }: CourierDeliveryFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    packageType: "",
    packageWeight: "",
    codAmount: "",
    priority: "normal",
    notes: "",
  });

  const generateTrackingNumber = () => {
    return `DEL-${Date.now().toString(36).toUpperCase()}`;
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
        .from('courier_deliveries')
        .insert([{
          tracking_number: generateTrackingNumber(),
          sender_name: formData.senderName,
          sender_phone: formData.senderPhone,
          sender_address: formData.senderAddress,
          recipient_name: formData.recipientName,
          recipient_phone: formData.recipientPhone,
          recipient_address: formData.recipientAddress,
          package_type: formData.packageType || null,
          package_weight: formData.packageWeight ? parseFloat(formData.packageWeight) : null,
          cod_amount: formData.codAmount ? parseFloat(formData.codAmount) : 0,
          priority: formData.priority,
          notes: formData.notes || null,
          created_by: user.id
        }]);

      if (error) throw error;

      toast.success('Delivery created successfully');
      setFormData({
        senderName: "",
        senderPhone: "",
        senderAddress: "",
        recipientName: "",
        recipientPhone: "",
        recipientAddress: "",
        packageType: "",
        packageWeight: "",
        codAmount: "",
        priority: "normal",
        notes: "",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating delivery:', error);
      toast.error('Failed to create delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Create New Delivery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sender Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Sender Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Sender Name *</Label>
                <Input
                  id="senderName"
                  value={formData.senderName}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderPhone">Sender Phone *</Label>
                <Input
                  id="senderPhone"
                  type="tel"
                  value={formData.senderPhone}
                  onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderAddress">Pickup Address *</Label>
              <Textarea
                id="senderAddress"
                value={formData.senderAddress}
                onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Recipient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Recipient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient Name *</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Recipient Phone *</Label>
                <Input
                  id="recipientPhone"
                  type="tel"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientAddress">Delivery Address *</Label>
              <Textarea
                id="recipientAddress"
                value={formData.recipientAddress}
                onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Package Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-4 h-4" />
              Package Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packageType">Package Type</Label>
                <Select
                  value={formData.packageType}
                  onValueChange={(value) => setFormData({ ...formData, packageType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="parcel">Parcel</SelectItem>
                    <SelectItem value="fragile">Fragile</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="packageWeight">Weight (kg)</Label>
                <Input
                  id="packageWeight"
                  type="number"
                  step="0.1"
                  value={formData.packageWeight}
                  onChange={(e) => setFormData({ ...formData, packageWeight: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="codAmount">COD Amount (KES)</Label>
              <Input
                id="codAmount"
                type="number"
                value={formData.codAmount}
                onChange={(e) => setFormData({ ...formData, codAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Special Instructions</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special delivery instructions..."
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Delivery"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourierDeliveryForm;
