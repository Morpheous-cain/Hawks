import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Camera, Battery, Wifi, CheckCircle, AlertCircle, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BodyCamDevice {
  id: string;
  device_id: string;
  serial_number: string;
  device_status: string;
  assigned_to: string | null;
  officer_name: string | null;
  battery_level: number;
  last_sync: string | null;
  recording_quality: string;
}

const DeviceManagement = () => {
  const { toast } = useToast();
  const [devices, setDevices] = useState<BodyCamDevice[]>([]);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    const { data, error } = await supabase
      .from("body_cam_devices")
      .select(`
        id,
        device_id,
        serial_number,
        device_status,
        assigned_to,
        battery_level,
        last_sync,
        recording_quality,
        officer:assigned_to(full_name)
      `)
      .order("device_id", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      });
      return;
    }

    const formattedDevices = data?.map((device: any) => ({
      id: device.id,
      device_id: device.device_id,
      serial_number: device.serial_number,
      device_status: device.device_status,
      assigned_to: device.assigned_to,
      officer_name: device.officer?.full_name || null,
      battery_level: device.battery_level || 0,
      last_sync: device.last_sync,
      recording_quality: device.recording_quality,
    })) || [];

    setDevices(formattedDevices);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-alert-normal">
            <CheckCircle className="w-3 h-3 mr-1" />
            Available
          </Badge>
        );
      case "in_use":
        return (
          <Badge className="bg-blue-500">
            <Wifi className="w-3 h-3 mr-1" />
            In Use
          </Badge>
        );
      case "charging":
        return (
          <Badge className="bg-alert-caution">
            <Battery className="w-3 h-3 mr-1" />
            Charging
          </Badge>
        );
      case "maintenance":
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Maintenance
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level >= 70) return "text-alert-normal";
    if (level >= 30) return "text-alert-caution";
    return "text-alert-critical";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Devices</p>
              <p className="text-3xl font-bold">{devices.length}</p>
            </div>
            <Camera className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Use</p>
              <p className="text-3xl font-bold">
                {devices.filter((d) => d.device_status === "in_use").length}
              </p>
            </div>
            <Wifi className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-3xl font-bold">
                {devices.filter((d) => d.device_status === "available").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-alert-normal" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Maintenance</p>
              <p className="text-3xl font-bold">
                {devices.filter((d) => d.device_status === "maintenance").length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-alert-caution" />
          </div>
        </Card>
      </div>

      {/* Device Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Device Inventory</h3>
          <Button size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Assign Device
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.device_id}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {device.serial_number}
                  </TableCell>
                  <TableCell>{getStatusBadge(device.device_status)}</TableCell>
                  <TableCell>
                    {device.officer_name || (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Battery className={`w-4 h-4 ${getBatteryColor(device.battery_level)}`} />
                      <span className={getBatteryColor(device.battery_level)}>
                        {device.battery_level}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{device.recording_quality}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {device.last_sync
                      ? new Date(device.last_sync).toLocaleString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default DeviceManagement;
