import PageHeader from "@/components/PageHeader";
import { Users } from "lucide-react";
import { RidersManagement } from "@/components/courier/RidersManagement";

const CourierRidersPage = () => (
  <div className="space-y-6">
    <PageHeader
      title="Riders & Drivers"
      description="Black Hawk Courier roster — bikes, vans, zones, on-duty status and contact details."
      icon={Users}
    />
    <RidersManagement />
  </div>
);

export default CourierRidersPage;
