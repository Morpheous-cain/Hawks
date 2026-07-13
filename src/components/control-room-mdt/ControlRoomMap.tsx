import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Circle } from "lucide-react";

interface ControlRoomMapProps {
  vehicles: any[];
}

const statusColors: Record<string, string> = {
  available: "bg-green-500",
  on_patrol: "bg-blue-500",
  en_route: "bg-yellow-500",
  on_scene: "bg-orange-500",
  break: "bg-muted",
  off_duty: "bg-slate-500",
  emergency: "bg-red-500 animate-pulse",
};

const ControlRoomMap = ({ vehicles }: ControlRoomMapProps) => {
  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold mb-4">Live Vehicle Tracking</h2>

      <div className="bg-muted rounded-lg aspect-video flex items-center justify-center mb-4 relative">
        <div className="text-center px-4">
          <MapPin className="w-8 h-8 sm:w-12 sm:h-12 text-primary mx-auto mb-2" />
          <p className="text-sm sm:text-base text-foreground/80 font-medium">Live map with vehicle positions</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-sm mb-3">Active Vehicles</h3>
        <div className="grid gap-2">
          {vehicles
            .filter((v) => v.status !== "off_duty")
            .map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted rounded-lg gap-2 sm:gap-0"
              >
                <div className="flex items-center gap-3">
                  <Circle className={`w-3 h-3 ${statusColors[vehicle.status]} flex-shrink-0`} />
                  <div>
                    <p className="font-medium text-sm sm:text-base">{vehicle.vehicle_id}</p>
                    <p className="text-xs text-foreground/80 font-medium">{vehicle.vehicle_type}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <Badge className={statusColors[vehicle.status]} variant="outline">
                    {vehicle.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {vehicle.current_assignment || "Available"}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </Card>
  );
};

export default ControlRoomMap;
