import OperationalMap from "@/components/OperationalMap";
import PageHeader from "@/components/PageHeader";
import { Map as MapIcon } from "lucide-react";

const Map = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Map"
        description="Real-time security operations and location tracking"
        icon={MapIcon}
      />
      <div className="h-[calc(100vh-12rem)]">
        <OperationalMap />
      </div>
    </div>
  );
};

export default Map;
