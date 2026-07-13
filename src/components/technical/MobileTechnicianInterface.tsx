import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Camera, CheckCircle, Clock, Wifi, WifiOff, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MobileTechnicianInterface = () => {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [locationVerified, setLocationVerified] = useState(false);

  // Mock work orders - in production, fetch from Supabase
  const workOrders = [
    { id: "1", title: "CCTV Installation", site: "Freedom Airline Terminal", status: "assigned", priority: "high" },
    { id: "2", title: "Access Control Repair", site: "Westgate Mall", status: "in_progress", priority: "critical" },
    { id: "3", title: "Alarm Maintenance", site: "Villa Rosa Kempinski", status: "assigned", priority: "medium" },
  ];

  const verifyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationVerified(true);
          toast({
            title: "Location Verified",
            description: `Checked in at ${position.coords.latitude}, ${position.coords.longitude}`,
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to verify location. Check GPS settings.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos([...photos, ...Array.from(e.target.files)]);
      toast({
        title: "Photos Added",
        description: `${e.target.files.length} photo(s) captured`,
      });
    }
  };

  const updateWorkOrder = async () => {
    if (!selectedWorkOrder) return;

    try {
      // In production, upload photos to Supabase Storage and update work order
      toast({
        title: isOnline ? "Work Order Updated" : "Saved Offline",
        description: isOnline ? "Changes synced to server" : "Will sync when online",
      });
      setNotes("");
      setPhotos([]);
      setLocationVerified(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Unable to update work order",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-success" />
            ) : (
              <WifiOff className="w-5 h-5 text-warning" />
            )}
            <span className="text-sm font-medium text-foreground">
              {isOnline ? "Online - Synced" : "Offline Mode"}
            </span>
          </div>
          {!isOnline && (
            <Button size="sm" variant="outline" onClick={() => setIsOnline(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Retry Sync
            </Button>
          )}
        </div>
      </Card>

      {/* Assigned Work Orders */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">My Work Orders</h3>
        {workOrders.map((order) => (
          <Card
            key={order.id}
            className={`p-4 cursor-pointer transition-all border-border ${
              selectedWorkOrder === order.id ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedWorkOrder(order.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-foreground">{order.title}</h4>
                <p className="text-sm text-muted-foreground">{order.site}</p>
              </div>
              <Badge
                variant={
                  order.priority === "critical"
                    ? "destructive"
                    : order.priority === "high"
                    ? "default"
                    : "secondary"
                }
              >
                {order.priority}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {order.status === "in_progress" ? (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    In Progress
                  </>
                ) : (
                  "Assigned"
                )}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Work Order Details & Actions */}
      {selectedWorkOrder && (
        <Card className="p-4 bg-card border-border space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Site Actions</h3>

          {/* GPS Check-in */}
          <Button
            onClick={verifyLocation}
            disabled={locationVerified}
            variant={locationVerified ? "outline" : "default"}
            className="w-full"
          >
            {locationVerified ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Location Verified
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Check In at Site
              </>
            )}
          </Button>

          {/* Photo Capture */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Capture Photos
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoCapture}
                className="flex-1"
              />
              <Camera className="w-5 h-5 text-muted-foreground" />
            </div>
            {photos.length > 0 && (
              <p className="text-sm text-success mt-2">{photos.length} photo(s) ready</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Service Notes
            </label>
            <Textarea
              placeholder="Enter installation/repair notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Update Button */}
          <Button onClick={updateWorkOrder} className="w-full" disabled={!locationVerified}>
            {isOnline ? "Update Work Order" : "Save Offline"}
          </Button>
        </Card>
      )}
    </div>
  );
};

export default MobileTechnicianInterface;
