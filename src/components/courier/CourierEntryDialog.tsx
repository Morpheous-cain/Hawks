import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Bike, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { OperationalContextFields, emptyOperationalContext, OperationalContextValue } from "@/components/shared/OperationalContextFields";
import { appendContext, uploadContextAttachments } from "@/components/shared/operationalContext";

interface CourierEntryDialogProps {
  onSuccess?: () => void;
}

export const CourierEntryDialog = ({ onSuccess }: CourierEntryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entryType, setEntryType] = useState<"delivery" | "rider">("delivery");
  const [ctx, setCtx] = useState<OperationalContextValue>(emptyOperationalContext());
  
  // Fetch available riders for assignment
  const { data: availableRiders } = useQuery({
    queryKey: ['available-riders-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courier_riders')
        .select('*')
        .eq('status', 'active')
        .order('rider_name');
      
      if (error) throw error;
      return data;
    },
    enabled: open && entryType === "delivery"
  });

  // Delivery form data
  const [deliveryData, setDeliveryData] = useState({
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
    assignedRiderId: "",
  });

  // Rider form data
  const [riderData, setRiderData] = useState({
    riderName: "",
    riderPhone: "",
    riderId: "",
    vehicleType: "",
    vehicleReg: "",
    zone: "",
  });

  const resetForm = () => {
    setDeliveryData({
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
      assignedRiderId: "",
    });
    setRiderData({
      riderName: "",
      riderPhone: "",
      riderId: "",
      vehicleType: "",
      vehicleReg: "",
      zone: "",
    });
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

      if (entryType === "delivery") {
        const trackingNumber = `DEL-${Date.now().toString(36).toUpperCase()}`;
        const status = deliveryData.assignedRiderId ? 'assigned' : 'pending';
        
        const { data: inserted, error } = await supabase
          .from('courier_deliveries')
          .insert([{
            tracking_number: trackingNumber,
            sender_name: deliveryData.senderName,
            sender_phone: deliveryData.senderPhone,
            sender_address: deliveryData.senderAddress,
            recipient_name: deliveryData.recipientName,
            recipient_phone: deliveryData.recipientPhone,
            recipient_address: deliveryData.recipientAddress,
            package_type: deliveryData.packageType || null,
            package_weight: deliveryData.packageWeight ? parseFloat(deliveryData.packageWeight) : null,
            cod_amount: deliveryData.codAmount ? parseFloat(deliveryData.codAmount) : 0,
            priority: deliveryData.priority,
            notes: appendContext(deliveryData.notes, ctx),
            assigned_rider_id: deliveryData.assignedRiderId || null,
            status: status,
            created_by: user.id
          }])
          .select('id')
          .single();
        if (error) throw error;
        if (inserted?.id && ctx.attachments.length) {
          await uploadContextAttachments('courier', inserted.id, ctx.attachments);
        }
        toast.success(`Delivery created${deliveryData.assignedRiderId ? ' and rider assigned' : ''}`);
      } else {
        const riderId = riderData.riderId || `R-${Math.floor(Math.random() * 900) + 100}`;
        const { error } = await supabase
          .from('courier_riders')
          .insert([{
            rider_id: riderId,
            rider_name: riderData.riderName,
            phone: riderData.riderPhone,
            vehicle_type: riderData.vehicleType,
            vehicle_registration: riderData.vehicleReg || null,
            zone: riderData.zone || null,
            status: 'active',
            created_by: user.id
          }]);
        if (error) throw error;
        toast.success('Rider added successfully');
      }

      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(entryType === "delivery" ? 'Failed to create delivery' : 'Failed to add rider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Courier Operations - New Entry</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Entry Type *</Label>
            <Select value={entryType} onValueChange={(v: "delivery" | "rider") => setEntryType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    New Delivery
                  </div>
                </SelectItem>
                <SelectItem value="rider">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4" />
                    Add Rider/Driver
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {entryType === "delivery" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sender Name *</Label>
                  <Input
                    value={deliveryData.senderName}
                    onChange={(e) => setDeliveryData({...deliveryData, senderName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sender Phone *</Label>
                  <Input
                    value={deliveryData.senderPhone}
                    onChange={(e) => setDeliveryData({...deliveryData, senderPhone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pickup Address *</Label>
                <Textarea
                  value={deliveryData.senderAddress}
                  onChange={(e) => setDeliveryData({...deliveryData, senderAddress: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Name *</Label>
                  <Input
                    value={deliveryData.recipientName}
                    onChange={(e) => setDeliveryData({...deliveryData, recipientName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Phone *</Label>
                  <Input
                    value={deliveryData.recipientPhone}
                    onChange={(e) => setDeliveryData({...deliveryData, recipientPhone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Delivery Address *</Label>
                <Textarea
                  value={deliveryData.recipientAddress}
                  onChange={(e) => setDeliveryData({...deliveryData, recipientAddress: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Package Type</Label>
                  <Select value={deliveryData.packageType} onValueChange={(v) => setDeliveryData({...deliveryData, packageType: v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="parcel">Parcel</SelectItem>
                      <SelectItem value="fragile">Fragile</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={deliveryData.packageWeight}
                    onChange={(e) => setDeliveryData({...deliveryData, packageWeight: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={deliveryData.priority} onValueChange={(v) => setDeliveryData({...deliveryData, priority: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="express">Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Assign Rider/Driver Section */}
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assign Rider/Driver (Optional)
                </Label>
                <Select 
                  value={deliveryData.assignedRiderId || "unassigned"} 
                  onValueChange={(v) => setDeliveryData({...deliveryData, assignedRiderId: v === "unassigned" ? "" : v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select available rider/driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned (assign later)</SelectItem>
                    {availableRiders?.map((rider) => (
                      <SelectItem key={rider.id} value={rider.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rider.rider_name}</span>
                          <span className="text-muted-foreground">({rider.vehicle_type})</span>
                          {rider.zone && <span className="text-xs text-muted-foreground">• {rider.zone}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableRiders?.length === 0 && (
                  <p className="text-xs text-muted-foreground">No riders available. Add a rider first.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>COD Amount (KES)</Label>
                <Input
                  type="number"
                  value={deliveryData.codAmount}
                  onChange={(e) => setDeliveryData({...deliveryData, codAmount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={deliveryData.notes}
                  onChange={(e) => setDeliveryData({...deliveryData, notes: e.target.value})}
                  placeholder="Special instructions..."
                />
              </div>
              <OperationalContextFields value={ctx} onChange={setCtx} />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rider/Driver Name *</Label>
                  <Input
                    value={riderData.riderName}
                    onChange={(e) => setRiderData({...riderData, riderName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    value={riderData.riderPhone}
                    onChange={(e) => setRiderData({...riderData, riderPhone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rider/Driver ID</Label>
                  <Input
                    value={riderData.riderId}
                    onChange={(e) => setRiderData({...riderData, riderId: e.target.value})}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle Type *</Label>
                  <Select value={riderData.vehicleType} onValueChange={(v) => setRiderData({...riderData, vehicleType: v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="bicycle">Bicycle</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vehicle Registration</Label>
                  <Input
                    value={riderData.vehicleReg}
                    onChange={(e) => setRiderData({...riderData, vehicleReg: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Operating Zone</Label>
                  <Select value={riderData.zone} onValueChange={(v) => setRiderData({...riderData, zone: v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
            </>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : entryType === "delivery" ? "Create Delivery" : "Add Rider/Driver"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
