import { Card } from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";

interface MDTMapProps {
  vehicle: any;
}

const MDTMap = ({ vehicle }: MDTMapProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Map & Navigation</h2>
        <Navigation className="w-5 h-5 text-primary" />
      </div>

      <div className="bg-muted rounded-lg aspect-video flex items-center justify-center mb-4">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Live map view</p>
          <p className="text-sm text-muted-foreground mt-2">
            Current Location: {vehicle.last_gps_lat?.toFixed(6)}, {vehicle.last_gps_lng?.toFixed(6)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Vehicle:</p>
          <p className="font-medium">{vehicle.vehicle_id}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Region:</p>
          <p className="font-medium">{vehicle.region || "N/A"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Last Update:</p>
          <p className="font-medium">
            {vehicle.last_gps_update
              ? new Date(vehicle.last_gps_update).toLocaleTimeString()
              : "Never"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Status:</p>
          <p className="font-medium capitalize">{vehicle.status.replace("_", " ")}</p>
        </div>
      </div>
    </Card>
  );
};

export default MDTMap;
