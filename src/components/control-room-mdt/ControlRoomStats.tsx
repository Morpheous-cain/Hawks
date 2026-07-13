import { Card } from "@/components/ui/card";
import { Truck, Activity, AlertTriangle, CheckCircle } from "lucide-react";

interface ControlRoomStatsProps {
  vehicles: any[];
  sosAlerts: any[];
}

const ControlRoomStats = ({ vehicles, sosAlerts }: ControlRoomStatsProps) => {
  const activeVehicles = vehicles.filter((v) => v.status !== "off_duty").length;
  const onPatrol = vehicles.filter((v) => v.status === "on_patrol").length;
  const available = vehicles.filter((v) => v.status === "available").length;
  const activeSOS = sosAlerts.filter((a) => a.status === "active").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs sm:text-sm text-foreground/90 font-semibold">Active Vehicles</p>
            <p className="text-2xl sm:text-3xl font-bold">{activeVehicles}</p>
          </div>
          <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs sm:text-sm text-foreground/90 font-semibold">On Patrol</p>
            <p className="text-2xl sm:text-3xl font-bold">{onPatrol}</p>
          </div>
          <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs sm:text-sm text-foreground/90 font-semibold">Available</p>
            <p className="text-2xl sm:text-3xl font-bold">{available}</p>
          </div>
          <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs sm:text-sm text-foreground/90 font-semibold">Active SOS</p>
            <p className="text-2xl sm:text-3xl font-bold">{activeSOS}</p>
          </div>
          <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive" />
        </div>
      </Card>
    </div>
  );
};

export default ControlRoomStats;
